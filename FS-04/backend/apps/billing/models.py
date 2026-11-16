import uuid
from django.db import models
from workspaces.models import Workspace


class SubscriptionPlan(models.Model):
    """Available subscription tiers and associated resource limits."""
    
    slug = models.SlugField(primary_key=True, max_length=40)
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True, default='')
    price_cents = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=10, default='USD')
    billing_interval = models.CharField(max_length=20, default='month')
    stripe_price_id = models.CharField(max_length=100, blank=True, default='')
    
    max_members = models.PositiveIntegerField(default=5)
    max_projects = models.PositiveIntegerField(default=3)
    max_issues_per_project = models.PositiveIntegerField(default=100)
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['price_cents']

    def __str__(self):
        return f"{self.name} (${self.price_cents / 100:.2f}/{self.billing_interval})"


class BillingInvoice(models.Model):
    """Historical billing receipts and invoices from Stripe."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    stripe_invoice_id = models.CharField(max_length=100, unique=True)
    amount_paid_cents = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=10, default='USD')
    status = models.CharField(max_length=40, default='paid')
    invoice_pdf = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.stripe_invoice_id} - ${self.amount_paid_cents / 100:.2f} ({self.workspace.name})"
