# 🚀 CRM Deploy - Test Link ke liye

## ✅ Best Platform: Render.com (FREE)

**Kyun:** Free, simple, MongoDB Atlas support, demo data seed, 1-click deploy

---

## 📋 Deploy Steps (5 min)

### 1. GitHub pe Push

```bash
cd "c:\Users\rohan\Desktop\2.Customer-Relationship-Management - Copy (2)"

git init
git add .
git commit -m "CRM ready"

# github.com/new → New repository "crm-mern" banao

git remote add origin https://github.com/YOUR_USERNAME/crm-mern.git
git branch -M main
git push -u origin main
```

### 2. Render.com

1. **https://render.com** → **Get Started** → **GitHub** se login
2. **New +** → **Web Service**
3. **Connect account** (GitHub authorize)
4. **crm-mern** repo select → **Connect**
5. **Settings** fill karo:

| Field | Value |
|-------|-------|
| Name | crm-crm |
| Region | Singapore (nearest) |
| Branch | main |
| Root Directory | *(blank)* |
| Runtime | Node |
| Build Command | `cd client && npm install && npm run build && cd ../server && node scripts/copyBuild.js && npm install && npm run seed:demo` |
| Start Command | `cd server && node index.js` |
| Instance Type | **Free** |

6. **Advanced** → **Add Environment Variable**:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| MONGODB_URI | mongodb+srv://crmuser:Admin%40123@cluster0.ei2mpro.mongodb.net/crm?retryWrites=true&w=majority |
| JWT_SECRET | crm-secret-key-change-in-production-xyz |

7. **Create Web Service** click karo

### 3. Wait 3-4 min

Build + Seed + Start hoga. Green "Live" dikhega.

### 4. Test Link

**URL:** `https://crm-crm.onrender.com` (ya jo name diya)

**Login:**
- admin@crm.com / admin123
- manager1@crm.com / demo123

---

## 🔄 Alternative: Railway.app

1. https://railway.app → GitHub login
2. New Project → Deploy from GitHub
3. crm-mern select
4. Root: *(blank)* | Build: same as above | Start: `cd server && node index.js`
5. Variables add karo
6. Deploy

---

## ⚠️ Note

- **Render Free:** Pehli request pe 30-60 sec lag (cold start)
- **MongoDB Atlas:** Pehle se connected hai
- **Demo Data:** Seed automatically chalega
