import uuid
from django.db import models
from django.conf import settings
from projects.models import Project
from boards.models import BoardColumn
from sprints.models import Sprint


class IssueType(models.TextChoices):
    STORY = 'story', 'Story'
    TASK = 'task', 'Task'
    BUG = 'bug', 'Bug'
    EPIC = 'epic', 'Epic'


class Priority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class Issue(models.Model):
    """Core tracking unit representing a task, bug, story, or epic."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='issues'
    )
    board_column = models.ForeignKey(
        BoardColumn,
        on_delete=models.CASCADE,
        related_name='issues'
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issues'
    )
    key = models.CharField(max_length=20, db_index=True)
    sequence_number = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    issue_type = models.CharField(
        max_length=20,
        choices=IssueType.choices,
        default=IssueType.TASK,
        db_index=True
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True
    )
    story_points = models.PositiveIntegerField(default=1)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reported_issues'
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues'
    )
    order = models.FloatField(default=65536.0, db_index=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        unique_together = ('project', 'key')

    def __str__(self):
        return f"[{self.key}] {self.title}"

    def save(self, *args, **kwargs):
        if not self.key:
            # Auto-increment sequence number per project
            last_issue = Issue.objects.filter(project=self.project).order_by('-sequence_number').first()
            self.sequence_number = (last_issue.sequence_number + 1) if last_issue else 1
            self.key = f"{self.project.key}-{self.sequence_number}"
        super().save(*args, **kwargs)


class IssueComment(models.Model):
    """Team discussions and activity notes on an issue."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='issue_comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.display_name} on {self.issue.key}"


class IssueAttachment(models.Model):
    """File attachments (screenshots, logs, specs) on an issue."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_attachments'
    )
    file = models.FileField(upload_to='attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} ({self.issue.key})"
