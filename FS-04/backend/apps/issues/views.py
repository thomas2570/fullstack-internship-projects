from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction

from .models import Issue, IssueComment, IssueAttachment
from .serializers import (
    IssueSerializer,
    IssueCommentSerializer,
    IssueAttachmentSerializer,
    MoveIssueSerializer
)
from boards.models import BoardColumn
from projects.models import Project
from sprints.models import Sprint
from django.contrib.auth import get_user_model
from workspaces.permissions import IsWorkspaceMember
from audit.utils import log_audit_event

User = get_user_model()


class IssueListCreateView(generics.ListCreateAPIView):
    """List issues filtered by project, sprint, assignee, or column."""
    serializer_class = IssueSerializer
    permission_classes = [IsWorkspaceMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['issue_type', 'priority', 'board_column', 'sprint']
    search_fields = ['key', 'title', 'description', 'assignee__display_name', 'assignee__email']
    ordering_fields = ['order', 'created_at', 'priority', 'story_points']
    ordering = ['order', 'created_at']

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        board_id = self.request.query_params.get('board_id')
        sprint_id = self.request.query_params.get('sprint_id')
        is_backlog = self.request.query_params.get('is_backlog')

        qs = Issue.objects.filter(
            project__workspace=self.request.workspace
        ).select_related('project', 'board_column', 'sprint', 'reporter', 'assignee')

        if project_id:
            qs = qs.filter(project_id=project_id)
        if board_id:
            qs = qs.filter(board_column__board_id=board_id)
        if is_backlog == 'true':
            qs = qs.filter(sprint__isnull=True)
        elif sprint_id:
            qs = qs.filter(sprint_id=sprint_id)

        return qs

    def perform_create(self, serializer):
        ws = self.request.workspace
        project_id = (
            self.request.data.get('project') or 
            self.request.data.get('project_id') or 
            self.request.query_params.get('project_id')
        )
        project = get_object_or_404(Project, id=project_id, workspace=ws)

        # Quota check
        if project.issues.count() >= ws.max_issues_per_project:
            raise permissions.exceptions.PermissionDenied(
                f"Project issue limit reached ({ws.max_issues_per_project} issues max). Please upgrade your workspace tier."
            )

        # Column resolution
        column_id = self.request.data.get('board_column_id')
        if column_id:
            column = get_object_or_404(BoardColumn, id=column_id, board__workspace=ws)
        else:
            first_board = project.boards.first()
            column = first_board.columns.first() if first_board else None

        # Sprint resolution
        sprint_id = self.request.data.get('sprint_id')
        sprint = None
        if sprint_id:
            sprint = Sprint.objects.filter(id=sprint_id, project=project).first()

        # Assignee resolution
        assignee_id = self.request.data.get('assignee_id')
        assignee = None
        if assignee_id:
            assignee = User.objects.filter(id=assignee_id).first()

        # Calculate initial order (append to end of column)
        last_issue = Issue.objects.filter(board_column=column).order_by('-order').first()
        initial_order = (last_issue.order + 65536.0) if last_issue else 65536.0

        issue = serializer.save(
            project=project,
            board_column=column,
            sprint=sprint,
            assignee=assignee,
            reporter=self.request.user,
            order=initial_order
        )

        log_audit_event(
            workspace=ws,
            actor=self.request.user,
            action="ISSUE_CREATED",
            target_type="Issue",
            target_id=str(issue.id),
            target_title=f"[{issue.key}] {issue.title}",
            changes={"column": column.name if column else "", "priority": issue.priority, "type": issue.issue_type}
        )


class IssueDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an issue."""
    serializer_class = IssueSerializer
    permission_classes = [IsWorkspaceMember]
    lookup_field = 'id'

    def get_queryset(self):
        return Issue.objects.filter(
            project__workspace=self.request.workspace
        ).select_related('project', 'board_column', 'sprint', 'reporter', 'assignee')

    def perform_update(self, serializer):
        old_instance = self.get_object()
        updated_issue = serializer.save()

        # Capture field diff
        changes = {}
        for field in ['title', 'priority', 'issue_type', 'story_points', 'due_date']:
            old_val = str(getattr(old_instance, field))
            new_val = str(getattr(updated_issue, field))
            if old_val != new_val:
                changes[field] = {"from": old_val, "to": new_val}

        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="ISSUE_UPDATED",
            target_type="Issue",
            target_id=str(updated_issue.id),
            target_title=f"[{updated_issue.key}] {updated_issue.title}",
            changes=changes
        )

    def perform_destroy(self, instance):
        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="ISSUE_DELETED",
            target_type="Issue",
            target_id=str(instance.id),
            target_title=f"[{instance.key}] {instance.title}"
        )
        instance.delete()


class MoveIssueView(APIView):
    """
    Drag-and-drop movement across columns and positional reordering.
    Supports fractional index positioning for O(1) re-ordering.
    """
    permission_classes = [IsWorkspaceMember]

    def post(self, request, id):
        issue = get_object_or_404(Issue, id=id, project__workspace=request.workspace)
        serializer = MoveIssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_column_id = serializer.validated_data['column_id']
        target_column = get_object_or_404(BoardColumn, id=target_column_id, board__workspace=request.workspace)
        
        # Check WIP limit if transitioning into a new column
        if target_column != issue.board_column and target_column.wip_limit > 0:
            current_wip = target_column.issues.count()
            if current_wip >= target_column.wip_limit:
                return Response(
                    {"detail": f"Column '{target_column.name}' has reached its WIP limit of {target_column.wip_limit}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        new_order = serializer.validated_data.get('order')
        prev_order = serializer.validated_data.get('previous_order')
        next_order = serializer.validated_data.get('next_order')

        if new_order is not None:
            computed_order = float(new_order)
        elif prev_order is not None and next_order is not None:
            computed_order = (float(prev_order) + float(next_order)) / 2.0
        elif prev_order is not None:
            computed_order = float(prev_order) + 1000.0
        elif next_order is not None:
            computed_order = float(next_order) / 2.0
        else:
            computed_order = issue.order

        old_column_name = issue.board_column.name
        with transaction.atomic():
            issue.board_column = target_column
            issue.order = computed_order
            issue.save(update_fields=['board_column', 'order', 'updated_at'])

        log_audit_event(
            workspace=request.workspace,
            actor=request.user,
            action="ISSUE_MOVED",
            target_type="Issue",
            target_id=str(issue.id),
            target_title=f"[{issue.key}] {issue.title}",
            changes={"from_column": old_column_name, "to_column": target_column.name, "new_order": computed_order}
        )

        return Response(IssueSerializer(issue, context={'request': request}).data)


class IssueCommentListCreateView(generics.ListCreateAPIView):
    """List or post comments on an issue."""
    serializer_class = IssueCommentSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        issue_id = self.kwargs['issue_id']
        return IssueComment.objects.filter(
            issue__id=issue_id,
            issue__project__workspace=self.request.workspace
        ).select_related('author')

    def perform_create(self, serializer):
        issue_id = self.kwargs['issue_id']
        issue = get_object_or_404(Issue, id=issue_id, project__workspace=self.request.workspace)
        comment = serializer.save(issue=issue, author=self.request.user)

        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="COMMENT_ADDED",
            target_type="Issue",
            target_id=str(issue.id),
            target_title=f"[{issue.key}] {issue.title}",
            changes={"comment_snippet": comment.content[:60]}
        )


class IssueAttachmentListCreateView(generics.ListCreateAPIView):
    """List or upload attachments on an issue."""
    serializer_class = IssueAttachmentSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        issue_id = self.kwargs['issue_id']
        return IssueAttachment.objects.filter(
            issue__id=issue_id,
            issue__project__workspace=self.request.workspace
        ).select_related('uploader')

    def perform_create(self, serializer):
        issue_id = self.kwargs['issue_id']
        issue = get_object_or_404(Issue, id=issue_id, project__workspace=self.request.workspace)
        uploaded_file = self.request.FILES.get('file')
        
        filename = uploaded_file.name if uploaded_file else "attachment"
        file_size = uploaded_file.size if uploaded_file else 0

        attachment = serializer.save(
            issue=issue,
            uploader=self.request.user,
            filename=filename,
            file_size=file_size
        )

        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="ATTACHMENT_UPLOADED",
            target_type="Issue",
            target_id=str(issue.id),
            target_title=f"[{issue.key}] {issue.title}",
            changes={"filename": filename, "size_bytes": file_size}
        )
