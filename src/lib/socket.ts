import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

declare global {
  // eslint-disable-next-line no-var
  var _socketio: SocketIOServer | undefined;
}

/**
 * Initialise or return the existing Socket.io server.
 * Called once from the custom Next.js server (server.ts).
 */
export function getSocketServer(
  httpServer?: ReturnType<typeof createServer>,
): SocketIOServer {
  if (global._socketio) return global._socketio;

  const io = new SocketIOServer(httpServer as any, {
    cors: {
      origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', socket => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // ── Presence ──────────────────────────────────────────────────
    socket.on('user:online', (userId: string) => {
      socket.join(`user:${userId}`);
      socket.broadcast.emit('presence:online', { userId });
    });

    socket.on('user:offline', (userId: string) => {
      socket.leave(`user:${userId}`);
      socket.broadcast.emit('presence:offline', { userId });
    });

    // ── Friend events ─────────────────────────────────────────────
    socket.on('friend:request', ({ toUserId }: { toUserId: string }) => {
      io.to(`user:${toUserId}`).emit('friend:request_received', {
        fromSocketId: socket.id,
      });
    });

    socket.on('friend:accepted', ({ toUserId }: { toUserId: string }) => {
      io.to(`user:${toUserId}`).emit('friend:accepted');
    });

    // ── Chat (lobby/global) ───────────────────────────────────────
    socket.on(
      'chat:message',
      (msg: { userId: string; username: string; text: string }) => {
        io.emit('chat:message', {
          ...msg,
          timestamp: new Date().toISOString(),
        });
      },
    );

    // ── Pack open notification ─────────────────────────────────────
    socket.on(
      'pack:opened',
      (data: {
        userId: string;
        username: string;
        packName: string;
        uiiiiiCards: string[];
      }) => {
        if (data.uiiiiiCards.length > 0) {
          io.emit('pack:uiiiii_pull', data);
        }
      },
    );

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  global._socketio = io;
  return io;
}

export default getSocketServer;
