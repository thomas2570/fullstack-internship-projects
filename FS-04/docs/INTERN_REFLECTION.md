# Intern Engineering Reflection: Multi-Tenant SaaS Project Management Platform

**Author**: Full-Stack Engineering Intern  
**Project Track**: Full-Stack Development (FS-04)  
**Submission**: Multi-Tenant SaaS Agile Project Management Platform  

---

## 1. What I Owned & Delivered
During this 14-day project cycle, I owned the end-to-end architecture and implementation of our enterprise multi-tenant SaaS project management platform:
1. **Multi-Tenancy Isolation Layer**: Designed the shared-schema database model, `TenantModel` base class, and `TenantContextMiddleware` that automatically isolates queries by `workspace_id`.
2. **REST API & RBAC Permissions**: Implemented all Django REST Framework viewsets with role-based access control (`Owner`, `Admin`, `Member`, `Viewer`) covering projects, boards, workflow columns, sprints, issues, and audit logs.
3. **Interactive Drag-and-Drop Kanban**: Built the React frontend Kanban board using `@hello-pangea/dnd`, implementing optimistic state updates and fractional index positioning.
4. **Celery Worker & Webhook Automation**: Developed the asynchronous task pipeline for outbound webhooks signed with HMAC-SHA256, weekly sprint summary digests, and Stripe subscription synchronization.
5. **Stripe Test Billing**: Integrated Stripe Billing with self-serve checkout sessions, customer portal generation, plan quota enforcement, and webhook listeners.
6. **Docker & CI/CD Pipeline**: Authored multi-stage Dockerfiles, Docker Compose environment, and GitHub Actions CI workflow.

---

## 2. Key Technical Learnings & Breakthroughs

### Learning 1: Multi-Tenant Data Leakage Prevention
The most critical requirement for any B2B SaaS platform is ensuring Tenant A can never read or mutate Tenant B's data. I initially considered using PostgreSQL schemas per tenant, but realized that running migrations across dozens of schemas during production deployments introduces high failure risk and slow deployment times. By adopting a shared schema with a foreign key to `Workspace` and enforcing isolation at both the middleware and queryset levels, we achieved $O(1)$ migration performance while maintaining isolation.

### Learning 2: Concurrency & Fractional Ordering in Drag-and-Drop
In early prototypes, moving an issue required incrementing or decrementing the order field of all subsequent cards in that column ($O(N)$ database updates). This caused database lock contention when two team members moved cards at the same time. I refactored the ordering system to use **fractional indexing** ($\text{new\_order} = \frac{\text{order}_A + \text{order}_B}{2}$). This reduced every drag-and-drop action to a single, isolated $O(1)$ SQL `UPDATE`.

### Learning 3: DRF Authentication Lifecycle vs Django Middleware
One subtle bug I debugged was why `request.user` was initially unauthenticated in `TenantContextMiddleware.process_request`. I discovered that DRF's JWT authentication runs inside the view's `initial()` method, after standard Django middleware completes. I resolved this cleanly by making workspace resolution dynamic so that it can be evaluated both in middleware and on-demand within DRF's permission checks.

---

## 3. What I Would Do Differently / Next Steps
If given another sprint, I would:
- Integrate **Django Channels** and WebSockets so that when one user moves a card on the Kanban board, other active team members see the card move across their screens in real-time without refreshing.
- Implement **Row-Level Security (RLS)** directly in PostgreSQL as a defense-in-depth layer underneath Django's ORM filters.
- Add OAuth2 Google / GitHub single sign-on (SSO) for enterprise workspaces.
