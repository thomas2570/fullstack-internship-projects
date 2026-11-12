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
└── FS-03/                          # EduFlow Live LMS (Enterprise Learning Management System)
    ├── client/                     # React 18 + Vite + Tailwind CSS + Redux Toolkit
    ├── server/                     # Node.js + Express + MongoDB + Socket.IO + Redis
    ├── api/                        # Vercel Serverless Server entrypoint
    ├── docs/                       # Architecture, API docs, presentation & reflection
    ├── package.json                # Monorepo scripts (dev, build, seed, test)
    ├── vercel.json                 # Unified single-domain deployment config
    ├── README.md                   # Complete LMS documentation & setup
    ├── start.bat                   # 1-Click launcher (Windows CMD)
    └── start.ps1                   # 1-Click launcher (Windows PowerShell)
```

---

## 🌟 Projects Overview

| Subdirectory | Project Name | Tech Stack | Status | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **`FS-01`** | *Fullstack Project 1* | TBD | In Progress | - |
| **`FS-02`** | *Fullstack Project 2* | TBD | In Progress | - |
| **`FS-03`** | **EduFlow Live — Enterprise LMS** | React 18, Node.js, Express, MongoDB, WebRTC, FFmpeg HLS, BullMQ, Redis, PDFKit | **Production Ready** | [FS-03 README](./FS-03/README.md) |

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

### 2. Deploying Backend on Render / Railway

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
