import uuid
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone


class PlanTier(models.TextChoices):
    FREE = 'free', 'Free'
    PRO = 'pro', 'Pro'
    ENTERPRISE = 'enterprise', 'Enterprise'


class Role(models.TextChoices):
    OWNER = 'owner', 'Owner'
    ADMIN = 'admin', 'Admin'
    MEMBER = 'member', 'Member'
    VIEWER = 'viewer', 'Viewer'


class Workspace(models.Model):
    """Primary multi-tenant boundary. Every entity in the system is scoped to a workspace."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, db_index=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_workspaces'
    )
    plan = models.CharField(
        max_length=20,
        choices=PlanTier.choices,
        default=PlanTier.FREE
    )
    stripe_customer_id = models.CharField(max_length=100, blank=True, default='')
    stripe_subscription_id = models.CharField(max_length=100, blank=True, default='')
    subscription_status = models.CharField(max_length=30, blank=True, default='active')
    
    # Quota Limits per tier
    max_members = models.PositiveIntegerField(default=5)
    max_projects = models.PositiveIntegerField(default=3)
    max_issues_per_project = models.PositiveIntegerField(default=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def update_limits_for_plan(self):
        """Update quotas according to current subscription plan."""
        if self.plan == PlanTier.FREE:
            self.max_members = 5
            self.max_projects = 3
            self.max_issues_per_project = 100
        elif self.plan == PlanTier.PRO:
            self.max_members = 25
            self.max_projects = 50
            self.max_issues_per_project = 5000
        elif self.plan == PlanTier.ENTERPRISE:
            self.max_members = 9999
            self.max_projects = 9999
            self.max_issues_per_project = 999999


class WorkspaceMembership(models.Model):
    """Mapping between User and Workspace with Role-Based Access Control (RBAC)."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workspace_memberships'
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'user')
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.email} in {self.workspace.name} as {self.role}"


class InvitationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    ACCEPTED = 'accepted', 'Accepted'
    REVOKED = 'revoked', 'Revoked'
    EXPIRED = 'expired', 'Expired'


class WorkspaceInvitation(models.Model):
    """Invitations sent to team members to join a workspace."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def is_valid(self):
        return self.status == InvitationStatus.PENDING and self.expires_at > timezone.now()


class TenantModel(models.Model):
    """
    Abstract base model enforcing tenant isolation across all project entities.
    Every database record belongs strictly to a Workspace tenant.
    """
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)ss"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
