import { createSlice } from '@reduxjs/toolkit';

const liveRoomSlice = createSlice({
  name: 'liveRoom',
  initialState: {
    activeRoomId: null,
    sessionDetails: null,
    participants: [],
    messages: [],
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    hasRaisedHand: false,
    peers: {},
  },
  reducers: {
    setSessionDetails: (state, action) => {
      state.sessionDetails = action.payload;
      state.activeRoomId = action.payload.roomId;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    addParticipant: (state, action) => {
      const exists = state.participants.some(p => p.socketId === action.payload.socketId);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(p => p.socketId !== action.payload);
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleVideo: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    toggleHand: (state) => {
      state.hasRaisedHand = !state.hasRaisedHand;
    },
    updateParticipantStatus: (state, action) => {
      const { socketId, raised } = action.payload;
      const participant = state.participants.find(p => p.socketId === socketId);
      if (participant) {
        participant.raisedHand = raised;
      }
    },
    leaveRoom: (state) => {
      state.activeRoomId = null;
      state.sessionDetails = null;
      state.participants = [];
      state.messages = [];
      state.isMuted = false;
      state.isVideoOff = false;
      state.isScreenSharing = false;
      state.hasRaisedHand = false;
    }
  },
});

export const {
  setSessionDetails,
  setParticipants,
  addParticipant,
  removeParticipant,
  addMessage,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  toggleHand,
  updateParticipantStatus,
  leaveRoom,
} = liveRoomSlice.actions;

export default liveRoomSlice.reducer;

