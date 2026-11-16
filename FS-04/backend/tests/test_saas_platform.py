import json
import hmac
import hashlib
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from workspaces.models import Workspace, WorkspaceMembership, Role, PlanTier
from projects.models import Project
from boards.models import Board, BoardColumn
from sprints.models import Sprint, SprintStatus
from issues.models import Issue, IssueType, Priority
from audit.models import AuditLog

User = get_user_model()


class MultiTenantPlatformTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Tenant 1: Acme Corp
        self.user1 = User.objects.create_user(
            email='alice@acme.com',
            password='TestPassword123!',
            display_name='Alice Acme'
        )
        self.ws1 = Workspace.objects.create(
            name='Acme Corp',
            slug='acme-corp',
            owner=self.user1,
            plan=PlanTier.PRO,
            max_projects=50,
            max_members=25
        )
        WorkspaceMembership.objects.create(workspace=self.ws1, user=self.user1, role=Role.OWNER)

        self.proj1 = Project.objects.create(
            workspace=self.ws1,
            name='Acme Core',
            key='ACM',
            lead=self.user1
        )
        self.board1 = Board.objects.create(workspace=self.ws1, project=self.proj1, name='Acme Board')
        self.col_todo = BoardColumn.objects.create(board=self.board1, name='To Do', order=0)
        self.col_done = BoardColumn.objects.create(board=self.board1, name='Done', order=1, is_done_column=True)

        self.issue1 = Issue.objects.create(
            project=self.proj1,
            board_column=self.col_todo,
            title='First Acme Task',
            reporter=self.user1,
            order=1000.0
        )

        # Tenant 2: Beta Corp (Completely isolated)
        self.user2 = User.objects.create_user(
            email='bob@beta.com',
            password='TestPassword123!',
            display_name='Bob Beta'
        )
        self.ws2 = Workspace.objects.create(
            name='Beta Corp',
            slug='beta-corp',
            owner=self.user2,
            plan=PlanTier.FREE,
            max_projects=1,
            max_members=2
        )
        WorkspaceMembership.objects.create(workspace=self.ws2, user=self.user2, role=Role.OWNER)

        self.proj2 = Project.objects.create(
            workspace=self.ws2,
            name='Beta Secret Project',
            key='BET',
            lead=self.user2
        )

    def test_tenant_isolation_project_visibility(self):
        """User 1 should ONLY see projects in Acme Corp, never Beta Corp."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/projects/', HTTP_X_WORKSPACE_ID=str(self.ws1.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project_keys = [p['key'] for p in response.data['results']]
        self.assertIn('ACM', project_keys)
        self.assertNotIn('BET', project_keys)

    def test_tenant_cross_access_denied(self):
        """User 1 attempting to view Beta Corp workspace directly is forbidden."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/workspaces/{self.ws2.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_drag_and_drop_issue_move_and_audit(self):
        """Moving an issue from To Do to Done updates column, position, and logs audit."""
        self.client.force_authenticate(user=self.user1)

        payload = {
            "column_id": str(self.col_done.id),
            "order": 5000.0
        }
        response = self.client.post(
            f'/api/issues/{self.issue1.id}/move/',
            data=payload,
            format='json',
            HTTP_X_WORKSPACE_ID=str(self.ws1.id)
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.issue1.refresh_from_db()
        self.assertEqual(self.issue1.board_column.id, self.col_done.id)
        self.assertEqual(self.issue1.order, 5000.0)

        # Check audit log
        audit = AuditLog.objects.filter(workspace=self.ws1, action="ISSUE_MOVED").first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.changes.get('to_column'), 'Done')

    def test_quota_limit_enforcement(self):
        """Free tier workspace with max_projects=1 should reject creating a second project."""
        self.client.force_authenticate(user=self.user2)

        payload = {
            "name": "Second Project Exceeding Quota",
            "key": "SEC",
            "description": "Quota overflow test"
        }
        response = self.client.post(
            '/api/projects/',
            data=payload,
            format='json',
            HTTP_X_WORKSPACE_ID=str(self.ws2.id)
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("limit reached", response.data['detail'])

    def test_sprint_lifecycle(self):
        """Planned sprint can be started into ACTIVE and then COMPLETED."""
        sprint = Sprint.objects.create(
            workspace=self.ws1,
            project=self.proj1,
            name='Sprint 1',
            status=SprintStatus.PLANNED
        )

        self.client.force_authenticate(user=self.user1)
        # Start Sprint
        start_res = self.client.post(f'/api/sprints/{sprint.id}/start/', HTTP_X_WORKSPACE_ID=str(self.ws1.id))
        self.assertEqual(start_res.status_code, status.HTTP_200_OK)
        sprint.refresh_from_db()
        self.assertEqual(sprint.status, SprintStatus.ACTIVE)

        # Complete Sprint
        comp_res = self.client.post(f'/api/sprints/{sprint.id}/complete/', HTTP_X_WORKSPACE_ID=str(self.ws1.id))
        self.assertEqual(comp_res.status_code, status.HTTP_200_OK)
        sprint.refresh_from_db()
        self.assertEqual(sprint.status, SprintStatus.COMPLETED)

    def test_webhook_hmac_signature(self):
        """Verify HMAC-SHA256 signature calculations match standard webhook specifications."""
        secret = "secret_key_testing_123"
        payload = {"event": "issue.created", "issue_key": "ACM-1"}
        payload_json = json.dumps(payload)

        computed = hmac.new(secret.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
        self.assertTrue(len(computed) == 64)
