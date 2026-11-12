import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentLesson: null,
    isPlaying: false,
    quality: 'Auto',
    playbackRate: 1,
    volume: 1,
    currentTime: 0,
    duration: 0,
    isMuted: false,
    isFullscreen: false,
  },
  reducers: {
    setCurrentLesson: (state, action) => {
      state.currentLesson = action.payload;
      state.currentTime = 0;
      state.isPlaying = false;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setQuality: (state, action) => {
      state.quality = action.payload;
    },
    setPlaybackRate: (state, action) => {
      state.playbackRate = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setTime: (state, action) => {
      state.currentTime = action.payload.currentTime;
      if (action.payload.duration) {
        state.duration = action.payload.duration;
      }
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
  },
});

export const {
  setCurrentLesson,
  setIsPlaying,
  setQuality,
  setPlaybackRate,
  setVolume,
  setTime,
  toggleMute,
} = playerSlice.actions;

export default playerSlice.reducer;

