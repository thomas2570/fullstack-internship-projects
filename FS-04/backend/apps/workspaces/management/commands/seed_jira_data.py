import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker

from workspaces.models import Workspace, WorkspaceMembership, Role, PlanTier
from projects.models import Project, ProjectMember
from boards.models import Board, BoardColumn
from sprints.models import Sprint, SprintStatus
from issues.models import Issue, IssueComment, IssueType, Priority
from billing.models import SubscriptionPlan, BillingInvoice
from webhooks.models import WebhookEndpoint
from audit.models import AuditLog

User = get_user_model()
fake = Faker()


class Command(BaseCommand):
    help = "Seed realistic enterprise Jira datasets with multi-tenant workspaces, sprints, issues, and audit logs."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing seed dataset..."))

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

        # 2. Seed Primary Users
        users = {}
        user_specs = [
            ('admin@acme.com', 'Alex', 'Mercer', 'VP of Engineering', Role.OWNER),
            ('sarah.chen@acme.com', 'Sarah', 'Chen', 'Staff Backend Architect', Role.ADMIN),
            ('marcus.v@acme.com', 'Marcus', 'Vance', 'Principal Product Manager', Role.MEMBER),
            ('elena.r@acme.com', 'Elena', 'Rostova', 'Lead Frontend Engineer', Role.MEMBER),
            ('david.kim@acme.com', 'David', 'Kim', 'DevOps & Reliability Engineer', Role.MEMBER),
            ('priya.n@acme.com', 'Priya', 'Nair', 'Senior QA Automation Specialist', Role.MEMBER),
            ('founder@starlight.io', 'Dr. Aris', 'Thorne', 'CEO & Founder', Role.OWNER),
        ]

        for email, first, last, title, role in user_specs:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': first,
                    'last_name': last,
                    'display_name': f"{first} {last}",
                    'job_title': title,
                }
            )
            user.set_password('Password123!')
            user.save()
            users[email] = user

        # 3. Workspace 1: Acme Software Corp (Pro Plan)
        acme_ws, _ = Workspace.objects.get_or_create(
            slug='acme-corp',
            defaults={
                'name': 'Acme Software Corp',
                'owner': users['admin@acme.com'],
                'plan': PlanTier.PRO,
                'stripe_customer_id': 'cus_acme_prod_test_01',
                'stripe_subscription_id': 'sub_acme_prod_active_01',
                'subscription_status': 'active',
                'max_members': 25,
                'max_projects': 50,
                'max_issues_per_project': 5000,
            }
        )

        # Memberships for Acme Corp
        acme_members = [
            ('admin@acme.com', Role.OWNER),
            ('sarah.chen@acme.com', Role.ADMIN),
            ('marcus.v@acme.com', Role.MEMBER),
            ('elena.r@acme.com', Role.MEMBER),
            ('david.kim@acme.com', Role.MEMBER),
            ('priya.n@acme.com', Role.MEMBER),
        ]
        for email, role in acme_members:
            WorkspaceMembership.objects.get_or_create(
                workspace=acme_ws,
                user=users[email],
                defaults={'role': role}
            )

        # 4. Workspace 2: Starlight BioTech (Free Tier - Isolated Tenant)
        starlight_ws, _ = Workspace.objects.get_or_create(
            slug='starlight-bio',
            defaults={
                'name': 'Starlight BioTech',
                'owner': users['founder@starlight.io'],
                'plan': PlanTier.FREE,
                'max_members': 5,
                'max_projects': 3,
                'max_issues_per_project': 100,
            }
        )
        WorkspaceMembership.objects.get_or_create(
            workspace=starlight_ws,
            user=users['founder@starlight.io'],
            defaults={'role': Role.OWNER}
        )

        # Seed sample project for Starlight to prove tenant isolation
        sl_proj, _ = Project.objects.get_or_create(
            workspace=starlight_ws,
            key='BIO',
            defaults={
                'name': 'CRISPR Sequence Analyzer',
                'description': 'Genomic data pipeline processing next-gen sequencing reads.',
                'lead': users['founder@starlight.io'],
                'avatar_color': '#10B981'
            }
        )
        sl_board, _ = Board.objects.get_or_create(workspace=starlight_ws, project=sl_proj, name='Genomics Board')
        if not sl_board.columns.exists():
            BoardColumn.objects.bulk_create([
                BoardColumn(board=sl_board, name="Lab Queue", order=0, color="#64748B"),
                BoardColumn(board=sl_board, name="Sequencing", order=1, color="#3B82F6"),
                BoardColumn(board=sl_board, name="Analysis Done", order=2, color="#10B981", is_done_column=True),
            ])

        # 5. Build Projects for Acme Corp
        # Project 1: Cloud Platform Core (ENG)
        eng_proj, _ = Project.objects.get_or_create(
            workspace=acme_ws,
            key='ENG',
            defaults={
                'name': 'Cloud Platform Core',
                'description': 'High-throughput microservices, multi-region database replication, and auth microservice.',
                'lead': users['sarah.chen@acme.com'],
                'avatar_color': '#4F46E5'
            }
        )

        # Board and Workflow Columns for Cloud Platform Core
        eng_board, _ = Board.objects.get_or_create(
            workspace=acme_ws,
            project=eng_proj,
            name='Engineering Sprint Board'
        )

        columns = {}
        col_definitions = [
            ("Backlog", 0, "#94A3B8", 0, False),
            ("To Do", 1, "#3B82F6", 0, False),
            ("In Progress", 2, "#F59E0B", 5, False),
            ("Code Review", 3, "#8B5CF6", 4, False),
            ("Testing", 4, "#EC4899", 3, False),
            ("Done", 5, "#10B981", 0, True),
        ]

        for col_name, order, color, wip, is_done in col_definitions:
            col, _ = BoardColumn.objects.get_or_create(
                board=eng_board,
                name=col_name,
                defaults={'order': order, 'color': color, 'wip_limit': wip, 'is_done_column': is_done}
            )
            columns[col_name] = col

        # Sprints for ENG
        now = timezone.now().date()
        sprint_completed, _ = Sprint.objects.get_or_create(
            workspace=acme_ws,
            project=eng_proj,
            name='Sprint 13 - Auth & Performance',
            defaults={
                'goal': 'Migrate user session storage to distributed Redis cluster and optimize database connection pool.',
                'status': SprintStatus.COMPLETED,
                'start_date': now - timedelta(days=28),
                'end_date': now - timedelta(days=14),
                'sequence': 13
            }
        )

        sprint_active, _ = Sprint.objects.get_or_create(
            workspace=acme_ws,
            project=eng_proj,
            name='Sprint 14 - Multi-Tenant Isolation & Billing',
            defaults={
                'goal': 'Deliver workspace isolation middleware, drag-drop board interaction, and Stripe webhook idempotency.',
                'status': SprintStatus.ACTIVE,
                'start_date': now - timedelta(days=4),
                'end_date': now + timedelta(days=10),
                'sequence': 14
            }
        )

        sprint_future, _ = Sprint.objects.get_or_create(
            workspace=acme_ws,
            project=eng_proj,
            name='Sprint 15 - Real-time Collaboration & Metrics',
            defaults={
                'goal': 'Implement WebSocket live card cursor previews and executive burndown velocity reports.',
                'status': SprintStatus.PLANNED,
                'start_date': now + timedelta(days=11),
                'end_date': now + timedelta(days=25),
                'sequence': 15
            }
        )

        # Realistic Issues Dataset for ENG
        issue_templates = [
            # In Progress / Review in Sprint 14
            {
                "title": "Enforce strict tenant_id isolation in BaseQuerySet",
                "desc": "Ensure all DRF viewsets derive from TenantModel and automatically inject the active workspace ID from the request header, preventing cross-tenant data leakage.",
                "type": IssueType.STORY,
                "priority": Priority.URGENT,
                "points": 5,
                "col": "In Progress",
                "assignee": "sarah.chen@acme.com",
                "sprint": sprint_active,
                "due": now + timedelta(days=2),
                "comments": [
                    ("admin@acme.com", "This is our #1 compliance requirement before the SOC2 audit next month."),
                    ("sarah.chen@acme.com", "Added TenantContextMiddleware and verified querysets in unit tests.")
                ]
            },
            {
                "title": "Implement optimistic drag-and-drop Kanban state transition in React",
                "desc": "Use @hello-pangea/dnd with optimistic UI updates. When an issue drops into a new column, instantly mirror state and send async PATCH /api/issues/{id}/move/.",
                "type": IssueType.TASK,
                "priority": Priority.HIGH,
                "points": 3,
                "col": "Code Review",
                "assignee": "elena.r@acme.com",
                "sprint": sprint_active,
                "due": now + timedelta(days=3),
                "comments": [
                    ("elena.r@acme.com", "PR is up. Added subtle drop indicator animations and WIP limit alert toast."),
                    ("marcus.v@acme.com", "Tested locally on 120-issue board, feels super smooth!")
                ]
            },
            {
                "title": "Fix race condition in Stripe subscription webhook handling",
                "desc": "customer.subscription.updated events occasionally arrive out-of-order during billing upgrade retries. Implement idempotent transaction locks.",
                "type": IssueType.BUG,
                "priority": Priority.HIGH,
                "points": 3,
                "col": "In Progress",
                "assignee": "sarah.chen@acme.com",
                "sprint": sprint_active,
                "due": now + timedelta(days=4),
                "comments": [
                    ("david.kim@acme.com", "Checked Sentry trace, happened when user clicked upgrade button twice within 400ms.")
                ]
            },
            {
                "title": "Celery asynchronous dispatch for outbound webhooks with HMAC-SHA256",
                "desc": "External consumer endpoints should receive signed payloads with X-SaaS-Signature-256 header and automatic exponential backoff retries on 5xx responses.",
                "type": IssueType.STORY,
                "priority": Priority.MEDIUM,
                "points": 5,
                "col": "Testing",
                "assignee": "david.kim@acme.com",
                "sprint": sprint_active,
                "due": now + timedelta(days=5),
                "comments": [
                    ("priya.n@acme.com", "Added mock webhook receiver server in test suite. Verification passing with 3 retries.")
                ]
            },
            {
                "title": "Configure Prometheus metrics scraper for Celery task duration",
                "desc": "Export task execution latency, queue depth, and failure rates to our centralized Grafana dashboard.",
                "type": IssueType.TASK,
                "priority": Priority.LOW,
                "points": 2,
                "col": "To Do",
                "assignee": "david.kim@acme.com",
                "sprint": sprint_active,
                "due": now + timedelta(days=7),
                "comments": []
            },
            {
                "title": "Create Burndown Chart SVG generator with ideal vs actual slope",
                "desc": "Render sprint velocity charts displaying planned story points vs realized burned points day-by-day.",
                "type": IssueType.STORY,
                "priority": Priority.MEDIUM,
                "points": 3,
                "col": "To Do",
                "assignee": "elena.r@acme.com",
                "sprint": sprint_active,
                "due": now + timedelta(days=8),
                "comments": []
            },
            {
                "title": "Audit log diff visualization for issue field mutations",
                "desc": "Show before and after values for priority, status, assignee, and title changes in the issue detail drawer.",
                "type": IssueType.TASK,
                "priority": Priority.MEDIUM,
                "points": 2,
                "col": "Done",
                "assignee": "elena.r@acme.com",
                "sprint": sprint_active,
                "due": now - timedelta(days=1),
                "comments": [
                    ("marcus.v@acme.com", "Great addition! Makes tracking sprint modifications effortless.")
                ]
            },
            {
                "title": "Enforce WIP limits validation when dragging issue into saturated column",
                "desc": "If column has wip_limit > 0 and issue count equals limit, prompt user or block drag drop unless confirmed by project admin.",
                "type": IssueType.STORY,
                "priority": Priority.MEDIUM,
                "points": 3,
                "col": "Done",
                "assignee": "sarah.chen@acme.com",
                "sprint": sprint_active,
                "due": now - timedelta(days=2),
                "comments": []
            },
            # Backlog items (sprint=None)
            {
                "title": "Investigate migration from PostgreSQL 16 to Amazon Aurora Serverless v2",
                "desc": "Benchmark write IOPS under 10k simulated concurrent issue transitions and assess cold-start scaling latency.",
                "type": IssueType.EPIC,
                "priority": Priority.LOW,
                "points": 13,
                "col": "Backlog",
                "assignee": "david.kim@acme.com",
                "sprint": None,
                "due": None,
                "comments": []
            },
            {
                "title": "Implement multi-factor authentication (MFA) with TOTP / Authenticator apps",
                "desc": "Allow workspace members to enforce QR code TOTP 2FA for all administrative logins.",
                "type": IssueType.STORY,
                "priority": Priority.HIGH,
                "points": 8,
                "col": "Backlog",
                "assignee": "sarah.chen@acme.com",
                "sprint": None,
                "due": None,
                "comments": []
            },
            {
                "title": "Add Markdown rich text editor with @mentions and file drag-drop",
                "desc": "Replace plain text description with rich text preview supporting code blocks, task lists, and user mention popovers.",
                "type": IssueType.TASK,
                "priority": Priority.MEDIUM,
                "points": 5,
                "col": "Backlog",
                "assignee": "elena.r@acme.com",
                "sprint": None,
                "due": None,
                "comments": []
            },
            {
                "title": "Security vulnerability scan: bump transitive dependencies",
                "desc": "Run safety and npm audit to resolve moderate advisory in legacy tar parser.",
                "type": IssueType.BUG,
                "priority": Priority.LOW,
                "points": 1,
                "col": "Backlog",
                "assignee": "david.kim@acme.com",
                "sprint": None,
                "due": None,
                "comments": []
            }
        ]

        order_counter = 1000.0
        for item in issue_templates:
            issue, created = Issue.objects.get_or_create(
                project=eng_proj,
                title=item["title"],
                defaults={
                    "board_column": columns[item["col"]],
                    "sprint": item["sprint"],
                    "description": item["desc"],
                    "issue_type": item["type"],
                    "priority": item["priority"],
                    "story_points": item["points"],
                    "reporter": users["marcus.v@acme.com"],
                    "assignee": users[item["assignee"]] if item["assignee"] else None,
                    "order": order_counter,
                    "due_date": item["due"]
                }
            )
            order_counter += 1000.0

            if created:
                # Add comments
                for author_email, comment_text in item["comments"]:
                    IssueComment.objects.create(
                        issue=issue,
                        author=users[author_email],
                        content=comment_text
                    )

        # 6. Seed Invoices for Acme Corp
        BillingInvoice.objects.get_or_create(
            stripe_invoice_id='in_1NvK342eZvKYlo2C01A',
            defaults={
                'workspace': acme_ws,
                'amount_paid_cents': 1200,
                'currency': 'USD',
                'status': 'paid'
            }
        )
        BillingInvoice.objects.get_or_create(
            stripe_invoice_id='in_1OvL453fZwLZmp3D02B',
            defaults={
                'workspace': acme_ws,
                'amount_paid_cents': 1200,
                'currency': 'USD',
                'status': 'paid'
            }
        )

        # 7. Seed Webhook Endpoint
        WebhookEndpoint.objects.get_or_create(
            workspace=acme_ws,
            target_url='https://webhook.site/mock-saas-pm-integration',
            defaults={
                'description': 'Slack notification bot receiver',
                'events': ['issue.created', 'issue.moved', 'sprint.completed'],
                'is_active': True
            }
        )

        # 8. Seed Audit Log entries
        audit_samples = [
            ("WORKSPACE_CREATED", "Workspace", str(acme_ws.id), acme_ws.name, users['admin@acme.com'], {}),
            ("PROJECT_CREATED", "Project", str(eng_proj.id), "Cloud Platform Core (ENG)", users['admin@acme.com'], {}),
            ("SPRINT_STARTED", "Sprint", str(sprint_active.id), sprint_active.name, users['marcus.v@acme.com'], {"status": "active"}),
            ("MEMBER_ADDED", "WorkspaceMembership", str(users['elena.r@acme.com'].id), "Elena Rostova", users['admin@acme.com'], {"role": "member"}),
            ("ISSUE_MOVED", "Issue", "ENG-2", "Implement optimistic drag-and-drop Kanban state transition", users['elena.r@acme.com'], {"from_column": "In Progress", "to_column": "Code Review"}),
        ]

        for action, t_type, t_id, title, actor, changes in audit_samples:
            AuditLog.objects.create(
                workspace=acme_ws,
                actor=actor,
                action=action,
                target_type=t_type,
                target_id=t_id,
                target_title=title,
                changes=changes
            )

        self.stdout.write(self.style.SUCCESS("Enterprise seed dataset populated successfully!"))
        self.stdout.write(self.style.SUCCESS("Test credentials: admin@acme.com / Password123! (Acme Corp - Pro)"))
        self.stdout.write(self.style.SUCCESS("Test credentials: founder@starlight.io / Password123! (Starlight - Free Tenant)"))
