# 🎓 Smartmove Education Group — Deployment Guide
## Getting Your Team Portal Live in Under 1 Hour

---

## What You're Deploying

A live web app where:
- **Your team members** log in with their company email and submit daily reports
- **You (manager)** see the full KPI dashboard in real time
- **All data** is stored in a secure cloud database (Supabase)
- **URL** will be something like: `smartmove-portal.vercel.app` (or your own domain)

---

## Overview — 4 Steps

| Step | What You Do | Time |
|------|------------|------|
| 1 | Set up the database (Supabase) | 10 min |
| 2 | Upload the code (GitHub) | 10 min |
| 3 | Deploy the website (Vercel) | 5 min |
| 4 | Add your team | 5 min |

**Total: ~30 minutes. No coding knowledge needed.**

---

## STEP 1 — Set Up the Database (Supabase)

Supabase is your free cloud database. It stores all reports, user accounts, and handles logins.

### 1.1 Create a Supabase Account
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with your Google or GitHub account (free)

### 1.2 Create a New Project
1. Click **"New Project"**
2. Fill in:
   - **Name:** `smartmove-portal`
   - **Database Password:** Choose a strong password and **save it somewhere safe**
   - **Region:** Choose `Europe West` (closest to UK)
3. Click **"Create new project"**
4. Wait about 2 minutes for it to set up

### 1.3 Run the Database Schema
This creates all the tables your app needs.

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase_schema.sql` (included in your project files)
4. **Copy the entire contents** and paste it into the SQL editor
5. Click **"Run"** (green button)
6. You should see: `Success. No rows returned`

### 1.4 Get Your API Credentials
1. In the left sidebar, click **"Project Settings"** (gear icon)
2. Click **"API"**
3. You'll see two values — copy and save both:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## STEP 2 — Upload the Code (GitHub)

GitHub stores your code so Vercel can deploy it.

### 2.1 Create a GitHub Account
1. Go to **https://github.com**
2. Sign up for a free account if you don't have one

### 2.2 Create a New Repository
1. Click the **"+"** icon (top right) → **"New repository"**
2. Name it: `smartmove-portal`
3. Set it to **Private**
4. Click **"Create repository"**

### 2.3 Upload the Project Files
You have two options:

**Option A — Upload via browser (easiest):**
1. On your new repository page, click **"uploading an existing file"**
2. Drag and drop ALL the project files:
   - `package.json`
   - `vite.config.js`
   - `index.html`
   - `.gitignore`
   - `.env.example`
   - The entire `src/` folder (containing `App.jsx` and `main.jsx`)
3. Click **"Commit changes"**

**Option B — Use Git (if you're comfortable with terminal):**
```bash
cd smartmove-portal
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/smartmove-portal.git
git push -u origin main
```

---

## STEP 3 — Deploy the Website (Vercel)

Vercel hosts your app and gives it a live URL.

### 3.1 Create a Vercel Account
1. Go to **https://vercel.com**
2. Click **"Sign Up"** → sign in with your GitHub account

### 3.2 Import Your Project
1. Click **"Add New Project"**
2. Find `smartmove-portal` in the list → click **"Import"**
3. Leave all settings as default
4. **BEFORE clicking Deploy**, scroll down to **"Environment Variables"**

### 3.3 Add Your Supabase Credentials
Add these two variables (use the values you saved in Step 1.4):

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) |

Click **"Add"** after each one.

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait ~2 minutes
3. You'll get a live URL like: `https://smartmove-portal.vercel.app`

✅ **Your app is now live!**

---

## STEP 4 — Add Your Team

### 4.1 Make Yourself a Manager
When you first sign up through the app, you'll be created as a regular agent. To make yourself a manager:

1. In Supabase, go to **"Table Editor"** → **"profiles"**
2. Find your row (your email)
3. Click the `role` cell → change `agent` to `manager`
4. Press Enter to save

As a manager you'll see the full KPI Dashboard and All Reports tabs.

### 4.2 Invite Your Team Members
**Option A — They sign up themselves:**
- Share the Vercel URL with your team
- They click "Don't have an account? Sign up"
- They enter their full name + company email + password
- They can start submitting reports immediately

**Option B — You create accounts for them:**
1. In Supabase, go to **"Authentication"** → **"Users"**
2. Click **"Invite user"**
3. Enter their company email
4. They'll receive an email to set their password
5. Their name defaults to their email prefix — update it in the `profiles` table

### 4.3 Add a Custom Domain (Optional)
To use `portal.smartmoveedu.com` instead of the Vercel URL:
1. In Vercel → Your Project → **"Settings"** → **"Domains"**
2. Add your domain
3. Follow the DNS instructions (update your domain registrar)

---

## How Roles Work

| Role | What They See |
|------|--------------|
| **Manager** | KPI Dashboard + All Reports + Submit Form + My Reports |
| **Team Member (Agent)** | Submit Form + My Reports only |

To promote someone to manager: edit their `role` in Supabase → `profiles` table.

---

## Real-Time Updates

Once deployed, the KPI Dashboard updates **automatically** the moment a team member submits a report — no refresh needed. This is powered by Supabase Realtime.

---

## Costs

| Service | Free Tier Includes | When You'd Pay |
|---------|-------------------|----------------|
| Supabase | 500MB database, 50,000 monthly active users | Never for a small team |
| Vercel | Unlimited deployments, custom domain | Never for this use case |
| GitHub | Unlimited private repos | Never |

**Total running cost: £0/month** for your team size.

---

## Troubleshooting

**"Invalid API key" error on login:**
→ Check your `VITE_SUPABASE_ANON_KEY` in Vercel environment variables

**Team member can't log in after signing up:**
→ They need to confirm their email first. Check Supabase → Authentication → Users to see if they're confirmed. You can also disable email confirmation in Supabase → Authentication → Settings → "Confirm email" toggle.

**Dashboard shows no data:**
→ Make sure your `role` is set to `manager` in the profiles table

**App not updating after code changes:**
→ Push to GitHub — Vercel redeploys automatically within 60 seconds

---

## Need Help?

If you get stuck at any step, share the error message and I can help you fix it.

The files you need are:
- `src/App.jsx` — the full application
- `src/main.jsx` — entry point
- `index.html` — HTML shell
- `package.json` — dependencies
- `vite.config.js` — build config
- `supabase_schema.sql` — database setup
- `.env.example` — credentials template (rename to `.env.local` locally)
