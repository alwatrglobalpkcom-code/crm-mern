require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { CORS_ORIGIN, NODE_ENV, PORT } = require('./config/env');
const { setupChatSocket } = require('./socket/chatSocket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const taskRoutes = require('./routes/taskRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatRoutes = require('./routes/chatRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

connectDB();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
const corsOptions = CORS_ORIGIN
  ? { origin: CORS_ORIGIN.split(',').map(o => o.trim()), credentials: true }
  : { origin: true };
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 500,
  message: { message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 10 : 100,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);

app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity-logs', activityLogRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Production: serve React build (client/build or server/public)
if (NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/build');
  const serverPublic = path.join(__dirname, 'public');
  const publicPath = fs.existsSync(path.join(clientBuild, 'index.html')) ? clientBuild : serverPublic;
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const { startReminderJob } = require('./jobs/reminderJob');
startReminderJob();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN ? CORS_ORIGIN.split(',').map(o => o.trim()) : true }
});
const chatSocket = setupChatSocket(io);
app.set('io', io);
app.set('chatSocket', chatSocket);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('Close the other process or run: taskkill /F /IM node.exe');
    process.exit(1);
  }
  throw err;
});
