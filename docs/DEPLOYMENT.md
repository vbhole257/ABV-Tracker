# 🚀 Comprehensive Step-by-Step Deployment Guide for AbvFoods Tracker

This guide provides an exact, step-by-step walkthrough to get your **AbvFoods Tracker** live on the web for free.

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────┐     ┌────────────────────────────────┐     ┌────────────────────────────────┐
│      VERCEL (Frontend)         │     │     RENDER.COM (Backend API)   │     │    SUPABASE (PostgreSQL DB)    │
│  React 18 + Vite SPA App       │ ──> │   Fastify Node.js Web Service  │ ──> │   Free Cloud PostgreSQL DB     │
│  URL: https://yourapp.vercel.app│     │   URL: https://api.onrender.com│     │   Port: 5432 / SSL Enabled     │
└────────────────────────────────┘     └────────────────────────────────┘     └────────────────────────────────┘
```

---

## 📌 Phase 1: Push Code to GitHub

If you haven't pushed your code to GitHub yet, run these commands in your project root terminal:

```bash
git init
git add .
git commit -m "feat: complete abvfoods tracker backend & frontend"
git branch -M main
```

Create a new repository on [GitHub](https://github.com/new) named `AbvFoods-Tracker` and run:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/AbvFoods-Tracker.git
git push -u origin main
```

---

## 📌 Phase 2: Create Free PostgreSQL Database on Supabase

1. Go to **[Supabase.com](https://supabase.com)** and log in / create a free account.
2. Click **New Project** and select your organization.
3. Fill in the details:
   - **Name:** `AbvFoods-DB`
   - **Database Password:** *(Create a strong password and SAVE IT)*
   - **Region:** Select `South Asia (Mumbai)` or nearest to you.
   - **Pricing Plan:** Free Tier ($0/mo).
4. Click **Create new project** (takes ~1-2 minutes to initialize).
5. Once project is ready:
   - Click **Project Settings** (Gear icon on bottom left sidebar).
   - Click **Database**.
   - Scroll down to **Connection String** $\rightarrow$ Click **URI**.
   - Copy the URI string. It looks like:
     `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxx.supabase.co:5432/postgres`
   - **IMPORTANT:** Replace `[YOUR-PASSWORD]` with the actual password you set in step 3!

---

## 📌 Phase 3: Initialize Database Schema & Fixed Products

You can apply the schema and seed initial data straight from your local terminal to your new Supabase database!

1. Open `backend/.env` on your computer.
2. Update `DATABASE_URL` with your Supabase URI from Phase 2:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxx.supabase.co:5432/postgres"
   PORT=5000
   JWT_SECRET="abvfoods-secret-key-2026"
   ```
3. Open terminal in `backend` folder:
   ```bash
   cd backend
   npx prisma db push
   npx tsx prisma/clean.ts
   ```
4. ✅ Your Supabase database is now fully populated with clean zero tables and the 2 fixed products (*Jeeru Masala 160ml* & *Orange Soda 160ml*)!

---

## 📌 Phase 4: Deploy Backend API to Render.com (Free)

1. Go to **[Render.com](https://render.com)** and log in / sign up with GitHub.
2. Click the blue **New +** button at top right $\rightarrow$ Select **Web Service**.
3. Select **Build and deploy from a Git repository** $\rightarrow$ Connect your GitHub repo (`AbvFoods-Tracker`).
4. Configure the Web Service settings EXACTLY as follows:

   | Setting Field | What to Enter |
   |---|---|
   | **Name** | `abvfoods-backend` |
   | **Region** | Singapore / Nearest |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run start` |
   | **Instance Type** | **Free** ($0/month) |

5. Scroll down to **Environment Variables** $\rightarrow$ Click **Add Environment Variable**:
   - `DATABASE_URL`: *(Paste your Supabase URI from Phase 2)*
   - `PORT`: `5000`
   - `JWT_SECRET`: `abvfoods-secret-key-2026`

6. Click **Create Web Service**.
7. Wait 2-3 minutes while Render installs dependencies and compiles TypeScript.
8. Once finished, Render will show **Live** with a URL at the top, e.g.:
   `https://abvfoods-backend.onrender.com`

9. Test it! Open `https://abvfoods-backend.onrender.com/api/v1/health` in your browser.
   You should see:
   `{"status":"OK","system":"AbvFoods Tracker API v1.1.0"}`

---

## 📌 Phase 5: Connect & Deploy Frontend to Vercel

1. Open `frontend/vercel.json` in your code editor.
2. Update the `destination` URL with your actual Render API URL from Phase 4:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/v1/:path*",
         "destination": "https://abvfoods-backend.onrender.com/api/v1/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Commit & push the updated `frontend/vercel.json` to GitHub:
   ```bash
   git add frontend/vercel.json
   git commit -m "fix: update vercel backend api route"
   git push origin main
   ```

4. Go to **[Vercel.com](https://vercel.com)** and log in with GitHub.
5. Click **Add New...** $\rightarrow$ **Project**.
6. Select your `AbvFoods-Tracker` repository $\rightarrow$ Click **Import**.
7. In the configuration section:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** $\rightarrow$ Select `frontend`
8. Click **Deploy**.
9. In ~30 seconds, Vercel will give you your live application link (e.g., `https://abvfoods-tracker.vercel.app`)!

---

## 🔍 Verification & Testing

1. Open your Vercel web URL in your browser or phone.
2. Log in with default credentials:
   - **Email:** `owner@abvfoods.com`
   - **Password:** `admin123`
3. Try recording a batch, adding a wholesaler, or viewing unit economics! Everything will sync live with your cloud Supabase database via your Render backend.

---

## ⚡ Troubleshooting Quick Reference

- **Render spinning/sleeping?** Render free tier sleeps after 15 minutes of inactivity. The first request takes 30 seconds to spin up.
- **Vercel API 404/502?** Double check that `frontend/vercel.json` destination points to `https://<your-render-name>.onrender.com/api/v1/:path*` (ensure `https://` and `/api/v1/:path*` are included).
- **Prisma Connection Error on Render?** Ensure your Supabase password in `DATABASE_URL` does not contain unescaped special characters like `@` or `#`. (Use URL encoding if needed, e.g. `@` $\rightarrow$ `%40`).
