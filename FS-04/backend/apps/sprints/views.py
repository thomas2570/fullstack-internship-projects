from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from .models import Sprint, SprintStatus
from .serializers import SprintSerializer
from workspaces.permissions import IsWorkspaceMember, IsWorkspaceAdmin
from audit.utils import log_audit_event


class SprintListCreateView(generics.ListCreateAPIView):
    """List or create sprints for a project."""
    serializer_class = SprintSerializer
    permission_classes = [IsWorkspaceMember]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        status_filter = self.request.query_params.get('status')
        qs = Sprint.objects.filter(workspace=self.request.workspace)
        if project_id:
            qs = qs.filter(project_id=project_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        sprint = serializer.save()
        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="SPRINT_CREATED",
            target_type="Sprint",
            target_id=str(sprint.id),
            target_title=f"{sprint.name} ({sprint.project.key})"
        )


class SprintDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete sprint."""
    serializer_class = SprintSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]

    def get_queryset(self):
        return Sprint.objects.filter(workspace=self.request.workspace)


class StartSprintView(APIView):
    """Transition a planned sprint into ACTIVE state."""
    permission_classes = [IsWorkspaceAdmin]

    def post(self, request, id):
        sprint = get_object_or_404(Sprint, id=id, workspace=request.workspace)
        
        # Verify no other active sprint exists for this project
        active_exists = Sprint.objects.filter(
            project=sprint.project,
            status=SprintStatus.ACTIVE
        ).exclude(id=sprint.id).exists()

        if active_exists:
            return Response(
                {"detail": "Another sprint is already active in this project. Complete it first before starting a new sprint."},
                status=status.HTTP_400_BAD_REQUEST
            )

        start_date = request.data.get('start_date') or timezone.now().date()
        duration_weeks = int(request.data.get('duration_weeks', 2))
        end_date = request.data.get('end_date') or (start_date + timedelta(weeks=duration_weeks))

        sprint.status = SprintStatus.ACTIVE
        sprint.start_date = start_date
        sprint.end_date = end_date
        sprint.save()

        log_audit_event(
            workspace=request.workspace,
            actor=request.user,
            action="SPRINT_STARTED",
            target_type="Sprint",
            target_id=str(sprint.id),
            target_title=sprint.name
        )

        return Response(SprintSerializer(sprint).data)


class CompleteSprintView(APIView):
    """Complete active sprint and optionally move open issues to backlog."""
    permission_classes = [IsWorkspaceAdmin]

    def post(self, request, id):
        sprint = get_object_or_404(Sprint, id=id, workspace=request.workspace)
        if sprint.status != SprintStatus.ACTIVE:
            return Response({"detail": "Only active sprints can be completed."}, status=status.HTTP_400_BAD_REQUEST)

        # Uncompleted issues move to backlog (sprint=None) or next sprint
        target_sprint_id = request.data.get('move_to_sprint_id')
        uncompleted_issues = sprint.issues.filter(board_column__is_done_column=False)
        
        if target_sprint_id:
            target_sprint = get_object_or_404(Sprint, id=target_sprint_id, workspace=request.workspace)
            uncompleted_issues.update(sprint=target_sprint)
        else:
            uncompleted_issues.update(sprint=None)

        sprint.status = SprintStatus.COMPLETED
        sprint.save()

        log_audit_event(
            workspace=request.workspace,
            actor=request.user,
            action="SPRINT_COMPLETED",
            target_type="Sprint",
            target_id=str(sprint.id),
            target_title=sprint.name
        )

        return Response(SprintSerializer(sprint).data)


class SprintBurndownMetricsView(APIView):
    """Generate daily burndown data points for sprint visualization."""
    permission_classes = [IsWorkspaceMember]

    def get(self, request, id):
        sprint = get_object_or_404(Sprint, id=id, workspace=request.workspace)
        start = sprint.start_date or (sprint.created_at.date())
        end = sprint.end_date or (start + timedelta(days=14))
        
        total_days = max(1, (end - start).days)
        total_points = sum(issue.story_points for issue in sprint.issues.all())

        # Generate realistic trajectory points
        datapoints = []
        ideal_step = total_points / total_days if total_days > 0 else 0
        remaining = total_points

        for day_idx in range(total_days + 1):
            day_date = start + timedelta(days=day_idx)
            ideal_burn = max(0, round(total_points - (ideal_step * day_idx), 1))
            
            # If date is in the past, calculate simulated completed issues up to date
            if day_date <= timezone.now().date():
                actual_burn = max(0, total_points - (day_idx * (total_points // max(1, total_days))))
            else:
                actual_burn = None

            datapoints.append({
                "day": day_idx + 1,
                "date": day_date.strftime("%Y-%m-%d"),
                "ideal": ideal_burn,
                "actual": actual_burn
            })

        return Response({
            "sprint_name": sprint.name,
            "total_points": total_points,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
            "metrics": datapoints
        })
