# FS-04: Multi-Tenant SaaS Project Management Platform (Enterprise Jira Clone)

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Celery](https://img.shields.io/badge/Celery-5.4-37814A.svg)](https://docs.celeryq.dev/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF.svg)](https://stripe.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

A production-grade, multi-tenant agile project management platform where each enterprise operates inside its own cryptographically isolated workspace with customizable Kanban boards, sprints, burndown charts, background Celery jobs, outbound HMAC-signed webhooks, compliance audit logging, interactive currency switcher (USD $ / INR ₹), and Stripe subscription billing.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Tech Stack](#-tech-stack)
3. [Repository Directory Structure](#-repository-directory-structure)
4. [Deployment Guides](#-deployment-guides)
   - [Deploy Frontend on Vercel](#1-deploying-frontend-on-vercel)
   - [Deploy Backend & Celery on Render](#2-deploying-backend-on-render)
   - [Local Docker 1-Click Launch](#3-local-docker-deployment-zero-setup)
5. [Demo Credentials & Seed Accounts](#-demo-accounts--seed-data)
6. [Documentation Index](#-documentation-index)

---

## 🚀 Core Features

- **Multi-Tenant Isolation**: Strict tenant isolation across Workspaces, Projects, Issues, and Boards.
- **Strict Role-Based Access Control (RBAC)**: Enforced roles (`Owner`, `Admin`, `Member`, `Viewer`). Non-admins are restricted from administrative actions.
- **Interactive Kanban Board**: Flexible column layout with zero horizontal scrollbar on standard laptops/desktops, WIP Limits, and multi-field search (Issue Key, Title, Assignee).
- **Custom Workflows**: Add, reorder, and configure custom workflow stages with colors and completion markers.
- **Sprint & Backlog Management**: Complete sprint lifecycle (Planning $\rightarrow$ Active Sprint $\rightarrow$ Completion) with story points aggregation.
- **Tamper-Proof Audit Logging**: Immutable logs recording user actions, status changes, comments, and file attachments.
- **Outbound Webhooks**: Background webhook delivery via Celery with HMAC-SHA256 payload signing and manual test ping.
- **Subscription Billing & Currency Switcher**: Free, Pro, and Enterprise tiers with live Stripe test billing and interactive **USD ($) / INR (₹)** toggle with local persistence.
- **Responsive Mobile Experience**: Slide-in navigation drawer with direct modal buttons for admins to create Workspaces and Projects.

---

## 🛠 Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive SPA with optimistic updates and local currency state |
| **Backend API** | Django 5.1 & Django REST Framework | Clean REST API with custom permissions and tenant context |
| **Authentication** | SimpleJWT | Stateless JSON Web Tokens with embedded workspace claims |
| **Database** | PostgreSQL 16 | Relational storage with foreign key tenant scoping and indexes |
| **Async Tasks & Queue** | Celery 5.4 + Redis 7 | Outbound webhooks and background workers |
| **Billing** | Stripe API | Self-serve subscription checkout and quota enforcement |
| **Containerization** | Docker & Docker Compose | Multi-container architecture with Nginx reverse proxy |

---

## 📁 Repository Directory Structure

```plaintext
FS-04/
├── frontend/                       # React 18 + Vite + Tailwind CSS SPA
│   ├── src/                        # Components, context, API client
│   ├── public/                     # Favicon, SVG icons
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite build setup
│   ├── Dockerfile                  # Production Nginx image
│   └── nginx.conf                  # Production reverse proxy
│
├── backend/                        # Django REST Framework Backend
│   ├── apps/                       # Modular Django apps (workspaces, projects, issues, etc.)
│   ├── core/                       # Settings, urls, wsgi, celery
│   ├── manage.py                   # Django CLI
│   ├── requirements.txt            # Python dependencies (Django, Celery, Gunicorn, Whitenoise)
│   └── Dockerfile                  # Python 3.12 Docker image
│
├── docs/                           # Architecture, API docs, presentation & reflection
│   ├── ARCHITECTURE.md             # System design, ER diagrams, tenant isolation
│   ├── API_DOCUMENTATION.md        # Comprehensive endpoint reference
│   ├── INTERN_REFLECTION.md        # Technical reflections and design decisions
│   └── PRESENTATION_OUTLINE.md     # Stakeholder walkthrough
│
├── docker-compose.yml              # 6-service local/production stack
├── package.json                    # Monorepo root helper scripts
├── vercel.json                     # Vercel deployment & rewrite configuration
├── render.yaml                     # Render Blueprint for 1-click cloud deployment
├── start.bat                       # 1-Click launcher (Windows CMD)
├── start.ps1                       # 1-Click launcher (Windows PowerShell)
├── .env.example                    # Sample environment variables
└── README.md                       # Complete project guide
```

---

## 🌐 Deployment Guides

### 1. Deploying Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) $\rightarrow$ **Add New Project**.
2. Select repository: `thomas2570/fullstack-internship-projects`.
3. In **Root Directory**, click **Edit** and choose:
   ```
   FS-04/frontend
   ```
4. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://your-backend-service.onrender.com
   ```
6. Click **Deploy**.

---

### 2. Deploying Backend on Render

#### Option A: 1-Click Render Blueprint
1. In Render Dashboard, click **New +** $\rightarrow$ **Blueprint**.
2. Connect `thomas2570/fullstack-internship-projects`.
3. Render will read `FS-04/render.yaml` and provision:
   - PostgreSQL Database (`agileplatform-db`)
   - Redis Service (`agileplatform-redis`)
   - Django Web API (`agileplatform-backend`)
   - Celery Worker (`agileplatform-celery-worker`)

#### Option B: Manual Web Service on Render
1. Click **New +** $\rightarrow$ **Web Service**.
2. Select `thomas2570/fullstack-internship-projects`.
3. Settings:
   - **Root Directory**: `FS-04/backend`
   - **Runtime**: Python 3
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
   - `SECRET_KEY`: `<your-random-secret>`
   - `ALLOWED_HOSTS`: `*`
   - `DATABASE_URL`: Connection string from Render PostgreSQL
   - `REDIS_URL`: Connection string from Render Redis

---

### 3. Local Docker Deployment (Zero Setup)

Run with Docker Compose:
```bash
cd FS-04
docker compose up -d --build
```
Access points:
- **Frontend App**: `http://localhost:3000`
- **Backend API & Swagger**: `http://localhost:8000/api/docs/`
- **Database Adminer**: `http://localhost:8080`

---

## 👤 Demo Accounts & Seed Data

| Role | Email | Password | Workspace |
|---|---|---|---|
| **Workspace Owner (Admin)** | `owner@zeta.local` | `Password123!` | Zeta Technologies |
| **Software Engineer (Member)** | `member@zeta.local` | `Password123!` | Zeta Technologies |
| **Demo Admin** | `admin@example.com` | `admin123` | Default Workspace |

---

## 📚 Documentation Index

- [Architecture & Multi-Tenancy Design](docs/ARCHITECTURE.md)
- [REST API Documentation](docs/API_DOCUMENTATION.md)
- [Intern Reflection & Key Learnings](docs/INTERN_REFLECTION.md)
- [Presentation Outline & Demo Script](docs/PRESENTATION_OUTLINE.md)
