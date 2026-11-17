from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from workspaces.models import Workspace
from billing.models import SubscriptionPlan

User = get_user_model()


class Command(BaseCommand):
    help = "Seed subscription plans and ensure demo accounts are purged."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing production billing plans..."))

        # 1. Seed Subscription Plans
        plans_data = [
            {
                'slug': 'free',
                'name': 'Free Tier',
                'description': 'Designed for small teams getting started with agile tracking.',
                'price_cents': 0,
                'billing_interval': 'month',
                'max_members': 5,
                'max_projects': 3,
                'max_issues_per_project': 100,
                'features': ['5 Members', '3 Projects', '100 Issues / Project', 'Kanban & Sprints']
            },
            {
                'slug': 'pro',
                'name': 'Professional',
                'description': 'Advanced workflows, custom columns, burndown metrics, and webhooks.',
                'price_cents': 1200,
                'billing_interval': 'month',
                'stripe_price_id': 'price_pro_live_sample',
                'max_members': 25,
                'max_projects': 50,
                'max_issues_per_project': 5000,
                'features': ['25 Members', '50 Projects', '5,000 Issues / Project', 'WIP Limits', 'Webhooks & Audit Logs']
            },
            {
                'slug': 'enterprise',
                'name': 'Enterprise',
                'description': 'Unlimited capacity, customized SLA, audit exports, and compliance.',
                'price_cents': 4900,
                'billing_interval': 'month',
                'stripe_price_id': 'price_enterprise_live_sample',
                'max_members': 9999,
                'max_projects': 9999,
                'max_issues_per_project': 999999,
                'features': ['Unlimited Members', 'Unlimited Projects', 'Dedicated Support', 'Audit Log Exporter']
            }
        ]

        for p in plans_data:
            SubscriptionPlan.objects.update_or_create(slug=p['slug'], defaults=p)

        self.stdout.write(self.style.SUCCESS("Subscription plans synchronized."))

        # 2. Purge dummy demo accounts and dummy workspaces
        demo_emails = [
            'admin@acme.com',
            'sarah.chen@acme.com',
            'marcus.v@acme.com',
            'elena.r@acme.com',
            'david.kim@acme.com',
            'priya.n@acme.com',
            'founder@starlight.io',
            'admin@example.com',
            'member@example.com',
            'owner@zeta.local',
            'member@zeta.local',
        ]
        demo_workspace_slugs = ['acme-corp', 'starlight-bio', 'default-workspace', 'zeta-tech']
        
        deleted_workspaces = Workspace.objects.filter(slug__in=demo_workspace_slugs).delete()
        deleted_users = User.objects.filter(email__in=demo_emails).delete()

        self.stdout.write(self.style.SUCCESS(f"Purged demo data. Platform clean and ready for real enterprise users."))
