/**
 * MedFlow Pro — Real-time Socket.IO Microservice
 * Port: 4000
 *
 * Runs ALONGSIDE the FastAPI backend (port 8000). The frontend connects to
 * both: FastAPI for data (REST), this server for real-time features (WebSocket).
 *
 * Responsibilities:
 *  - Live notifications (patient registered, appointment updated, claim denied…)
 *  - Staff presence / "who's online right now"
 *  - Appointment check-in status broadcasts
 *  - Role-specific room isolation (admin, receptionist, doctor, coder, biller)
 */

const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.SOCKET_PORT || 4000;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

// ─── HTTP + Socket.IO setup ───────────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  // Simple health-check endpoint so the frontend can verify the server is up
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'medflow-socket', port: PORT }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// ─── In-memory state (ephemeral — resets on server restart) ──────────────────
/** Map<socketId, { userId, email, role, name }> */
const connectedUsers = new Map();

/** Map<userId, socketId> — one active socket per user */
const userSocketMap = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Build the "online staff" list that is safe to broadcast
 * (no sensitive data, just presence info)
 */
function getOnlineStaff() {
  return Array.from(connectedUsers.values()).map(({ userId, email, role, name }) => ({
    userId,
    email,
    role,
    name,
  }));
}

/** Broadcast the updated online list to everyone */
function broadcastOnlineStaff() {
  io.emit('staff:online', getOnlineStaff());
}

/** Emit a notification to every socket in a given role-room */
function notifyRole(role, event, payload) {
  io.to(`role:${role}`).emit(event, payload);
}

/** Emit a notification to all connected sockets */
function notifyAll(event, payload) {
  io.emit(event, payload);
}

/** Emit a notification to a specific user (by userId) */
function notifyUser(userId, event, payload) {
  const sid = userSocketMap.get(String(userId));
  if (sid) io.to(sid).emit(event, payload);
}

// ─── Connection handler ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── 1. Authenticate / register presence ──────────────────────────────────
  socket.on('user:join', ({ userId, email, role, name }) => {
    if (!userId || !role) {
      socket.emit('error', { message: 'user:join requires userId and role' });
      return;
    }

    const userData = { userId: String(userId), email, role, name };

    // If this user already had a socket open, disconnect it gracefully
    const prevSid = userSocketMap.get(String(userId));
    if (prevSid && prevSid !== socket.id) {
      const prevSocket = io.sockets.sockets.get(prevSid);
      if (prevSocket) {
        prevSocket.emit('session:replaced', { message: 'Logged in from another session.' });
        prevSocket.disconnect(true);
      }
      connectedUsers.delete(prevSid);
    }

    // Register new session
    connectedUsers.set(socket.id, userData);
    userSocketMap.set(String(userId), socket.id);

    // Join role-specific room + personal room
    socket.join(`role:${role}`);
    socket.join(`user:${userId}`);

    console.log(`[socket] user:join → ${name || email} (${role}) [sid: ${socket.id}]`);

    // Send the new user their current state
    socket.emit('init', {
      onlineStaff: getOnlineStaff(),
      message: `Welcome, ${name || email}!`,
    });

    // Announce to everyone
    broadcastOnlineStaff();
    notifyAll('notification', {
      id:        `join-${Date.now()}`,
      type:      'info',
      title:     'Staff Online',
      message:   `${name || email} (${role}) just signed in.`,
      timestamp: new Date().toISOString(),
      targetRoles: ['admin'],
    });
  });

  // ── 2. Patient events ─────────────────────────────────────────────────────

  /** Receptionist registered a new patient */
  socket.on('patient:registered', ({ patientName, registeredBy }) => {
    const user = connectedUsers.get(socket.id);
    const actor = user?.name || user?.email || registeredBy || 'Receptionist';

    const payload = {
      id:          `patient-reg-${Date.now()}`,
      type:        'success',
      title:       'New Patient Registered',
      message:     `${patientName} was registered by ${actor}.`,
      timestamp:   new Date().toISOString(),
      targetRoles: ['admin', 'receptionist'],
    };

    // Notify admins + receptionists
    notifyRole('admin', 'notification', payload);
    notifyRole('receptionist', 'notification', payload);

    // Broadcast updated patient count signal
    notifyAll('patients:updated', { action: 'created', patientName });
    console.log(`[socket] patient:registered → ${patientName}`);
  });

  /** Any role updated a patient record */
  socket.on('patient:updated', ({ patientId, patientName, updatedBy }) => {
    notifyAll('patients:updated', { action: 'updated', patientId, patientName });
    notifyRole('admin', 'notification', {
      id:        `patient-upd-${Date.now()}`,
      type:      'info',
      title:     'Patient Record Updated',
      message:   `${patientName}'s record was updated by ${updatedBy || 'staff'}.`,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('patient:deleted', ({ patientId, patientName, deletedBy }) => {
    notifyAll('patients:updated', { action: 'deleted', patientId, patientName });
    notifyRole('admin', 'notification', {
      id:        `patient-del-${Date.now()}`,
      type:      'warning',
      title:     'Patient Record Deleted',
      message:   `${patientName}'s record was deleted by ${deletedBy || 'receptionist'}.`,
      timestamp: new Date().toISOString(),
    });
  });

  // ── 3. Appointment / check-in events ─────────────────────────────────────

  socket.on('appointment:checkin', ({ patientName, doctorName, time }) => {
    const payload = {
      id:        `checkin-${Date.now()}`,
      type:      'success',
      title:     'Patient Checked In',
      message:   `${patientName} checked in for ${doctorName || 'their appointment'} at ${time || 'now'}.`,
      timestamp: new Date().toISOString(),
    };
    notifyRole('doctor', 'notification', payload);
    notifyRole('admin', 'notification', payload);
    notifyAll('appointment:updated', { patientName, status: 'Checked In' });
  });

  socket.on('appointment:updated', (data) => {
    notifyAll('appointment:updated', data);
  });

  // ── 4. Billing / claims events ────────────────────────────────────────────

  socket.on('claim:submitted', ({ claimId, patientName, amount, insurer }) => {
    const payload = {
      id:        `claim-sub-${Date.now()}`,
      type:      'info',
      title:     'Claim Submitted',
      message:   `Claim ${claimId} for ${patientName} ($${amount}) submitted to ${insurer}.`,
      timestamp: new Date().toISOString(),
    };
    notifyRole('admin', 'notification', payload);
    notifyRole('biller', 'notification', payload);
  });

  socket.on('claim:denied', ({ claimId, patientName, reason }) => {
    const payload = {
      id:        `claim-den-${Date.now()}`,
      type:      'error',
      title:     'Claim Denied',
      message:   `Claim ${claimId} for ${patientName} was denied. Reason: ${reason || 'See EOB'}.`,
      timestamp: new Date().toISOString(),
    };
    notifyRole('admin', 'notification', payload);
    notifyRole('biller', 'notification', payload);
  });

  // ── 5. Coding events ──────────────────────────────────────────────────────

  socket.on('coding:completed', ({ patientName, icd, cpt, codedBy }) => {
    const payload = {
      id:        `coding-${Date.now()}`,
      type:      'success',
      title:     'Coding Completed',
      message:   `${patientName} coded (${icd}/${cpt}) by ${codedBy || 'coder'}.`,
      timestamp: new Date().toISOString(),
    };
    notifyRole('admin', 'notification', payload);
    notifyRole('biller', 'notification', payload);
  });

  // ── 6. Generic direct message (staff → staff) ─────────────────────────────

  socket.on('message:send', ({ toUserId, from, message }) => {
    notifyUser(toUserId, 'message:received', {
      from,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // ── 7. Ping / heartbeat ───────────────────────────────────────────────────

  socket.on('ping', () => socket.emit('pong', { ts: Date.now() }));

  // ── 8. Disconnect ─────────────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`[socket] disconnected: ${user.name || user.email} (${user.role}) — ${reason}`);
      userSocketMap.delete(user.userId);
      connectedUsers.delete(socket.id);
      broadcastOnlineStaff();
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n✅ MedFlow Socket.IO server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\n`);
});

