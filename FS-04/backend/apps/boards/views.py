from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Board, BoardColumn
from .serializers import (
    BoardSerializer,
    BoardColumnSerializer,
    ReorderColumnsSerializer
)
from workspaces.permissions import IsWorkspaceMember, IsWorkspaceAdmin
from audit.utils import log_audit_event


class BoardListCreateView(generics.ListCreateAPIView):
    """List or create boards for a project."""
    serializer_class = BoardSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        qs = Board.objects.filter(workspace=self.request.workspace).prefetch_related('columns')
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        board = serializer.save()
        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="BOARD_CREATED",
            target_type="Board",
            target_id=str(board.id),
            target_title=board.name
        )


class BoardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a board."""
    serializer_class = BoardSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]

    def get_queryset(self):
        return Board.objects.filter(workspace=self.request.workspace).prefetch_related('columns')


class BoardColumnListCreateView(generics.ListCreateAPIView):
    """Manage workflow columns for a specific board."""
    serializer_class = BoardColumnSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        board_id = self.kwargs['board_id']
        return BoardColumn.objects.filter(board__id=board_id, board__workspace=self.request.workspace)

    def perform_create(self, serializer):
        board_id = self.kwargs['board_id']
        board = get_object_or_404(Board, id=board_id, workspace=self.request.workspace)
        # determine next order index
        last_order = board.columns.order_by('-order').first()
        next_order = (last_order.order + 1) if last_order else 0
        col = serializer.save(board=board, order=next_order)

        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="COLUMN_CREATED",
            target_type="BoardColumn",
            target_id=str(col.id),
            target_title=f"{col.name} in {board.name}"
        )


class BoardColumnDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Update column name, color, WIP limits, or delete column."""
    serializer_class = BoardColumnSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]

    def get_queryset(self):
        return BoardColumn.objects.filter(board__workspace=self.request.workspace)

    def perform_destroy(self, instance):
        if instance.issues.exists():
            raise serializers.ValidationError({"detail": "Cannot delete a column that contains issues. Move issues first."})
        super().perform_destroy(instance)


class ReorderColumnsView(APIView):
    """Batch reorder columns across workflow stages."""
    permission_classes = [IsWorkspaceAdmin]

    def post(self, request, board_id):
        board = get_object_or_404(Board, id=board_id, workspace=request.workspace)
        orders = request.data.get('column_orders', []) # [{'id': 'uuid', 'order': 0}, ...]

        with transaction.atomic():
            for item in orders:
                BoardColumn.objects.filter(id=item['id'], board=board).update(order=item['order'])

        updated_columns = board.columns.all()
        return Response(BoardColumnSerializer(updated_columns, many=True).data)
