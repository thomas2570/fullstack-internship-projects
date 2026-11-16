from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Workspace, WorkspaceMembership, WorkspaceInvitation, Role
from authentication.serializers import UserSerializer

User = get_user_model()


class WorkspaceSerializer(serializers.ModelSerializer):
    current_user_role = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    projects_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'slug', 'domain', 'plan', 'subscription_status',
            'max_members', 'max_projects', 'max_issues_per_project',
            'created_at', 'current_user_role', 'members_count', 'projects_count'
        ]
        read_only_fields = ['id', 'created_at', 'plan', 'subscription_status']

    def get_current_user_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None

    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_projects_count(self, obj):
        return getattr(obj, 'projects_project_related', None) and obj.projects_project_related.count() or 0


class WorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'slug', 'domain']
        read_only_fields = ['id']

    def validate_slug(self, value):
        slug = value.lower().strip()
        if Workspace.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("This workspace URL identifier is already in use.")
        return slug

    def create(self, validated_data):
        user = self.context['request'].user
        workspace = Workspace.objects.create(owner=user, **validated_data)
        
        # Creator is Owner
        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=user,
            role=Role.OWNER
        )

        # Starter project
        from projects.models import Project
        from boards.models import Board, BoardColumn
        proj = Project.objects.create(
            workspace=workspace,
            name="General",
            key="GEN",
            description="General team sprint workspace",
            lead=user
        )
        board = Board.objects.create(
            workspace=workspace,
            project=proj,
            name="Kanban Board"
        )
        BoardColumn.objects.bulk_create([
            BoardColumn(board=board, name="To Do", order=0, color="#6366F1"),
            BoardColumn(board=board, name="In Progress", order=1, color="#F59E0B"),
            BoardColumn(board=board, name="Review", order=2, color="#8B5CF6"),
            BoardColumn(board=board, name="Done", order=3, color="#10B981", is_done_column=True),
        ])

        return workspace


class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = WorkspaceMembership
        fields = ['id', 'workspace', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'workspace', 'joined_at']


from django.conf import settings


class WorkspaceInvitationSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.ReadOnlyField(source='invited_by.display_name')
    invite_url = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceInvitation
        fields = ['id', 'email', 'role', 'token', 'status', 'invited_by_name', 'invite_url', 'created_at', 'expires_at']
        read_only_fields = ['id', 'token', 'status', 'created_at', 'expires_at']

    def get_invite_url(self, obj):
        return f"{settings.FRONTEND_URL}/invite/{obj.token}"


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Role.choices, default=Role.MEMBER)
