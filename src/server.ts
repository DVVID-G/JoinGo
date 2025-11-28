import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { initFirebase } from './config/firebase';
import { config } from './config/env';
import { logger } from './utils/logger';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';

initFirebase();

const app = express();
app.use(cors());
app.use(express.json());

// Configure morgan to use our logger stream
app.use(
  morgan('dev', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

app.get('/', (_req, res) => {
  res.send('🚀 JoinGo Backend is active! Ready to connect.');
});

registerRoutes(app);
app.use(errorHandler);

// --- Crear servidor HTTP y Socket.IO ---
const httpServer = createServer(app);

const origins = (process.env.ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: origins.length ? origins : '*',
  },
});

// --- Tipos ---
type OnlineUser = { socketId: string; userId: string; roomId: string };
type ChatMessagePayload = { userId: string; message: string; roomId: string; timestamp?: string };

let onlineUsers: OnlineUser[] = [];

io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);

  // --- Usuario se une a una room ---
  socket.on('joinRoom', ({ userId, roomId }: { userId: string; roomId: string }) => {
    if (!userId || !roomId) return;

    // Guardar o actualizar usuario
    const existingIndex = onlineUsers.findIndex((u) => u.socketId === socket.id);
    if (existingIndex !== -1) {
      onlineUsers[existingIndex] = { socketId: socket.id, userId, roomId };
    } else {
      onlineUsers.push({ socketId: socket.id, userId, roomId });
    }

    socket.join(roomId); // unirse a la room

    // Emitir lista de usuarios solo a la room
    io.to(roomId).emit(
      'usersOnline',
      onlineUsers.filter((u) => u.roomId === roomId)
    );

    console.log(`User ${userId} joined room ${roomId}`);
  });

  // --- Mensajes dentro de la room ---
  socket.on('chat:message', (payload: ChatMessagePayload) => {
    const trimmed = payload?.message?.trim();
    if (!trimmed || !payload.roomId) return;

    const sender = onlineUsers.find((u) => u.socketId === socket.id);
    const outgoingMessage = {
      userId: payload.userId || sender?.userId || socket.id,
      message: trimmed,
      timestamp: payload.timestamp ?? new Date().toISOString(),
      roomId: payload.roomId,
    };

    // Emitir mensaje solo a la room del sender
    io.to(payload.roomId).emit('chat:message', outgoingMessage);
    console.log(`Message in room ${payload.roomId} from ${outgoingMessage.userId}: ${outgoingMessage.message}`);
  });

  // --- Desconexión ---
  socket.on('disconnect', () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id);
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);

    if (user?.roomId) {
      // Actualizar lista de usuarios solo para la room
      io.to(user.roomId).emit(
        'usersOnline',
        onlineUsers.filter((u) => u.roomId === user.roomId)
      );
    }

    console.log('User disconnected:', socket.id);
  });
});

// --- Levantar servidor ---
httpServer.listen(Number(config.port), () => {
  logger.info(`Server listening on port ${config.port}`);
});
