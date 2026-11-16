import uuid
from django.db import models
from workspaces.models import Workspace
from projects.models import Project


class Board(models.Model):
    """Kanban or Scrum board associated with a project."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='boards'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='boards'
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} ({self.project.key})"


class BoardColumn(models.Model):
    """Custom workflow column/state belonging to a board."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='columns'
    )
    name = models.CharField(max_length=80)
    order = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=30, default='#4F46E5')
    wip_limit = models.PositiveIntegerField(default=0, help_text="0 indicates unlimited Work-In-Progress")
    is_done_column = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.board.name} -> {self.name} (#{self.order})"
