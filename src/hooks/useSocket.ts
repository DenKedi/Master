'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('user:online', userId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.emit('user:offline', userId);
      socket.disconnect();
    };
  }, [userId]);

  return { socket: socketRef.current, connected };
}
