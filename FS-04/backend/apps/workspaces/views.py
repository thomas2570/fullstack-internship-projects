from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

from .models import Workspace, WorkspaceMembership, WorkspaceInvitation, Role, InvitationStatus
from .serializers import (
    WorkspaceSerializer,
    WorkspaceCreateSerializer,
    WorkspaceMembershipSerializer,
    WorkspaceInvitationSerializer,
    InviteMemberSerializer
)
from authentication.serializers import UserSerializer
from .permissions import IsWorkspaceMember, IsWorkspaceAdmin, IsWorkspaceOwner
from audit.utils import log_audit_event

User = get_user_model()


class WorkspaceListCreateView(generics.ListCreateAPIView):
    """List all workspaces the current user has access to, or create a new one."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WorkspaceCreateSerializer
        return WorkspaceSerializer

    def get_queryset(self):
        return Workspace.objects.filter(memberships__user=self.request.user)


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a workspace."""
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsWorkspaceAdmin()]
        if self.request.method == 'DELETE':
            return [IsWorkspaceOwner()]
        return [IsWorkspaceMember()]

    def get_object(self):
        workspace_id = self.kwargs.get('id')
        workspace = get_object_or_404(Workspace, id=workspace_id)
        # Verify user has membership
        if not workspace.memberships.filter(user=self.request.user).exists():
            self.permission_denied(self.request)
        return workspace


class WorkspaceMembersView(generics.ListAPIView):
    """List all members of the active workspace."""
    serializer_class = WorkspaceMembershipSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        workspace = self.request.workspace
        return WorkspaceMembership.objects.filter(workspace=workspace).select_related('user')


class WorkspaceMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage roles or remove members from workspace."""
    serializer_class = WorkspaceMembershipSerializer
    permission_classes = [IsWorkspaceAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return WorkspaceMembership.objects.filter(workspace=self.request.workspace)

    def perform_destroy(self, instance):
        if instance.role == Role.OWNER:
            raise permissions.exceptions.PermissionDenied("Cannot remove workspace owner.")
        instance.delete()


class InviteMemberView(APIView):
    """Send an invitation or directly add existing user if already signed up."""
    permission_classes = [IsWorkspaceAdmin]

    def post(self, request):
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].lower()
        role = serializer.validated_data['role']
        workspace = request.workspace

        # Quota check
        if workspace.memberships.count() >= workspace.max_members:
            return Response(
                {"detail": f"Workspace member quota reached ({workspace.max_members} max). Upgrade your plan to invite more team members."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already a member
        existing_user = User.objects.filter(email=email).first()
        if existing_user and WorkspaceMembership.objects.filter(workspace=workspace, user=existing_user).exists():
            return Response({"detail": "User is already a member of this workspace."}, status=status.HTTP_400_BAD_REQUEST)

        # Direct add if user exists, else create invite
        if existing_user:
            membership = WorkspaceMembership.objects.create(
                workspace=workspace,
                user=existing_user,
                role=role
            )
            log_audit_event(
                workspace=workspace,
                actor=request.user,
                action="MEMBER_ADDED",
                target_type="WorkspaceMembership",
                target_id=str(membership.id),
                changes={"email": email, "role": role}
            )
            return Response(WorkspaceMembershipSerializer(membership).data, status=status.HTTP_201_CREATED)

        # Check if already pending invite exists, reuse or create fresh
        invitation = WorkspaceInvitation.objects.filter(
            workspace=workspace,
            email=email,
            status=InvitationStatus.PENDING
        ).first()

        if not invitation:
            invitation = WorkspaceInvitation.objects.create(
                workspace=workspace,
                email=email,
                role=role,
                invited_by=request.user
            )
        else:
            invitation.role = role
            invitation.save()
        invite_url = f"{settings.FRONTEND_URL}/invite/{invitation.token}"

        # Attempt sending email via configured backend (SMTP / Console)
        email_sent = False
        try:
            subject = f"Invitation: Join {workspace.name} on AgilePlatform"
            body = (
                f"Hello,\n\n"
                f"{request.user.display_name} has invited you to collaborate in the workspace '{workspace.name}' as a {role.capitalize()}.\n\n"
                f"Accept your invitation here:\n"
                f"{invite_url}\n\n"
                f"This invitation will expire in 7 days.\n\n"
                f"The AgilePlatform Team"
            )
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; padding: 30px; margin: 0;">
              <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="margin-bottom: 24px; text-align: center;">
                  <span style="background: #4f46e5; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 16px; letter-spacing: -0.5px;">
                    AgilePlatform
                  </span>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 12px; text-align: center;">
                  You've been invited to join {workspace.name}
                </h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                  <strong>{request.user.display_name}</strong> has invited you to collaborate on projects, sprints, and boards in <strong>{workspace.name}</strong> as a <strong>{role.capitalize()}</strong>.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="{invite_url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block;">
                    Accept Invitation & Join Team
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 0;">
                  Or copy and open this link: <a href="{invite_url}" style="color: #6366f1;">{invite_url}</a>
                </p>
              </div>
            </body>
            </html>
            """
            send_mail(
                subject=subject,
                message=body,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )
            email_sent = True
        except Exception as mail_err:
            logger.warning(f"Email delivery note: {mail_err}")

        log_audit_event(
            workspace=workspace,
            actor=request.user,
            action="INVITATION_SENT",
            target_type="WorkspaceInvitation",
            target_id=str(invitation.id),
            changes={"email": email, "role": role, "email_dispatched": email_sent}
        )

        res_data = WorkspaceInvitationSerializer(invitation).data
        res_data['invite_url'] = invite_url
        res_data['email_sent'] = email_sent
        return Response(res_data, status=status.HTTP_201_CREATED)


class WorkspaceInvitationsListView(generics.ListAPIView):
    """List pending invitations for the workspace."""
    serializer_class = WorkspaceInvitationSerializer
    permission_classes = [IsWorkspaceAdmin]

    def get_queryset(self):
        return WorkspaceInvitation.objects.filter(
            workspace=self.request.workspace,
            status=InvitationStatus.PENDING
        )


class RevokeInvitationView(APIView):
    """Revoke or cancel a pending invitation."""
    permission_classes = [IsWorkspaceAdmin]

    def delete(self, request, id):
        invitation = get_object_or_404(WorkspaceInvitation, id=id, workspace=request.workspace)
        invitation.status = InvitationStatus.REVOKED
        invitation.save()
        return Response({"status": "revoked"})


class AcceptInvitationView(APIView):
    """
    Handle invitation inspection and acceptance.
    Supports authenticated users as well as guest onboarding (registering new employee or signing in).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        invitation = get_object_or_404(WorkspaceInvitation, token=token)
        if not invitation.is_valid():
            return Response({
                "detail": "This invitation link is expired or has already been used.",
                "is_valid": False,
                "status": invitation.status
            }, status=status.HTTP_400_BAD_REQUEST)

        user_exists = User.objects.filter(email__iexact=invitation.email).exists()
        inviter_name = invitation.invited_by.display_name if invitation.invited_by else "Team Admin"

        return Response({
            "workspace_name": invitation.workspace.name,
            "email": invitation.email,
            "role": invitation.role,
            "inviter_name": inviter_name,
            "is_valid": True,
            "user_exists": user_exists,
            "status": invitation.status
        })

    def post(self, request, token):
        invitation = get_object_or_404(WorkspaceInvitation, token=token)
        if not invitation.is_valid():
            return Response({"detail": "This invitation link is expired or has already been used."}, status=status.HTTP_400_BAD_REQUEST)

        workspace = invitation.workspace

        # Quota check
        if workspace.memberships.count() >= workspace.max_members:
            return Response({
                "detail": f"Workspace '{workspace.name}' has reached its maximum member limit ({workspace.max_members})."
            }, status=status.HTTP_400_BAD_REQUEST)

        target_user = None

        if request.user and request.user.is_authenticated:
            target_user = request.user
        else:
            email = invitation.email.lower()
            password = request.data.get('password')
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()

            existing_user = User.objects.filter(email__iexact=email).first()

            if existing_user:
                if not password:
                    return Response({"detail": "Please enter your password to sign in and accept this invitation."}, status=status.HTTP_400_BAD_REQUEST)
                if not existing_user.check_password(password):
                    return Response({"detail": "Incorrect password. Please verify and try again."}, status=status.HTTP_400_BAD_REQUEST)
                target_user = existing_user
            else:
                if not password or len(password) < 6:
                    return Response({"detail": "Password must be at least 6 characters long."}, status=status.HTTP_400_BAD_REQUEST)
                target_user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name or email.split('@')[0],
                    last_name=last_name
                )

        # Create or update membership
        membership, created = WorkspaceMembership.objects.get_or_create(
            workspace=workspace,
            user=target_user,
            defaults={'role': invitation.role}
        )
        if not created and membership.role != invitation.role:
            membership.role = invitation.role
            membership.save()

        invitation.status = InvitationStatus.ACCEPTED
        invitation.save()

        log_audit_event(
            workspace=workspace,
            actor=target_user,
            action="INVITATION_ACCEPTED",
            target_type="WorkspaceMembership",
            target_id=str(membership.id),
            changes={"email": invitation.email, "role": invitation.role}
        )

        refresh = RefreshToken.for_user(target_user)
        user_data = UserSerializer(target_user).data

        memberships = target_user.workspace_memberships.select_related('workspace').all()
        workspaces_data = [
            {
                'id': str(m.workspace.id),
                'name': m.workspace.name,
                'slug': m.workspace.slug,
                'role': m.role,
                'plan': m.workspace.plan
            }
            for m in memberships
        ]

        return Response({
            "message": f"Successfully joined {workspace.name}!",
            "workspace_id": str(workspace.id),
            "user": user_data,
            "workspaces": workspaces_data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_200_OK)


class WorkspaceOverviewStatsView(APIView):
    """Provides high-level dashboard metrics for the tenant."""
    permission_classes = [IsWorkspaceMember]

    def get(self, request):
        ws = request.workspace
        total_projects = ws.projects.count() if hasattr(ws, 'projects') else 0
        total_members = ws.memberships.count()
        
        from issues.models import Issue
        from sprints.models import Sprint, SprintStatus
        
        total_issues = Issue.objects.filter(project__workspace=ws).count()
        completed_issues = Issue.objects.filter(project__workspace=ws, board_column__is_done_column=True).count()
        active_sprints = Sprint.objects.filter(project__workspace=ws, status=SprintStatus.ACTIVE).count()

        return Response({
            "workspace_name": ws.name,
            "plan": ws.plan,
            "total_members": total_members,
            "total_projects": total_projects,
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "active_sprints": active_sprints,
            "quotas": {
                "max_members": ws.max_members,
                "max_projects": ws.max_projects,
                "max_issues_per_project": ws.max_issues_per_project,
            }
        })
