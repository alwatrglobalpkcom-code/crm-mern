# 🚀 CRM - FREE Deploy (Render.com)

**MongoDB Atlas + Demo Data + Live Link** - Sab kuch free

---

## Step 1: GitHub pe Push

```bash
cd "c:\Users\rohan\Desktop\2.Customer-Relationship-Management - Copy (2)"

git init
git add .
git commit -m "CRM ready for deploy"

# GitHub pe naya repo banao: github.com/new (name: crm-mern)

git remote add origin https://github.com/YOUR_USERNAME/crm-mern.git
git branch -M main
git push -u origin main
```

---

## Step 2: Render.com pe Deploy

1. **https://render.com** → Sign up (GitHub se free)
2. **New +** → **Web Service**
3. **Connect GitHub** → `crm-mern` repo select karo
4. **Settings:**

| Field | Value |
|-------|-------|
| **Name** | crm-crm |
| **Root Directory** | *(khali - project root)* |
| **Runtime** | Node |
| **Build Command** | `cd client && npm install && npm run build && cd ../server && node scripts/copyBuild.js && npm install && npm run seed:demo` |
| **Start Command** | `cd server && node index.js` |
| **Instance Type** | Free |

5. **Environment Variables** (Add) - **ZAROORI:**

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| MONGODB_URI | mongodb+srv://crmuser:Admin%40123@cluster0.ei2mpro.mongodb.net/crm?retryWrites=true&w=majority |
| JWT_SECRET | crm-secret-key-change-in-production-xyz |
| PORT | 5002 |

6. **Create Web Service** pe click

---

## Step 3: Wait (2-3 min)

Render build karega, seed chalega, server start hoga.

**Live Link:** `https://crm-crm.onrender.com` (ya jo name diya)

---

## Step 4: Login (Demo Data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crm.com | admin123 |
| Manager | manager1@crm.com | demo123 |
| Agent | agent1@crm.com | demo123 |

---

## ⚠️ Render Free Tier

- Cold start: pehli request pe 30-60 sec lag sakta hai
- 750 hours/month free
- Auto sleep after 15 min inactivity

---

## Alternative: Railway.app (bhi free)

1. https://railway.app → GitHub connect
2. New Project → Deploy from GitHub
3. Root: `server`
4. Env vars add karo
5. Deploy
