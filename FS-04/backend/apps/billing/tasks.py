import logging
from celery import shared_task
from django.conf import settings
from workspaces.models import Workspace, PlanTier

logger = logging.getLogger(__name__)


@shared_task
def sync_subscription_statuses():
    """
    Periodic job that verifies customer subscription statuses with Stripe.
    Downgrades accounts with cancelled or overdue subscriptions.
    """
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    workspaces = Workspace.objects.filter(stripe_subscription_id__gt='')
    updated_count = 0

    for ws in workspaces:
        try:
            sub = stripe.Subscription.retrieve(ws.stripe_subscription_id)
            status = sub.status  # 'active', 'past_due', 'canceled', etc.
            ws.subscription_status = status
            if status in ['canceled', 'unpaid', 'incomplete_expired']:
                ws.plan = PlanTier.FREE
                ws.update_limits_for_plan()
            ws.save(update_fields=['subscription_status', 'plan', 'max_members', 'max_projects', 'max_issues_per_project'])
            updated_count += 1
        except Exception as e:
            logger.warning(f"Failed to check Stripe sub {ws.stripe_subscription_id}: {e}")

    return f"Synced {updated_count} Stripe subscriptions."
