from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer
from workspaces.permissions import IsWorkspaceMember


class AuditLogListView(generics.ListAPIView):
    """List activity and audit events within the tenant workspace."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsWorkspaceMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'target_type']
    search_fields = ['target_title', 'action', 'actor__display_name', 'actor__email']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        workspace = self.request.workspace
        return AuditLog.objects.filter(workspace=workspace).select_related('actor')
