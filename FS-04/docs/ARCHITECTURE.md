# System Architecture & Multi-Tenancy Design

## 1. Multi-Tenant Isolation Strategy

Multi-tenant SaaS architectures typically fall into three patterns:
1. **Database-per-Tenant**: Separate database cluster or physical database per company. High isolation, but high infrastructure overhead and complex schema migrations.
2. **Schema-per-Tenant (PostgreSQL Schemas)**: Single database with separate schemas. Good isolation, but migration complexity grows linearly with tenant count ($O(N)$ DDL runs).
3. **Shared Database, Shared Schema with `tenant_id` (Our Chosen Strategy)**: Single relational database where every tenant-scoped table contains a foreign key to `Workspace` (`workspace_id`).

### Why Shared Schema with `tenant_id`?
- **Operational Scalability**: Schema migrations (`manage.py migrate`) run once in $O(1)$ time regardless of whether there are 10 or 10,000 workspaces.
- **Resource Efficiency**: A single connection pool and shared cache (Redis) serves all tenants, keeping operational costs low for starter tiers.
- **Strict Data Isolation via Middleware & QuerySets**: Isolation is enforced at the framework level before any database query executes:
  - `TenantContextMiddleware` identifies the tenant from the `X-Workspace-ID` HTTP header, query param, or user session.
  - Model managers automatically inject `filter(workspace=request.workspace)`.
  - Object-level permission classes (`IsWorkspaceMember`, `IsWorkspaceAdmin`) reject cross-tenant requests with `403 Forbidden`.

```
                Incoming HTTP Request
                         │
                         ▼
        ┌──────────────────────────────────┐
        │     TenantContextMiddleware      │
        │  • Extracts 'X-Workspace-ID'     │
        │  • Validates User in Workspace   │
        │  • Sets request.workspace        │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │      DRF Permission Classes      │
        │  • IsWorkspaceMember             │
        │  • IsWorkspaceAdmin              │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │      Scoped ViewSet QuerySet     │
        │  .filter(project__workspace=ws)  │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   PostgreSQL / SQLite Database   │
        └──────────────────────────────────┘
```

---

## 2. Relational Entity Schema

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│           Workspace             │ 1       * │       WorkspaceMembership       │
├─────────────────────────────────┼───────────┼─────────────────────────────────┤
│ id: UUID (PK)                   │           │ id: UUID (PK)                   │
│ name: CharField                 │           │ workspace_id: UUID (FK)         │
│ slug: SlugField (Unique)        │           │ user_id: UUID (FK)              │
│ plan: free | pro | enterprise   │           │ role: owner|admin|member|viewer │
│ max_members / max_projects      │           └─────────────────────────────────┘
└────────────────┬────────────────┘
                 │ 1
                 │
                 │ *
┌────────────────▼────────────────┐           ┌─────────────────────────────────┐
│            Project              │ 1       * │             Board               │
├─────────────────────────────────┼───────────┼─────────────────────────────────┤
│ id: UUID (PK)                   │           │ id: UUID (PK)                   │
│ workspace_id: UUID (FK)         │           │ project_id: UUID (FK)           │
│ key: CharField (e.g. 'ENG')     │           │ name: CharField                 │
│ name: CharField                 │           └────────────────┬────────────────┘
└────────────────┬────────────────┘                            │ 1
                 │ 1                                           │
                 │                                             │ *
                 │ *                                  ┌────────▼────────────────┐
┌────────────────▼────────────────┐                   │       BoardColumn       │
│            Sprint               │                   ├─────────────────────────┤
├─────────────────────────────────┤                   │ id: UUID (PK)           │
│ id: UUID (PK)                   │                   │ board_id: UUID (FK)     │
│ project_id: UUID (FK)           │                   │ name: CharField         │
│ name: CharField                 │                   │ order: Integer          │
│ status: planned|active|completed│                   │ wip_limit: Integer      │
│ start_date / end_date           │                   │ is_done_column: Boolean │
└────────────────┬────────────────┘                   └────────┬────────────────┘
                 │                                             │
                 │ 1 (optional)                                │ 1
                 │                                             │
                 │ *                                           │ *
┌────────────────▼─────────────────────────────────────────────▼────────────────┐
│                                     Issue                                     │
├───────────────────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                                 │
│ project_id: UUID (FK)                                                         │
│ board_column_id: UUID (FK)                                                    │
│ sprint_id: UUID (FK, nullable)                                                │
│ key: CharField (e.g. 'ENG-14')                                                │
│ title: CharField                                                              │
│ description: TextField                                                        │
│ issue_type: story | task | bug | epic                                         │
│ priority: urgent | high | medium | low                                        │
│ story_points: Integer                                                         │
│ reporter_id / assignee_id (FK User)                                           │
│ order: FloatField (Fractional indexing)                                       │
│ due_date: DateField                                                           │
└───────────────────────┬───────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │ 1                           │ 1
         │ *                           │ *
┌────────▼──────────────┐     ┌────────▼──────────────┐
│     IssueComment      │     │    IssueAttachment    │
├───────────────────────┤     ├───────────────────────┤
│ id: UUID (PK)         │     │ id: UUID (PK)         │
│ issue_id: UUID (FK)   │     │ issue_id: UUID (FK)   │
│ author_id: UUID (FK)  │     │ uploader_id: (FK)     │
│ content: TextField    │     │ file: FileField       │
│ created_at            │     │ file_size: Integer    │
└───────────────────────┘     └───────────────────────┘
```

---

## 3. High-Performance Drag-and-Drop Ordering Algorithm

Traditional list re-ordering requires executing $O(N)$ SQL updates:
`UPDATE issues SET order = order + 1 WHERE order >= destination_index`.
Under concurrent team usage, this generates row lock contention and database deadlocks.

### Our Solution: Fractional Indexing ($O(1)$ Update)
Each issue possesses a 64-bit float `order` field:
- Moving an issue between Item $A$ (order $1000.0$) and Item $B$ (order $2000.0$):
  $$\text{new\_order} = \frac{\text{order}_A + \text{order}_B}{2} = 1500.0$$
- Inserting at top:
  $$\text{new\_order} = \frac{\text{first\_item.order}}{2}$$
- Inserting at bottom:
  $$\text{new\_order} = \text{last\_item.order} + 65536.0$$

Result: Only **one** database row is updated (`UPDATE issues SET board_column_id = %s, order = %s WHERE id = %s`), completely eliminating table-locking contention during rapid drag-and-drop operations.

---

## 4. Background Job Architecture (Celery & Redis)

Asynchronous workflows run decoupled from the HTTP request-response cycle:
1. **Outbound Webhooks**:
   - `trigger_workspace_webhooks`: Dispatches JSON payloads signed with HMAC-SHA256 (`X-SaaS-Signature-256: sha256=<hex>`).
   - Exponential backoff retry on network failures ($3$ attempts).
   - Logs full diagnostic response (`duration_ms`, `response_status_code`, `response_body`).
2. **Weekly Sprint Digest Report (Celery Beat)**:
   - Evaluates active sprint story points, open vs closed issues, and compiles digests delivered to workspace members.
3. **Stripe Subscription Reconciliation (Celery Beat)**:
   - Polls active customer subscriptions every 6 hours and downgrades delinquent accounts automatically.

---

## 5. Stripe Billing Integration Architecture

- **Test Mode Subscriptions**: Free ($0/mo), Pro ($12/mo), Enterprise ($49/mo).
- **Stripe Webhook Handler**:
  - `checkout.session.completed`: Identifies tenant via `client_reference_id`, assigns `stripe_subscription_id`, and adjusts quotas (`max_members`, `max_projects`, `max_issues_per_project`).
  - `invoice.payment_succeeded`: Stores immutable invoice receipts in `BillingInvoice`.
  - `customer.subscription.deleted`: Gracefully transitions tenant back to Free Tier.
- **Quota Guardrail Middleware**: Blocks project and user creation when plan thresholds are met.
