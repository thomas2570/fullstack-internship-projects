import { LiveSession } from '../models/LiveSession.js';

export const setupSocketServer = (io) => {
  // Map of roomId -> Map of socketId -> { userId, userName, role }
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join Live Classroom
    socket.on('join-room', async ({ roomId, user }) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      const roomParticipants = rooms.get(roomId);
      const participantData = {
        socketId: socket.id,
        userId: user?._id || user?.id,
        name: user?.name || 'Guest Student',
        role: user?.role || 'student',
        raisedHand: false,
        isMuted: false,
        isVideoOff: false,
      };
      roomParticipants.set(socket.id, participantData);

      // Notify other peers in room that a new user joined
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user: participantData,
      });

      // Send the current participant list to the newly joined peer
      const currentParticipants = Array.from(roomParticipants.values());
      socket.emit('room-state', {
        participants: currentParticipants,
      });

      // Also update DB active participants if valid roomId
      try {
        await LiveSession.findOneAndUpdate(
          { roomId, status: { $in: ['scheduled', 'live'] } },
          {
            status: 'live',
            startedAt: new Date(),
            $addToSet: {
              activeParticipants: {
                user: participantData.userId,
                socketId: socket.id,
                name: participantData.name,
                role: participantData.role,
              }
            }
          }
        );
      } catch (err) {
        console.warn('DB live participant update failed:', err.message);
      }
    });

    // WebRTC Signaling: Relay Offer
    socket.on('offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('offer', {
        callerSocketId: socket.id,
        offer,
      });
    });

    // WebRTC Signaling: Relay Answer
    socket.on('answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('answer', {
        responderSocketId: socket.id,
        answer,
      });
    });

    // WebRTC Signaling: Relay ICE Candidate
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    });

    // In-room Chat Messaging
    socket.on('send-message', ({ roomId, message, user }) => {
      const payload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: user?.name || 'Anonymous',
        role: user?.role || 'student',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      io.to(roomId).emit('new-message', payload);
    });

    // Raise / Lower Hand
    socket.on('toggle-hand', ({ roomId, raised }) => {
      const room = rooms.get(roomId);
      if (room && room.has(socket.id)) {
        const participant = room.get(socket.id);
        participant.raisedHand = raised;
        io.to(roomId).emit('hand-status-changed', {
          socketId: socket.id,
          name: participant.name,
          raised,
        });
      }
    });

    // Screen Share Toggle notification
    socket.on('screen-share-status', ({ roomId, isSharing }) => {
      socket.to(roomId).emit('user-screen-share', {
        socketId: socket.id,
        isSharing,
      });
    });

    // Disconnect Handler
    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId);
          const leavingUser = room.get(socket.id);
          room.delete(socket.id);

          socket.to(roomId).emit('user-left', {
            socketId: socket.id,
            user: leavingUser,
          });

          if (room.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

