import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import os from 'os';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { connectDatabase, isDbConnected, getDbMode } from './server/db.ts';
import authRoutes, { setIoInstance } from './server/routes/auth.ts';
import chatRoutes, { setChatIoInstance } from './server/routes/chats.ts';
import { createTelegramProZip } from './server/services/zip.ts';

const PORT = Number(process.env.PORT || 3000);

function getAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once('error', (error) => {
      const err = error;
      if (err && err.code === 'EADDRINUSE') {
        resolve(getAvailablePort(startPort + 1));
        return;
      }
      reject(error);
    });

    tester.once('listening', () => {
      const { port } = tester.address();
      tester.close(() => resolve(port));
    });

    tester.listen(startPort, '127.0.0.1');
  });
}

function listenWithFallback(app, startPort) {
  return new Promise((resolve, reject) => {
    const tryListen = (port) => {
      const server = http.createServer(app);

      server.once('error', (error) => {
        const err = error;
        if (err && err.code === 'EADDRINUSE') {
          const nextPort = port + 1;
          console.warn(`[Server] Port ${port} is busy, retrying on ${nextPort}...`);
          tryListen(nextPort);
          return;
        }
        reject(error);
      });

      server.once('listening', () => {
        resolve({ server, port });
      });

      server.listen(port, '0.0.0.0');
    };

    tryListen(startPort);
  });
}

async function startServer() {
  const app = express();
  const { server, port: activePort } = await listenWithFallback(app, PORT);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT']
    },
    pingTimeout: 20000,
    pingInterval: 10000
  });

  setIoInstance(io);
  setChatIoInstance(io);

  await connectDatabase();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  let connectedClients = 0;
  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`[Socket.IO] Client connected: ${socket.id} (Total: ${connectedClients})`);

    socket.emit('connection:status', {
      connected: true,
      socketId: socket.id,
      timestamp: Date.now()
    });

    socket.on('user:online', (data) => {
      socket.broadcast.emit('user:online', data);
    });

    socket.on('user:offline', (data) => {
      socket.broadcast.emit('user:offline', data);
    });

    socket.on('typing', (data) => {
      socket.broadcast.emit('typing', data);
    });

    socket.on('disconnect', (reason) => {
      connectedClients = Math.max(0, connectedClients - 1);
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Telegram Pro' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', authRoutes);
  app.use('/api/chats', chatRoutes);

  app.get('/api/system/status', (req, res) => {
    res.json({
      status: 'operational',
      app: 'Telegram Pro',
      version: '1.0.0',
      database: {
        connected: isDbConnected(),
        mode: getDbMode()
      },
      realtime: {
        activeConnections: connectedClients,
        provider: 'Socket.IO'
      },
      uptime: process.uptime()
    });
  });

  app.get('/api/download-zip', async (req, res) => {
    try {
      const zipPath = path.join(os.tmpdir(), 'telegram-pro.zip');
      console.log('[API] Generating telegram-pro.zip archive...');
      await createTelegramProZip(zipPath);

      if (fs.existsSync(zipPath)) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="telegram-pro.zip"');
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);
      } else {
        res.status(500).json({ error: 'Archive creation failed.' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error serving zip:', error);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const hmrPort = await getAvailablePort(24678);
    process.env.VITE_HMR_PORT = String(hmrPort);

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: hmrPort,
          host: 'localhost'
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.log(`🚀 [Telegram Pro] Server active at http://localhost:${activePort}`);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
