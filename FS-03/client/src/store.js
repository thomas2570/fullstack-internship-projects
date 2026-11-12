import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import courseReducer from './features/courseSlice';
import playerReducer from './features/playerSlice';
import liveRoomReducer from './features/liveRoomSlice';
import instructorReducer from './features/instructorSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    player: playerReducer,
    liveRoom: liveRoomReducer,
    instructor: instructorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

