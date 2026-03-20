# GitHub pe Push - Steps

## 1. GitHub pe naya repo banao

1. https://github.com/new pe jao
2. Repository name: `crm-mern` (ya jo naam chaho)
3. **Private** ya **Public** select karo
4. **Create repository** pe click karo
5. **"…or push an existing repository from the command line"** wala section copy karo

---

## 2. Terminal mein yeh commands chalao

```bash
cd "c:\Users\rohan\Desktop\2.Customer-Relationship-Management - Copy (2)"

git remote add origin https://github.com/YOUR_USERNAME/crm-mern.git

git branch -M main

git push -u origin main
```

**Replace** `YOUR_USERNAME` apne GitHub username se.

---

## 3. Deploy (Render / Railway)

### Render.com
1. https://render.com → New → Web Service
2. GitHub repo connect karo
3. **Root Directory:** `server`
4. **Build Command:** `npm install`
5. **Start Command:** `node index.js`
6. Environment Variables add karo
7. Deploy

### Railway.app
1. https://railway.app → New Project → Deploy from GitHub
2. Repo select karo
3. **Root Directory:** `server`
4. Env vars add karo
5. Deploy

---

## Env Variables (deploy pe add karo)

```
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://...
JWT_SECRET=crm-secret-key-change-in-production-xyz
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
SMTP_FROM=CRM your-email
```
