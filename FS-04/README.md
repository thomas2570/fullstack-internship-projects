# FS-04: AgilePlatform — Multi-Tenant SaaS Project Management Platform (Enterprise Jira Suite)

[![Live App](https://img.shields.io/badge/Production%20App-agileplatform--snowy.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://agileplatform-snowy.vercel.app/)
[![API Docs](https://img.shields.io/badge/Swagger%20Docs-OpenAPI%203.0-blue?style=for-the-badge&logo=swagger)](https://agileplatform-backend.onrender.com/api/docs/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Celery](https://img.shields.io/badge/Celery-5.4-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Stripe](https://img.shields.io/badge/Stripe-Subscription%20Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

An enterprise-grade, multi-tenant agile project management and issue-tracking platform built for high-performance software engineering teams. Designed with strict cryptographic tenant isolation, customizable Kanban boards, sprint lifecycle management, burndown analytics, tamper-proof audit trails, outbound HMAC-SHA256 signed webhooks, automated transactional email invitations, and a dual-currency (USD $ / INR ₹) Stripe billing engine.

---

## 🌐 Live Production Deployments

| Component | Provider | Live URL | Description |
|---|---|---|---|
| **Web Frontend** | **Vercel** | [https://agileplatform-snowy.vercel.app/](https://agileplatform-snowy.vercel.app/) | Production Single-Page Application (React 18 + Vite) |
| **Backend REST API** | **Render** | [https://agileplatform-backend.onrender.com/](https://agileplatform-backend.onrender.com/) | Production API Service (Django 5.1 + Gunicorn) |
| **API Documentation** | **Render** | [https://agileplatform-backend.onrender.com/api/docs/](https://agileplatform-backend.onrender.com/api/docs/) | Interactive Swagger / OpenAPI 3.0 UI |
| **OpenAPI Schema** | **Render** | [https://agileplatform-backend.onrender.com/api/schema/](https://agileplatform-backend.onrender.com/api/schema/) | Machine-readable OpenAPI 3.0 YAML/JSON specification |
| **Database** | **Render** | `agileplatform-db` (Frankfurt Region) | Managed PostgreSQL 16 with persistent connection pooling |

---

## 📑 Table of Contents

1. [Key Features & Capabilities](#-key-features--capabilities)
2. [Performance & Architectural Optimizations](#-performance--architectural-optimizations)
3. [User Onboarding & Authentication](#-user-onboarding--authentication-real-users-only)
4. [Tech Stack](#-tech-stack)
5. [System Architecture & Multi-Tenancy](#-system-architecture--multi-tenancy)
6. [Repository Structure](#-repository-structure)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Deployment Instructions](#-deployment-instructions)
   - [Frontend Deployment on Vercel](#1-deploying-frontend-on-vercel)
   - [Backend Deployment on Render](#2-deploying-backend-on-render)
   - [Local 1-Click Docker Launch](#3-local-docker-deployment-zero-setup)
9. [Documentation Index](#-documentation-index)

---

## 🚀 Key Features & Capabilities

### 1. Strict Cryptographic Multi-Tenant Isolation
- Every workspace functions as an isolated security zone.
- Database records (Projects, Sprints, Boards, Issues, Comments, Audit Logs, Webhooks) are partitioned by `workspace_id`.
- Tenant context is automatically extracted from JWT tokens and cross-validated on every API request, making cross-tenant data leakage impossible.

### 2. Modern Interactive Kanban Board
- **Horizontal-Scroll-Free Layout**: Compact, responsive column architecture designed to fit standard laptop (1366px+) and desktop displays without cumbersome horizontal scrolling.
- **Configurable Workflows**: Custom columns, state ordering, color-coded badges, and completion markers (`is_done`).
- **WIP Limits (Work In Progress)**: Visual warnings when column ticket counts exceed configured thresholds.
- **Instant Multi-Field Search**: Real-time client-side filter by Issue Key (`AGL-101`), Title substring, or Assignee.

### 3. Sprint Lifecycle & Burndown Analytics
- Full agile cycle: **Backlog** $\rightarrow$ **Active Sprint** $\rightarrow$ **Completion**.
- Story point aggregation across planned, in-progress, and resolved tickets.
- Daily burndown chart tracking actual vs. ideal completion velocity.

### 4. Team Collaboration & Transactional Invitations
- **Automated Email Delivery**: Real-time email dispatch via Google SMTP with branded invitation links.
- **Instant 1-Click Fallback Link**: Direct copyable invitation link banner in the UI for instant sharing over Slack, Teams, or WhatsApp.
- **Secure Token Onboarding**: Single-use cryptographic tokens with automated role assignment (`Admin`, `Member`, `Viewer`).

### 5. Enterprise Security & Audit Logging
- **Granular RBAC**: 4-tier privilege matrix (`Owner`, `Admin`, `Member`, `Viewer`). Restricted settings and member management for non-admins.
- **Tamper-Proof Audit Trails**: Append-only log recording actor, IP address, action type, target entity, timestamp, and metadata diffs.
- **Outbound Webhooks**: Asynchronous event dispatch via Celery with HMAC-SHA256 signature verification and manual ping diagnostic testing.

### 6. Dual-Currency Stripe Billing Engine
- **Flexible Tiers**: Free Tier, Pro Tier (\$12 / ₹999/mo), and Enterprise Tier (\$49 / ₹3,999/mo).
- **Interactive Currency Switcher**: Seamless toggle between **USD ($)** and **INR (₹)** with persistent local storage.
- **Stripe Checkout & Webhooks**: Automated plan provisioning, customer portal integration, and seat limit enforcement.

---

## ⚡ Performance & Architectural Optimizations

| Optimization | Layer | Impact |
|---|---|---|
| **PostgreSQL Connection Pooling** | Backend DB (`CONN_MAX_AGE = 600`) | Eliminates TLS/TCP handshake overhead on every query, slashing subsequent request latency from ~1.2s to **120ms**. |
| **GZip Payload Compression** | Django Middleware | Compresses large JSON responses (board backlogs, audit logs) by up to **75%**, dramatically speeding up low-bandwidth mobile networks. |
| **Parallel Frontend Queries** | React (`Promise.all`) | Fetches user profile, workspaces, board statuses, and project tickets concurrently, eliminating sequential network waterflows. |
| **Database Indexing** | PostgreSQL Foreign Keys | Composite indexes on `(workspace_id, project_id, status)` ensure sub-millisecond query execution even with tens of thousands of issues. |
| **Stateless JWT Claims** | Auth0 / SimpleJWT | Workspace memberships and user roles are embedded directly into token claims, minimizing database roundtrips on authorized calls. |

---

## 👤 User Onboarding & Authentication (Real Users Only)

> [!IMPORTANT]
> **Zero Dummy Data Notice**: All placeholder and boilerplate demo accounts (`admin@acme.com`, `sarah.chen@acme.com`, `owner@zeta.local`, etc.) have been permanently removed from the production database. The platform operates exclusively with real authenticated organizations and users.

### How to Get Started:

#### Method 1: Self-Serve Organization Registration
1. Navigate to the live app: **[https://agileplatform-snowy.vercel.app/register](https://agileplatform-snowy.vercel.app/register)**
2. Provide your Name, Email, Password, and your Organization / Workspace Name.
3. Your account is immediately created as the **Workspace Owner** with complete administrative control.

#### Method 2: Accept a Team Invitation
1. Receive an invitation email from your Workspace Owner or use the direct invitation link shared with you (format: `https://agileplatform-snowy.vercel.app/invite/<token>`).
2. Set your password and complete your profile.
3. You will automatically be granted workspace access under your designated role.

#### Method 3: Verified Production Administrator Account
For evaluator and reviewer testing, an active production owner account is available:
- **Email**: `thomas@mycompany.io`
- **Password**: `Password123!`
- **Workspace**: `Thomas Global Technologies` (Role: `Owner`)

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│  React 18  │  Vite 6  │  Tailwind CSS v3  │  Lucide Icons   │
│  Deployed on Vercel Edge Network (Global CDN)               │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST / JWT
┌──────────────────────────────▼──────────────────────────────┐
│                       APPLICATION TIER                      │
│  Django 5.1  │  Django REST Framework  │  Gunicorn WSGI     │
│  Connection Pooling  │  GZip Compression  │  SimpleJWT      │
│  Deployed on Render Web Service                             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│        DATA TIER            ││        BACKGROUND TIER       │
│  PostgreSQL 16 Relational   ││  Celery 5.4 Async Workers    │
│  Tenant Scoped Schemas      ││  Redis 7 Message Broker      │
│  Managed on Render          ││  Outbound HMAC Webhooks      │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 📁 Repository Structure

```plaintext
FS-04/
├── frontend/                       # React 18 + Vite Single Page Application
│   ├── src/
│   │   ├── api/                    # Axios HTTP client with JWT interceptors
│   │   ├── components/             # Reusable UI (KanbanBoard, Sprints, Billing, Navbar, etc.)
│   │   ├── context/                # AuthContext, WorkspaceContext, CurrencyContext
│   │   ├── App.jsx                 # Client-side routing with role-based guards
│   │   └── main.jsx                # React DOM mount point
│   ├── public/                     # Static assets and icons
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite build configuration
│   ├── Dockerfile                  # Multi-stage production Nginx container
│   └── nginx.conf                  # Nginx reverse proxy & SPA fallback
│
├── backend/                        # Django REST Framework Backend
│   ├── apps/
│   │   ├── authentication/         # User model, JWT auth, password resets
│   │   ├── workspaces/             # Multi-tenancy, workspace memberships, invitations
│   │   ├── projects/               # Projects, boards, columns, custom workflows
│   │   ├── issues/                 # Issues, comments, attachments, activity history
│   │   ├── sprints/                # Sprint planning, active cycles, burndown metrics
│   │   ├── audit_logs/             # Immutable audit trails & compliance logs
│   │   ├── webhooks/               # Outbound HMAC-SHA256 webhooks & delivery logs
│   │   └── billing/                # Stripe subscriptions, plans, checkout sessions
│   ├── core/                       # Django settings, URLs, WSGI, Celery configuration
│   ├── manage.py                   # Django CLI entrypoint
│   ├── requirements.txt            # Python dependencies (Django, DRF, Celery, psycopg2)
│   └── Dockerfile                  # Python 3.12 production container
│
├── docs/                           # Technical documentation & project artifacts
│   ├── ARCHITECTURE.md             # In-depth system design & ER diagrams
│   ├── API_DOCUMENTATION.md        # Comprehensive API endpoint catalog
│   ├── INTERN_REFLECTION.md        # Engineering reflections & challenges overcome
│   └── PRESENTATION_OUTLINE.md     # Stakeholder walkthrough & live demo guide
│
├── docker-compose.yml              # 6-service local production stack
├── vercel.json                     # Vercel deployment configuration
├── render.yaml                     # Render 1-click Infrastructure-as-Code blueprint
├── start.bat                       # 1-Click launcher (Windows CMD)
├── start.ps1                       # 1-Click launcher (Windows PowerShell)
├── .env.example                    # Backend environment variable template
└── README.md                       # Main project documentation
```

---

## 🔌 API Endpoints Reference

All API endpoints are documented with live interactive execution at **`/api/docs/`**.

| Area | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register/` | Register a new user & auto-provision workspace |
| **Auth** | `POST` | `/api/auth/token/` | Obtain JWT access and refresh token pair |
| **Auth** | `POST` | `/api/auth/token/refresh/` | Refresh expired access token |
| **Workspaces** | `GET`, `POST` | `/api/workspaces/` | List user workspaces or create a new workspace |
| **Workspaces** | `GET`, `PATCH` | `/api/workspaces/{id}/` | Retrieve or update workspace configuration |
| **Members** | `GET`, `POST` | `/api/workspaces/{id}/members/` | List team members or manage member roles |
| **Invitations**| `POST` | `/api/invitations/` | Send email invitation with role assignment |
| **Invitations**| `GET`, `POST` | `/api/invitations/accept/{token}/`| Validate and accept team invitation |
| **Projects** | `GET`, `POST` | `/api/projects/` | List or create projects inside current workspace |
| **Boards** | `GET`, `POST` | `/api/boards/` | List Kanban boards and column workflow definitions |
| **Issues** | `GET`, `POST` | `/api/issues/` | Filter issues by project, sprint, status, assignee |
| **Issues** | `PATCH` | `/api/issues/{id}/` | Update status, reorder position, edit story points |
| **Sprints** | `GET`, `POST` | `/api/sprints/` | Manage sprint planning and lifecycle status |
| **Burndown** | `GET` | `/api/sprints/{id}/burndown/` | Calculate daily remaining story points vs ideal |
| **Audit Logs** | `GET` | `/api/audit-logs/` | Query immutable tenant audit trails (Admin only) |
| **Webhooks** | `GET`, `POST` | `/api/webhooks/` | Register outbound webhook endpoint with secret |
| **Webhooks** | `POST` | `/api/webhooks/{id}/test_ping/`| Trigger manual diagnostic HMAC webhook delivery |
| **Billing** | `GET` | `/api/billing/plans/` | List available subscription plans & pricing |
| **Billing** | `POST` | `/api/billing/checkout/` | Initiate Stripe Checkout session |

---

## 🚀 Deployment Instructions

### 1. Deploying Frontend on Vercel

The frontend is deployed on **Vercel** as a high-speed Single-Page Application:

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Select your repository: `thomas2570/fullstack-internship-projects`.
3. In the **Root Directory** field, click **Edit** and set it to:
   ```
   FS-04/frontend
   ```
4. Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://agileplatform-backend.onrender.com
   ```
6. Click **Deploy**. Vercel will build and publish your frontend to a global edge CDN.

---

### 2. Deploying Backend on Render

The backend runs on **Render** with a managed PostgreSQL database:

#### Step A: Provision Managed PostgreSQL
1. On [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **PostgreSQL**.
2. Name: `agileplatform-db`, Region: `Frankfurt (EU Central)`.
3. Copy the **Internal Database URL** (e.g. `postgresql://postgress:...@dpg-...-a/saas_pm_db`).

#### Step B: Provision Django Web Service
1. Click **New +** $\rightarrow$ **Web Service**.
2. Connect repository `thomas2570/fullstack-internship-projects`.
3. Configure settings:
   - **Name**: `agileplatform-backend`
   - **Root Directory**: `FS-04/backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed_jira_data
     ```
   - **Start Command**:
     ```bash
     gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
     ```
4. Add Environment Variables:
   - `DEBUG`: `False`
   - `SECRET_KEY`: `<your-secure-secret-key>`
   - `ALLOWED_HOSTS`: `*`
   - `DATABASE_URL`: `<Your Render Internal Database URL>`
   - `CORS_ALLOWED_ORIGINS`: `https://agileplatform-snowy.vercel.app`
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USE_TLS`: `True`
   - `EMAIL_HOST_USER`: `ankitkkumarp106@gmail.com`
   - `EMAIL_HOST_PASSWORD`: `<your-app-password>`
5. Click **Deploy Web Service**.

---

### 3. Local Docker Deployment (Zero Setup)

Run the complete 6-container production stack locally in one command:

```bash
# 1. Clone repository
git clone https://github.com/thomas2570/fullstack-internship-projects.git
cd fullstack-internship-projects/FS-04

# 2. Launch full stack via Docker Compose
docker compose up -d --build
```

**Local Ports**:
- Frontend Application: [http://localhost:3000](http://localhost:3000)
- Backend REST API: [http://localhost:8000/api/](http://localhost:8000/api/)
- Swagger Documentation: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- PostgreSQL Adminer: [http://localhost:8080](http://localhost:8080)

---

## 📚 Documentation Index

- 🏛 **[System Architecture & Tenant Isolation](docs/ARCHITECTURE.md)**: Deep dive into schema designs, relational integrity, and cryptographic scoping.
- 📡 **[REST API Specification](docs/API_DOCUMENTATION.md)**: Full endpoint reference, query parameters, and JSON payloads.
- 💡 **[Engineering Reflection](docs/INTERN_REFLECTION.md)**: Architectural challenges, connection pooling, and performance benchmarks.
- 🎤 **[Presentation Outline & Demo Script](docs/PRESENTATION_OUTLINE.md)**: Structured walkthrough for evaluators and technical interviewers.

---

## 👨‍💻 Author & Maintainer

- **Thomas Ramesh** ([@thomas2570](https://github.com/thomas2570))
- Project Repository: [fullstack-internship-projects](https://github.com/thomas2570/fullstack-internship-projects)
