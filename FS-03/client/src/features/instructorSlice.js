import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchInstructorStats = createAsyncThunk(
  'instructor/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/instructor/dashboard-stats');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch instructor stats');
    }
  }
);

export const fetchInstructorCourses = createAsyncThunk(
  'instructor/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/instructor/courses');
      return response.data.courses;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch instructor courses');
    }
  }
);

export const submitPayoutRequest = createAsyncThunk(
  'instructor/submitPayout',
  async ({ amount, payoutMethod, accountDetails }, { rejectWithValue }) => {
    try {
      const response = await api.post('/instructor/payout-request', {
        amount,
        payoutMethod,
        accountDetails,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Payout request failed');
    }
  }
);

const instructorSlice = createSlice({
  name: 'instructor',
  initialState: {
    stats: {
      totalRevenue: 0,
      netEarnings: 0,
      pendingBalance: 0,
      withdrawnAmount: 0,
      totalStudents: 0,
      totalCourses: 0,
    },
    coursePerformance: [],
    recentTransactions: [],
    monthlyChartData: [],
    myCourses: [],
    payoutHistory: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructorStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInstructorStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.coursePerformance = action.payload.coursePerformance || [];
        state.recentTransactions = action.payload.recentTransactions || [];
        state.monthlyChartData = action.payload.monthlyChartData || [];
      })
      .addCase(fetchInstructorStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInstructorCourses.fulfilled, (state, action) => {
        state.myCourses = action.payload;
      })
      .addCase(submitPayoutRequest.fulfilled, (state, action) => {
        state.stats.pendingBalance = action.payload.remainingBalance;
      });
  },
});

export default instructorSlice.reducer;

