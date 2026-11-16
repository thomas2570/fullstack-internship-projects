# API Reference & Endpoint Documentation

Interactive OpenAPI / Swagger documentation is available at:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Raw OpenAPI 3.0 Schema: `http://localhost:8000/api/schema/`

---

## 1. Authentication & Security

All tenant-scoped requests require two headers:
1. `Authorization: Bearer <jwt_access_token>`
2. `X-Workspace-ID: <workspace_uuid_or_slug>`

### Endpoints

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new user + initial workspace | Public |
| `POST` | `/api/auth/login/` | Obtain JWT token pair + user workspaces | Public |
| `POST` | `/api/auth/refresh/` | Refresh access token | Public |
| `GET/PATCH` | `/api/auth/me/` | View or update logged-in user profile | Authenticated |
| `GET` | `/api/auth/directory/` | List team members in active workspace | Authenticated |

---

## 2. Workspaces (Tenants)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/workspaces/` | List all workspaces user is a member of | Authenticated |
| `POST` | `/api/workspaces/` | Create a new tenant workspace | Authenticated |
| `GET/PATCH`| `/api/workspaces/{id}/` | View / update workspace settings | IsWorkspaceAdmin |
| `GET` | `/api/workspaces/stats/` | Workspace dashboard metrics | IsWorkspaceMember |
| `GET` | `/api/workspaces/members/`| List all members in active workspace | IsWorkspaceMember |
| `POST` | `/api/workspaces/invite/` | Invite or add member by email & role | IsWorkspaceAdmin |

---

## 3. Projects & Boards

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/projects/` | List projects in active workspace | IsWorkspaceMember |
| `POST` | `/api/projects/` | Create project (enforces plan quota) | IsWorkspaceAdmin |
| `GET/PATCH/DEL` | `/api/projects/{id}/` | Manage project settings | IsWorkspaceAdmin |
| `GET` | `/api/boards/?project_id={id}`| List boards for project | IsWorkspaceMember |
| `POST` | `/api/boards/{board_id}/columns/` | Add custom workflow stage | IsWorkspaceAdmin |
| `PATCH/DEL` | `/api/boards/columns/{col_id}/` | Edit WIP limit / delete column | IsWorkspaceAdmin |

---

## 4. Sprints & Burndown

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET/POST` | `/api/sprints/?project_id={id}` | List or create sprints | IsWorkspaceMember |
| `POST` | `/api/sprints/{id}/start/` | Transition sprint to ACTIVE | IsWorkspaceAdmin |
| `POST` | `/api/sprints/{id}/complete/` | Complete sprint & roll open issues | IsWorkspaceAdmin |
| `GET` | `/api/sprints/{id}/burndown/` | Daily burndown coordinates | IsWorkspaceMember |

---

## 5. Issues & Drag-and-Drop Reordering

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/issues/?project_id={id}` | List issues with filters & ordering | IsWorkspaceMember |
| `POST` | `/api/issues/` | Create issue (enforces quota) | IsWorkspaceMember |
| `GET/PATCH/DEL` | `/api/issues/{id}/` | View, edit fields, delete issue | IsWorkspaceMember |
| `POST` | `/api/issues/{id}/move/` | **Drag-and-drop column & order shift** | IsWorkspaceMember |
| `GET/POST` | `/api/issues/{id}/comments/` | List or post issue comments | IsWorkspaceMember |
| `GET/POST` | `/api/issues/{id}/attachments/` | List or upload files (multipart) | IsWorkspaceMember |

#### Drag-and-Drop Move Request Payload
```json
{
  "column_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "order": 4500.0
}
```

---

## 6. Webhooks & Background Tasks

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET/POST` | `/api/webhooks/` | List or register outbound webhook | IsWorkspaceAdmin |
| `POST` | `/api/webhooks/{id}/ping/` | Dispatch test HMAC-SHA256 ping event | IsWorkspaceAdmin |
| `GET` | `/api/webhooks/{id}/deliveries/` | Inspect HTTP response logs | IsWorkspaceAdmin |

---

## 7. Stripe Billing & Subscriptions

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/billing/plans/` | List available subscription tiers | Public |
| `GET` | `/api/billing/subscription/`| Current workspace plan & quota usage | IsWorkspaceAdmin |
| `POST` | `/api/billing/checkout/` | Create Stripe checkout session / upgrade | IsWorkspaceAdmin |
| `POST` | `/api/billing/portal/` | Create Stripe Customer Portal session | IsWorkspaceOwner |
| `POST` | `/api/billing/webhook/` | Incoming Stripe webhook receiver | Public / Stripe Sig |
