import uuid
import secrets
from django.db import models
from workspaces.models import Workspace


def generate_webhook_secret():
    return secrets.token_hex(24)


class WebhookEndpoint(models.Model):
    """External subscriber endpoint for tenant event notifications."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='webhooks'
    )
    target_url = models.URLField(max_length=500)
    description = models.CharField(max_length=200, blank=True, default='')
    secret = models.CharField(max_length=64, default=generate_webhook_secret)
    events = models.JSONField(
        default=list,
        help_text="Subscribed events, e.g. ['issue.created', 'issue.moved', 'sprint.completed']"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.target_url} ({self.workspace.name})"


class WebhookDelivery(models.Model):
    """Delivery log and response diagnostics for each webhook dispatch."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(
        WebhookEndpoint,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )
    event_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict)
    response_status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True, default='')
    duration_ms = models.PositiveIntegerField(default=0)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} to {self.webhook.target_url} -> {self.response_status_code} ({'OK' if self.success else 'FAILED'})"
