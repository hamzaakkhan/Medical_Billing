/**
 * Singleton socket.io-client instance.
 * Lazily created and reused across the whole app.
 * Connect/disconnect is managed via SocketContext.
 */
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `http://${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
};

const SOCKET_URL = getSocketUrl();

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

