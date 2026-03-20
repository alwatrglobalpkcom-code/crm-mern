# CRM - MERN Production Build

## Quick Start (after extracting ZIP)

```bash
# 1. Build client (if not already built)
cd client && npm install && npm run build

# 2. Install & start server
cd ../server && npm install
cp .env.example .env   # Edit .env with your values
node index.js
```

## Or use root scripts

```bash
npm run setup    # Installs client, builds, installs server
npm start        # Starts server
```

## Environment Variables (server/.env)

- NODE_ENV=production
- PORT=5002
- MONGODB_URI=mongodb+srv://...
- JWT_SECRET=min-32-characters
- SMTP_* (optional, for email)

## Deployment

- **Render/Railway:** Root directory = `server`, Start = `node index.js`
- **VPS:** Run `npm run setup` then `npm start`
