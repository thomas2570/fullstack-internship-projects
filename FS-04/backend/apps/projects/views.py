from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Project, ProjectMember
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectMemberSerializer
)
from workspaces.permissions import IsWorkspaceMember, IsWorkspaceAdmin
from workspaces.models import Role
from audit.utils import log_audit_event


class ProjectListCreateView(generics.ListCreateAPIView):
    """List or create projects within the active tenant workspace."""
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        ws = getattr(self.request, 'workspace', None)
        if not ws:
            from workspaces.middleware import resolve_workspace
            ws = resolve_workspace(self.request)
        if not ws:
            return Project.objects.none()
        return Project.objects.filter(workspace=ws, is_archived=False)

    def create(self, request, *args, **kwargs):
        ws = request.workspace
        # Quota check
        if ws.projects.count() >= ws.max_projects:
            return Response(
                {"detail": f"Project limit reached for your plan ({ws.max_projects} max). Please upgrade to create additional projects."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        log_audit_event(
            workspace=ws,
            actor=request.user,
            action="PROJECT_CREATED",
            target_type="Project",
            target_id=str(project.id),
            target_title=f"{project.name} ({project.key})"
        )

        return Response(ProjectSerializer(project, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or archive a project."""
    serializer_class = ProjectSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]

    def get_queryset(self):
        return Project.objects.filter(workspace=self.request.workspace)

    def perform_destroy(self, instance):
        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="PROJECT_DELETED",
            target_type="Project",
            target_id=str(instance.id),
            target_title=f"{instance.name} ({instance.key})"
        )
        instance.delete()


class ProjectMembersView(generics.ListCreateAPIView):
    """Manage team members assigned to a specific project."""
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return ProjectMember.objects.filter(project__id=project_id, project__workspace=self.request.workspace)

    def perform_create(self, serializer):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id, workspace=self.request.workspace)
        serializer.save(project=project)
