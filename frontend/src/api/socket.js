/**
 * Singleton socket.io-client instance.
 * Lazily created and reused across the whole app.
 * Connect/disconnect is managed via SocketContext.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect:       false, // We connect manually after login
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports:        ['websocket', 'polling'],
    });
  }
  return socket;
}

/** Cleanly disconnect and destroy the singleton */
export function destroySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { SOCKET_URL };

