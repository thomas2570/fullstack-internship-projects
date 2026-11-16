# 🚀 Fullstack Internship Projects Monorepo

Welcome to the **Fullstack Internship Projects** monorepo. This repository houses independent, production-grade fullstack projects organized into isolated subdirectories.

Each project is designed to be **completely modular, self-contained, and independently deployable** to platforms like Vercel, Netlify, Render, Railway, AWS, and Docker without interfering with other projects.

---

## 📁 Repository Directory Structure

```plaintext
fullstack-internship-projects/
├── .gitignore                      # Global gitignore protecting all subdirectories
├── README.md                       # Monorepo architecture & multi-project deployment guide
│
├── FS-01/                          # [Reserved for Fullstack Project 01]
│
├── FS-02/                          # [Reserved for Fullstack Project 02]
│
├── FS-03/                          # EduFlow Live LMS (Enterprise Learning Management System)
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
    ├── frontend/                   # React 18 + Vite + Tailwind CSS + Lucide Icons
    ├── backend/                    # Django 5.1 + DRF + Celery + PostgreSQL + Redis
    ├── docs/                       # Architecture, API docs, presentation & reflection
    ├── docker-compose.yml          # Production 6-service Docker stack
    ├── package.json                # Monorepo build and test scripts
    ├── vercel.json                 # Unified Vercel rewrite configuration
    ├── render.yaml                 # 1-Click Render Blueprint
    ├── README.md                   # Complete Jira-clone documentation & setup
    ├── start.bat                   # 1-Click Docker launcher (Windows CMD)
    └── start.ps1                   # 1-Click Docker launcher (Windows PowerShell)
```

---

## 🌟 Projects Overview

| Subdirectory | Project Name | Tech Stack | Status | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **`FS-01`** | *Fullstack Project 1* | TBD | In Progress | - |
| **`FS-02`** | *Fullstack Project 2* | TBD | In Progress | - |
| **`FS-03`** | **EduFlow Live — Enterprise LMS** | React 18, Node.js, Express, MongoDB, WebRTC, FFmpeg HLS, BullMQ, Redis, PDFKit | **Production Ready** | [FS-03 README](./FS-03/README.md) |
| **`FS-04`** | **AgilePlatform — Multi-Tenant SaaS PM Platform** | React 18, Django 5.1, DRF, PostgreSQL, Celery, Redis, Stripe, Tailwind CSS | **Production Ready** | [FS-04 README](./FS-04/README.md) |

---

## 🌐 Multi-Project Deployment Guide (Zero Conflict)

Har project alag subdirectory me hone ki wajah se aap **har project ko bina kisi conflict ke independent deploy** kar sakte hain. Neeche platform-wise setup diya gaya hai:

### 1. Deploying on Vercel

Vercel allows you to deploy multiple projects from the same GitHub repository simply by setting the **Root Directory**:

#### Option A: Single-Domain Unified Deployment (Frontend + Serverless Backend)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New Project**.
2. Select repository `thomas2570/fullstack-internship-projects`.
3. In **Root Directory**, click **Edit** and select:
   ```
   FS-03
   ```
4. Build and Output Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`
5. Under **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random secret key
   - `NODE_ENV`: `production`
6. Click **Deploy**. Both the client and `/api` serverless backend will run smoothly on a single URL!

#### Option B: Separate Frontend Deployment on Vercel
1. In Vercel, set **Root Directory** to:
   ```
   FS-03/client
   ```
2. Set Environment Variable:
   - `VITE_API_BASE_URL`: URL of your deployed backend (e.g., `https://eduflow-api.onrender.com`)
3. Click **Deploy**.

---

### 2. Deploying FS-04 (Multi-Tenant SaaS PM Platform)

#### Frontend on Vercel:
1. In Vercel Dashboard $\rightarrow$ **Add New Project**.
2. Select repository: `thomas2570/fullstack-internship-projects`.
3. Set **Root Directory** to:
   ```
   FS-04/frontend
   ```
4. Framework: **Vite** (Build command: `npm run build`, Output directory: `dist`).
5. Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://agileplatform-backend.onrender.com`)
6. Click **Deploy**.

#### Backend on Render (Django + Celery + PostgreSQL + Redis):
- **Option A (1-Click Blueprint)**: In Render Dashboard, click **New +** $\rightarrow$ **Blueprint**, connect `thomas2570/fullstack-internship-projects`. Render will automatically create the PostgreSQL DB, Redis, Django Web Service, and Celery Worker using `FS-04/render.yaml`.
- **Option B (Manual Web Service)**:
  1. Root Directory: `FS-04/backend`
  2. Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed_jira_data`
  3. Start Command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
  4. Environment Variables: `DEBUG=False`, `ALLOWED_HOSTS=*`, `DATABASE_URL` (from Render PostgreSQL), `REDIS_URL` (from Render Redis).

---

### 3. Deploying FS-03 Backend on Render / Railway

For persistent Node.js servers, WebSockets (`Socket.IO`), and background workers:

1. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
2. Connect this repository: `thomas2570/fullstack-internship-projects`.
3. Configure the **Root Directory**:
   ```
   FS-03/server
   ```
4. Build & Start Commands:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Configure Environment Variables (refer to `FS-03/server/.env.example`).

---

## 🔒 Security & Clean Code Standards

To keep the repository clean, professional, and secure for evaluators:
1. **No Sensitive Data**: `.env` files containing live credentials, passwords, or tokens are **strictly gitignored**. Only `.env.example` templates are tracked.
2. **No Build Artifacts**: `node_modules`, `dist/`, and `build/` folders are never committed.
3. **No Junk / Temporary Uploads**: Test certificates (`*.pdf`) and large video dumps are excluded; folder structures are preserved with `.gitkeep`.
4. **Self-Contained Subdirectories**: Any future project added (e.g. `FS-01`, `FS-02`) should maintain its own independent `.env.example` and package definitions.

---

## ⚡ Quick Start: Running FS-03 Locally

```bash
# 1. Clone repository
git clone https://github.com/thomas2570/fullstack-internship-projects.git
cd fullstack-internship-projects/FS-03

# 2. Install dependencies (server + client)
npm run install:all

# 3. Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your MONGO_URI and JWT_SECRET

# 4. Seed database with genuine demo courses & admin account
npm run seed

# 5. Start both Backend & Frontend concurrently
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 👨‍💻 Author
- **Thomas Ramesh** ([@thomas2570](https://github.com/thomas2570))
