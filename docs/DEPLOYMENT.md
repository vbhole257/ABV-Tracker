# Free Deployment Guide - AbvFoods Tracker

This guide explains how to deploy the **Frontend (Vercel)**, **Backend API (Render.com)**, and **Database (Supabase)** completely for free.

---

## Architecture Overview

```text
[ VERCEL ]                     [ RENDER.COM ]               [ SUPABASE / NEON ]
React Vite Frontend PWA  --->  Fastify Node.js Backend API ---> Free PostgreSQL DB
(Free Tier)                    (Free Web Service)           (Free Tier)
```

> **Why not deploy backend to Vercel?**  
> Vercel functions are ephemeral (stateless). Fastify Node.js with persistent database queries works best when deployed to a free container host like **Render.com** or **Railway.app**, connected to a free PostgreSQL database on **Supabase.com** or **Neon.tech**.

---

## Step 1: Free Cloud Database (Supabase)

1. Go to [Supabase.com](https://supabase.com) and create a **Free Account**.
2. Click **New Project** and set your project password.
3. Once created, go to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ Copy the **Connection String (URI)**.
   Example URI:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres`

---

## Step 2: Deploy Backend to Render.com (Free Web Service)

1. Push your repository to **GitHub**.
2. Go to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma db push`
   - **Start Command:** `npm run start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Paste your Supabase connection string from Step 1)*
   - `PORT`: `5000`
6. Click **Create Web Service**. Render will give you a live HTTPS API URL:  
   `https://abvfoods-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Go to [Vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Import your GitHub repository.
3. Configure the deployment settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit $\rightarrow$ Select `frontend`
4. In `frontend/vercel.json`, replace `YOUR-BACKEND-API.onrender.com` with your actual Render API domain:
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
5. Click **Deploy**.

---

## Summary Checklist

| Component | Platform | Cost | Setup Time |
|---|---|---|---|
| **Frontend UI (React PWA)** | Vercel.com | **$0 / Free** | 2 mins |
| **Backend API (Node.js)** | Render.com / Railway | **$0 / Free** | 3 mins |
| **Database (PostgreSQL)** | Supabase.com / Neon | **$0 / Free** | 2 mins |
