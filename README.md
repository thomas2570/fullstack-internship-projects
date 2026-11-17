# 🚀 Fullstack Internship Projects Monorepo

[![Monorepo](https://img.shields.io/badge/Monorepo-FS--03%20%7C%20FS--04-blue.svg?style=for-the-badge)](https://github.com/thomas2570/fullstack-internship-projects)
[![Live FS-04 App](https://img.shields.io/badge/FS--04%20Live-agileplatform--snowy.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://agileplatform-snowy.vercel.app/)
[![Live FS-03 App](https://img.shields.io/badge/FS--03%20Live-eduflowacademy.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://eduflowacademy.vercel.app/)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Micro--Monorepo-orange?style=for-the-badge)](./FS-04/docs/ARCHITECTURE.md)

Welcome to the **Fullstack Internship Projects** monorepo maintained by **Thomas Ramesh** ([@thomas2570](https://github.com/thomas2570)). This repository houses independent, enterprise-grade fullstack systems organized into strictly isolated subdirectories.

Each project is designed to be **completely modular, self-contained, and independently deployable** to modern cloud platforms (Vercel, Render, Railway, Docker) with zero cross-project dependency conflicts.

---

## 🌐 Official Live Production Websites

Both flagship applications are deployed and fully functional in production:

| Project | Subdirectory | Domain / Category | Live Production URL | Documentation |
|---|---|---|---|---|
| **AgilePlatform** | [`FS-04`](./FS-04/) | Multi-Tenant SaaS PM & Jira Suite | **[https://agileplatform-snowy.vercel.app/](https://agileplatform-snowy.vercel.app/)** | [📖 FS-04 Documentation](./FS-04/README.md) |
| **EduFlow Academy** | [`FS-03`](./FS-03/) | Enterprise Real-Time LMS | **[https://eduflowacademy.vercel.app/](https://eduflowacademy.vercel.app/)** | [📖 FS-03 Documentation](./FS-03/README.md) |

---

## 📁 Repository Directory Structure

```plaintext
fullstack-internship-projects/
├── .gitignore                      # Global gitignore protecting all subdirectories
├── README.md                       # Monorepo architecture & multi-project deployment guide
│
├── FS-03/                          # EduFlow Academy (Enterprise Learning Management System)
│   ├── client/                     # React 18 + Vite + Tailwind CSS + Redux Toolkit
│   ├── server/                     # Node.js + Express + MongoDB + Socket.IO + Redis
│   ├── api/                        # Vercel Serverless Server entrypoint
│   ├── docs/                       # Architecture, API docs, presentation & reflection
│   ├── package.json                # Monorepo scripts (dev, build, seed, test)
│   ├── vercel.json                 # Unified single-domain deployment config
│   ├── README.md                   # Complete LMS documentation & setup
│   ├── start.bat                   # 1-Click launcher (Windows CMD)
│   └── start.ps1                   # 1-Click launcher (Windows PowerShell)
│
└── FS-04/                          # AgilePlatform (Multi-Tenant SaaS Project Management Platform)
    ├── frontend/                   # React 18 + Vite + Tailwind CSS SPA
    ├── backend/                    # Django 5.1 + DRF + Celery + PostgreSQL 16
    ├── docs/                       # Architecture, API docs, reflection & presentation
    │   ├── ARCHITECTURE.md         # Cryptographic multi-tenancy & ER diagrams
    │   ├── API_DOCUMENTATION.md    # REST API specification & schemas
    │   ├── INTERN_REFLECTION.md    # Technical learnings & performance optimizations
    │   └── PRESENTATION_OUTLINE.md # Stakeholder walkthrough & live demo script
    ├── docker-compose.yml          # Production 6-service local stack
    ├── package.json                # Monorepo helper build scripts
    ├── vercel.json                 # Vercel deployment configuration
    ├── render.yaml                 # Render Infrastructure Blueprint
    ├── README.md                   # Complete Jira-clone documentation & setup
    ├── start.bat                   # 1-Click Docker launcher (Windows CMD)
    └── start.ps1                   # 1-Click Docker launcher (Windows PowerShell)
```

---

## 🌟 Project Deep Dives

### 1. FS-04: AgilePlatform (Enterprise Multi-Tenant Jira Suite)
- **Official Live Website**: **[https://agileplatform-snowy.vercel.app/](https://agileplatform-snowy.vercel.app/)**
- **Core Stack**: React 18, Django 5.1, DRF, PostgreSQL 16, Celery, Redis, Stripe, Tailwind CSS
- **Key Features**:
  1. **Strict Multi-Tenant Isolation**: Tenant scoping enforced on all database queries and foreign keys.
  2. **High-Speed Database Connection Pooling**: Persistent PostgreSQL connection pooling (`CONN_MAX_AGE = 600`) reducing query overhead to sub-150ms.
  3. **Transactional Email & Instant Links**: Real-time Google SMTP transactional emails combined with 1-click fallback invitation link generation.
  4. **Interactive Kanban & Sprints**: Fluid drag-and-drop workflow with configurable WIP limits, completion badges, and story-point burndown charts.
  5. **Dual-Currency Billing**: Multi-tier Stripe subscription checkout with dynamic **USD ($) / INR (₹)** currency switching.
- **Verified Evaluator Access**:
  - **Email**: `thomas@mycompany.io`
  - **Password**: `Password123!`
  - **Workspace**: `Thomas Global Technologies` (Role: `Owner`)
  - *Or register your own new organization instantly via [https://agileplatform-snowy.vercel.app/register](https://agileplatform-snowy.vercel.app/register).*

### 2. FS-03: EduFlow Academy (Full-Stack Real-Time LMS)
- **Official Live Website**: **[https://eduflowacademy.vercel.app/](https://eduflowacademy.vercel.app/)**
- **Core Stack**: React 18, Vite, Redux Toolkit, Node.js, Express, MongoDB Atlas, Socket.IO, WebRTC, Tailwind CSS
- **Key Features**:
  1. **Interactive Virtual Classroom**: Low-latency 2-way WebRTC video/audio peer connections with SDP signaling over Socket.IO and live screen sharing.
  2. **Adaptive Video Learning & Quizzes**: Module-by-module progress tracking, playback speed controls, and auto-graded assessments with instant explanations.
  3. **Cryptographic Certificate Verification**: Programmatically generated PDFKit completion certificates stamped with SHA-256 HMAC digital signatures and scannable QR verification codes.
  4. **Instructor Studio & Monetization**: Dedicated educator dashboard with revenue analytics, course upload pipelines, and withdrawal disbursement management.

---

## 🚀 Independent Cloud Deployment Guides

Each project is completely decoupled. Deploy each service independently following the steps below:

### 1. Deploying FS-04 on Vercel & Render

#### A. Frontend on Vercel:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) $\rightarrow$ **Add New Project**.
2. Select repository: `thomas2570/fullstack-internship-projects`.
3. In **Root Directory**, set to:
   ```
   FS-04/frontend
   ```
4. Framework Preset: **Vite** (Build: `npm run build`, Output: `dist`).
5. Environment Variable:
   - `VITE_API_URL`: `<your-backend-api-url>`
6. Click **Deploy**.

#### B. Backend & PostgreSQL on Render:
1. In Render Dashboard, create a **PostgreSQL Database**.
2. Create a **Web Service** connected to `thomas2570/fullstack-internship-projects`.
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
   - `ALLOWED_HOSTS`: `*`
   - `DATABASE_URL`: `<your-database-connection-url>`
   - `CORS_ALLOWED_ORIGINS`: `https://agileplatform-snowy.vercel.app`
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USE_TLS`: `True`
   - `EMAIL_HOST_USER`: `<your-smtp-email>`
   - `EMAIL_HOST_PASSWORD`: `<your-smtp-app-password>`

---

### 2. Deploying FS-03 (EduFlow Academy LMS)

#### A. Frontend & Serverless on Vercel:
1. In Vercel Dashboard $\rightarrow$ **Add New Project**.
2. Select repository: `thomas2570/fullstack-internship-projects`.
3. Set **Root Directory** to: `FS-03`
4. Set Environment Variables:
   - `MONGO_URI`: `<your-mongodb-atlas-uri>`
   - `JWT_SECRET`: `<your-jwt-secret>`
   - `NODE_ENV`: `production`
5. Click **Deploy**.

#### B. Persistent Node.js Server on Render / Railway:
1. Create a **Web Service** on Render or Railway.
2. Set **Root Directory** to: `FS-03/server`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Set environment variables based on `FS-03/server/.env.example`.

---

## 🔒 Security & Code Quality Standards

1. **Zero Secret Leakage**: All `.env` files containing live credentials or API tokens are strictly gitignored. Only sanitized `.env.example` templates are tracked.
2. **Cryptographic Multi-Tenancy & Integrity**: Tenant isolation in FS-04 and SHA-256 HMAC certificate validation in FS-03.
3. **Stateless JWT Claims**: Fast, tamper-evident user session authorization.
4. **Persistent Connection Pooling**: Low-latency database connection reuse with automated connection recycling.
5. **Isolated Directories**: Zero cross-contamination between micro-projects in the repository.

---

## ⚡ Quick Start: Running Projects Locally

### Run FS-04 (AgilePlatform) via Docker Compose
```bash
cd FS-04
docker compose up -d --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API & Docs: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- PostgreSQL Adminer: [http://localhost:8080](http://localhost:8080)

### Run FS-03 (EduFlow Academy)
```bash
cd FS-03
npm run install:all
npm run seed
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## 👨‍💻 Author & Maintainer

- **Thomas Ramesh** ([@thomas2570](https://github.com/thomas2570))
- Monorepo: [github.com/thomas2570/fullstack-internship-projects](https://github.com/thomas2570/fullstack-internship-projects)
