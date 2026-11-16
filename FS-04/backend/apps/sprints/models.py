import uuid
from django.db import models
from workspaces.models import Workspace
from projects.models import Project


class SprintStatus(models.TextChoices):
    PLANNED = 'planned', 'Planned'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'


class Sprint(models.Model):
    """Agile iteration containing scoped issues and delivery goals."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='sprints'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='sprints'
    )
    name = models.CharField(max_length=150)
    goal = models.TextField(blank=True, default='')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=SprintStatus.choices,
        default=SprintStatus.PLANNED,
        db_index=True
    )
    sequence = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-status', '-created_at']

    def __str__(self):
        return f"{self.project.key} - {self.name} ({self.status})"
