# Railway "Application failed to respond" – Fix Guide

## Step 1: Railway Variables (ZAROORI)

Railway Dashboard → **crm-mern** → **Variables** tab

Yeh 4 variables **add karo** (agar nahi hain):

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `MONGODB_URI` | Apna MongoDB Atlas connection string |
| `JWT_SECRET` | Kam se kam 32 characters (e.g. `crm-secret-key-change-in-production-xyz-123`) |

**MONGODB_URI format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/crm?retryWrites=true&w=majority
```
- USERNAME = MongoDB Atlas username
- PASSWORD = URL-encode karo agar special chars hain (@ → %40)

---

## Step 2: Networking – Port 8080

Railway → **Settings** → **Networking** → **Public Networking**

- **Target port:** `8080` (confirm karo)

---

## Step 3: Local Commands – Code Push

**Jahan run karna hai:** Terminal (PowerShell) – project folder mein

```powershell
cd "c:\Users\rohan\Desktop\2.Customer-Relationship-Management - Copy (2)"

git add .
git commit -m "Fix Railway deploy"
git push origin main
```

---

## Step 4: Deploy Logs Check

Push ke baad Railway auto-deploy karega. 2–3 min wait karo.

**Deploy Logs dekhne ke liye:**
- Railway → **crm-mern** → **Deployments** → latest deployment → **View Logs**

Agar crash ho raha hai, logs mein error dikhega (e.g. MongoDB connection, JWT_SECRET missing).

---

## Step 5: Admin User (Seed)

Agar login page aa raha hai lekin login nahi ho raha:

1. Railway Variables mein add karo: `SEED_SECRET` = `abc123`
2. Redeploy karo (ya push trigger karo)
3. Browser mein open karo:
   ```
   https://crm-mern-production.up.railway.app/api/auth/seed-admin?key=abc123
   ```
4. Login: `admin@crm.com` / `admin123`

---

## Common Errors

| Error | Fix |
|-------|-----|
| MongoDB connection error | MONGODB_URI sahi hai? Atlas mein IP whitelist (0.0.0.0/0) add karo |
| JWT_SECRET is required | JWT_SECRET add karo, 32+ chars |
| Port already in use | PORT=8080 set karo Variables mein |
| Build failed | Deploy logs check karo – client build error? |

---

## Quick Checklist

- [ ] NODE_ENV=production
- [ ] PORT=8080
- [ ] MONGODB_URI (MongoDB Atlas)
- [ ] JWT_SECRET (32+ chars)
- [ ] Target port 8080 (Networking)
- [ ] Code pushed to GitHub
- [ ] Deploy logs check kiye
