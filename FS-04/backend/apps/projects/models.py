import uuid
from django.db import models
from django.conf import settings
from workspaces.models import Workspace, Role


class Project(models.Model):
    """A project containing issues, boards, sprints, and workflow definitions."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    name = models.CharField(max_length=150)
    key = models.CharField(max_length=10, db_index=True)
    description = models.TextField(blank=True, default='')
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_projects'
    )
    avatar_color = models.CharField(max_length=30, default='#4F46E5')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('workspace', 'key')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} [{self.key}] ({self.workspace.name})"

    def save(self, *args, **kwargs):
        self.key = self.key.upper().strip()
        super().save(*args, **kwargs)


class ProjectMember(models.Model):
    """Scoped project-level role assignments."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships'
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.email} in {self.project.key}"
