# Hostinger Deployment Guide

## 1. Upload File
- Upload `crm-server-production.zip` to Hostinger

## 2. Build Configuration (IMPORTANT)

| Setting | Value |
|---------|-------|
| **Framework preset** | Express |
| **Root directory** | *(leave EMPTY or type `./`)* |
| **Entry file** | `index.js` OR `server.js` |
| **Package manager** | npm |

## 3. Environment Variables (REQUIRED)

| Key | Value |
|-----|-------|
| NODE_ENV | **production** |
| PORT | 5002 |
| MONGODB_URI | mongodb+srv://... |
| JWT_SECRET | **32+ characters** (e.g. `crm-secret-key-change-in-production-xyz`) |
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 587 |
| SMTP_USER | your-email@gmail.com |
| SMTP_PASS | your-app-password |
| SMTP_FROM | CRM \<your-email@gmail.com> |

**Critical:** 
- NODE_ENV must be `production` (not development)
- JWT_SECRET must be at least 32 characters

## 4. Save and Redeploy
