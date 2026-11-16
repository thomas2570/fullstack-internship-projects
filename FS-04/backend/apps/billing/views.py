import stripe
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import SubscriptionPlan, BillingInvoice
from .serializers import SubscriptionPlanSerializer, BillingInvoiceSerializer
from workspaces.permissions import IsWorkspaceAdmin, IsWorkspaceOwner
from workspaces.models import PlanTier
from audit.utils import log_audit_event

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


class PlanListView(generics.ListAPIView):
    """List all available pricing tiers and feature quotas."""
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Auto-seed standard plans if table is empty
        if not SubscriptionPlan.objects.exists():
            SubscriptionPlan.objects.bulk_create([
                SubscriptionPlan(
                    slug='free',
                    name='Free Tier',
                    description='Perfect for small starter teams exploring agile sprints.',
                    price_cents=0,
                    billing_interval='month',
                    max_members=5,
                    max_projects=3,
                    max_issues_per_project=100,
                    features=[
                        'Up to 5 team members',
                        '3 Active projects',
                        '100 issues per project',
                        'Kanban and Sprint boards',
                        'Community support'
                    ]
                ),
                SubscriptionPlan(
                    slug='pro',
                    name='Professional',
                    description='For scaling tech teams demanding custom workflows and webhooks.',
                    price_cents=1200,
                    billing_interval='month',
                    stripe_price_id='price_pro_tier_sample',
                    max_members=25,
                    max_projects=50,
                    max_issues_per_project=5000,
                    features=[
                        'Up to 25 team members',
                        '50 Active projects',
                        '5,000 issues per project',
                        'Custom workflow stages & WIP limits',
                        'Outbound Webhook automation',
                        'Burndown chart analytics',
                        'Priority email support'
                    ]
                ),
                SubscriptionPlan(
                    slug='enterprise',
                    name='Enterprise',
                    description='Unlimited capacity, audit trails, and dedicated infrastructure.',
                    price_cents=4900,
                    billing_interval='month',
                    stripe_price_id='price_enterprise_tier_sample',
                    max_members=9999,
                    max_projects=9999,
                    max_issues_per_project=999999,
                    features=[
                        'Unlimited team members',
                        'Unlimited projects & issues',
                        'Full compliance audit log retention',
                        'Dedicated background queue',
                        'Custom SLA & 24/7 dedicated support'
                    ]
                ),
            ])
        return SubscriptionPlan.objects.filter(is_active=True)


class CurrentSubscriptionView(APIView):
    """View current active subscription status, quotas, and invoices."""
    permission_classes = [IsWorkspaceAdmin]

    def get(self, request):
        ws = request.workspace
        plan = SubscriptionPlan.objects.filter(slug=ws.plan).first()
        invoices = BillingInvoice.objects.filter(workspace=ws)

        return Response({
            "workspace_id": str(ws.id),
            "workspace_name": ws.name,
            "current_plan": ws.plan,
            "subscription_status": ws.subscription_status,
            "stripe_customer_id": ws.stripe_customer_id or None,
            "quotas": {
                "members": {"current": ws.memberships.count(), "max": ws.max_members},
                "projects": {"current": ws.projects.count() if hasattr(ws, 'projects') else 0, "max": ws.max_projects},
                "max_issues_per_project": ws.max_issues_per_project,
            },
            "plan_details": SubscriptionPlanSerializer(plan).data if plan else None,
            "invoices": BillingInvoiceSerializer(invoices, many=True).data
        })


class CreateCheckoutSessionView(APIView):
    """Create Stripe Checkout session for subscription tier upgrade."""
    permission_classes = [IsWorkspaceAdmin]

    def post(self, request):
        plan_slug = request.data.get('plan')
        if plan_slug not in [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE]:
            return Response({"detail": "Invalid subscription plan selected."}, status=status.HTTP_400_BAD_REQUEST)

        ws = request.workspace
        target_plan = SubscriptionPlan.objects.filter(slug=plan_slug).first()

        # If upgrading to free (downgrade) or test environment simulation mode:
        # In case test API keys are dummy or offline, we support seamless sandbox activation!
        use_simulation = request.data.get('simulate', False) or settings.STRIPE_SECRET_KEY.startswith('sk_test_sample')

        if plan_slug == PlanTier.FREE or use_simulation:
            # Upgrade workspace directly for test mode
            ws.plan = plan_slug
            ws.update_limits_for_plan()
            ws.subscription_status = 'active'
            ws.save()

            # Record simulated invoice
            if target_plan and target_plan.price_cents > 0:
                BillingInvoice.objects.create(
                    workspace=ws,
                    stripe_invoice_id=f"in_test_{ws.slug}_{plan_slug}",
                    amount_paid_cents=target_plan.price_cents,
                    currency="USD",
                    status="paid"
                )

            log_audit_event(
                workspace=ws,
                actor=request.user,
                action="PLAN_UPGRADED",
                target_type="Workspace",
                target_id=str(ws.id),
                target_title=ws.name,
                changes={"plan": plan_slug}
            )

            return Response({
                "message": f"Successfully upgraded to {plan_slug.capitalize()} tier.",
                "checkout_url": f"{settings.FRONTEND_URL}/billing?success=true",
                "simulated": True
            })

        # Real Stripe Checkout session creation
        try:
            # Ensure Stripe customer exists
            if not ws.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=ws.name,
                    metadata={"workspace_id": str(ws.id)}
                )
                ws.stripe_customer_id = customer.id
                ws.save(update_fields=['stripe_customer_id'])

            checkout_session = stripe.checkout.Session.create(
                customer=ws.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': target_plan.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{settings.FRONTEND_URL}/billing?session_id={{CHECKOUT_SESSION_ID}}&success=true",
                cancel_url=f"{settings.FRONTEND_URL}/billing?canceled=true",
                client_reference_id=str(ws.id),
                metadata={
                    'workspace_id': str(ws.id),
                    'target_plan': plan_slug
                }
            )
            return Response({"checkout_url": checkout_session.url, "session_id": checkout_session.id})
        except Exception as e:
            logger.error(f"Stripe Checkout creation error: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreateCustomerPortalView(APIView):
    """Generate Stripe billing portal link for card updates and cancellation."""
    permission_classes = [IsWorkspaceOwner]

    def post(self, request):
        ws = request.workspace
        if not ws.stripe_customer_id:
            return Response(
                {"detail": "No active billing profile found for this workspace."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=ws.stripe_customer_id,
                return_url=f"{settings.FRONTEND_URL}/billing"
            )
            return Response({"portal_url": portal_session.url})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """Processes asynchronous webhook events from Stripe."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('Stripe-Signature')

        try:
            if settings.STRIPE_WEBHOOK_SECRET and sig_header:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
            else:
                event = request.data
        except Exception as e:
            logger.error(f"Webhook signature failure: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('type')
        data_object = event.get('data', {}).get('object', {})

        if event_type == 'checkout.session.completed':
            workspace_id = data_object.get('client_reference_id') or data_object.get('metadata', {}).get('workspace_id')
            plan_slug = data_object.get('metadata', {}).get('target_plan')
            sub_id = data_object.get('subscription')
            cust_id = data_object.get('customer')

            if workspace_id and plan_slug:
                from workspaces.models import Workspace
                ws = Workspace.objects.filter(id=workspace_id).first()
                if ws:
                    ws.plan = plan_slug
                    ws.stripe_subscription_id = sub_id or ''
                    ws.stripe_customer_id = cust_id or ws.stripe_customer_id
                    ws.subscription_status = 'active'
                    ws.update_limits_for_plan()
                    ws.save()

        elif event_type == 'invoice.payment_succeeded':
            cust_id = data_object.get('customer')
            from workspaces.models import Workspace
            ws = Workspace.objects.filter(stripe_customer_id=cust_id).first()
            if ws:
                BillingInvoice.objects.get_or_create(
                    stripe_invoice_id=data_object.get('id'),
                    defaults={
                        'workspace': ws,
                        'amount_paid_cents': data_object.get('amount_paid', 0),
                        'currency': data_object.get('currency', 'usd').upper(),
                        'status': 'paid',
                        'invoice_pdf': data_object.get('invoice_pdf')
                    }
                )

        elif event_type in ['customer.subscription.deleted', 'customer.subscription.updated']:
            sub_id = data_object.get('id')
            sub_status = data_object.get('status')
            from workspaces.models import Workspace
            ws = Workspace.objects.filter(stripe_subscription_id=sub_id).first()
            if ws:
                ws.subscription_status = sub_status
                if sub_status in ['canceled', 'unpaid', 'incomplete_expired']:
                    ws.plan = PlanTier.FREE
                    ws.update_limits_for_plan()
                ws.save()

        return Response({"status": "received"}, status=status.HTTP_200_OK)
