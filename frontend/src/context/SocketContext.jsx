import React, {
  createContext, useContext, useEffect, useRef,
  useState, useCallback,
} from 'react';
import { getSocket, destroySocket } from '../api/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();

  // Connection state
  const [connected, setConnected]       = useState(false);
  const [socketError, setSocketError]   = useState(null);

  // Online staff list pushed from server
  const [onlineStaff, setOnlineStaff]   = useState([]);

  // Notification queue — newest first
  const [notifications, setNotifications] = useState([]);

  // In-app messages
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);

  // ── Add a notification helper (dedup by id) ─────────────────────────────
  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 50); // Keep last 50
    });
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  // ── Unread count ────────────────────────────────────────────────────────
  const unreadCount = notifications.length;

  // ── Connect/disconnect on auth change ───────────────────────────────────
  useEffect(() => {
    if (!token || !user) {
      // Not logged in — make sure we are disconnected
      destroySocket();
      setConnected(false);
      setOnlineStaff([]);
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // ── Wire up listeners ─────────────────────────────────────────────────

    const onConnect = () => {
      setConnected(true);
      setSocketError(null);
      // Register this user's presence with the server
      socket.emit('user:join', {
        userId: user.id,
        email:  user.email,
        role:   user.role,
        name:   user.first_name
          ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
          : user.email,
      });
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      if (reason !== 'io client disconnect') {
        // Not a deliberate logout — flag it
        setSocketError('Real-time connection lost. Reconnecting…');
      }
    };

    const onConnectError = (err) => {
      setConnected(false);
      setSocketError(`Real-time server unavailable (${err.message})`);
    };

    const onInit = ({ onlineStaff: staff }) => {
      setOnlineStaff(staff || []);
    };

    const onStaffOnline = (staff) => setOnlineStaff(staff || []);

    const onNotification = (notif) => {
      // Server may target specific roles; respect that filter on the client
      if (notif.targetRoles && !notif.targetRoles.includes(user.role)) return;
      addNotification(notif);
    };

    const onMessageReceived = (msg) => {
      setMessages(prev => [...prev, { ...msg, id: `msg-${Date.now()}`, read: false }]);
      addNotification({
        id:        `msg-notif-${Date.now()}`,
        type:      'message',
        title:     `Message from ${msg.from}`,
        message:   msg.message,
        timestamp: msg.timestamp,
      });
    };

    const onSessionReplaced = () => {
      setSocketError('Your session was replaced by a login from another browser.');
      destroySocket();
      setConnected(false);
    };

    const onPatientsUpdated = (data) => {
      // Notify components listening or emit custom event
      window.dispatchEvent(new CustomEvent('medflow:patients-updated', { detail: data }));
    };

    socket.on('connect',           onConnect);
    socket.on('disconnect',        onDisconnect);
    socket.on('connect_error',     onConnectError);
    socket.on('init',              onInit);
    socket.on('staff:online',      onStaffOnline);
    socket.on('notification',      onNotification);
    socket.on('message:received',  onMessageReceived);
    socket.on('session:replaced',  onSessionReplaced);
    socket.on('patients:updated',  onPatientsUpdated);

    // Connect now
    if (!socket.connected) socket.connect();

    return () => {
      // Cleanup listeners only — don't destroy the socket on every re-render
      socket.off('connect',          onConnect);
      socket.off('disconnect',       onDisconnect);
      socket.off('connect_error',    onConnectError);
      socket.off('init',             onInit);
      socket.off('staff:online',     onStaffOnline);
      socket.off('notification',     onNotification);
      socket.off('message:received', onMessageReceived);
      socket.off('session:replaced', onSessionReplaced);
      socket.off('patients:updated', onPatientsUpdated);
    };
  }, [token, user?.id, user?.role]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Emit helpers ─────────────────────────────────────────────────────────

  const emit = useCallback((event, data) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`[socket] tried to emit "${event}" but socket is not connected`);
    }
  }, []);

  /** Emit a patient:registered event so all relevant roles get notified */
  const emitPatientRegistered = useCallback((patientName) => {
    emit('patient:registered', {
      patientName,
      registeredBy: user?.email,
    });
  }, [emit, user]);

  const emitPatientUpdated = useCallback((patientId, patientName) => {
    emit('patient:updated', { patientId, patientName, updatedBy: user?.email });
  }, [emit, user]);

  const emitPatientDeleted = useCallback((patientId, patientName) => {
    emit('patient:deleted', { patientId, patientName, deletedBy: user?.email });
  }, [emit, user]);

  const emitAppointmentCheckin = useCallback((patientName, doctorName, time) => {
    emit('appointment:checkin', { patientName, doctorName, time });
  }, [emit]);

  const emitClaimSubmitted = useCallback((claimId, patientName, amount, insurer) => {
    emit('claim:submitted', { claimId, patientName, amount, insurer });
  }, [emit]);

  const emitClaimDenied = useCallback((claimId, patientName, reason) => {
    emit('claim:denied', { claimId, patientName, reason });
  }, [emit]);

  const emitCodingCompleted = useCallback((patientName, icd, cpt) => {
    emit('coding:completed', { patientName, icd, cpt, codedBy: user?.email });
  }, [emit, user]);

  const sendMessage = useCallback((toUserId, message) => {
    emit('message:send', {
      toUserId,
      from: user?.first_name
        ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
        : user?.email,
      message,
    });
  }, [emit, user]);

  // ─────────────────────────────────────────────────────────────────────────
  const value = {
    connected,
    socketError,
    onlineStaff,
    notifications,
    unreadCount,
    messages,
    // Notification control
    addNotification,
    dismissNotification,
    clearNotifications,
    // Emitters
    emit,
    emitPatientRegistered,
    emitPatientUpdated,
    emitPatientDeleted,
    emitAppointmentCheckin,
    emitClaimSubmitted,
    emitClaimDenied,
    emitCodingCompleted,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

