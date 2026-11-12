import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.level && filters.level !== 'All Levels') params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);

      const response = await api.get(`/courses?${params.toString()}`);
      return response.data.courses;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'courses/fetchDetails',
  async (identifier, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${identifier}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch course details');
    }
  }
);

export const fetchMyEnrollments = createAsyncThunk(
  'courses/fetchMyEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/enrollments/my');
      return response.data.enrollments;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch enrollments');
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    items: [],
    activeCourse: null,
    activeLessons: [],
    isEnrolled: false,
    activeEnrollment: null,
    myEnrollments: [],
    loading: false,
    error: null,
    filters: {
      category: 'All',
      level: 'All Levels',
      search: '',
      sort: 'popular',
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        category: 'All',
        level: 'All Levels',
        search: '',
        sort: 'popular',
      };
    },
    updateEnrollmentProgress: (state, action) => {
      if (state.activeEnrollment) {
        state.activeEnrollment = { ...state.activeEnrollment, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Course Details
      .addCase(fetchCourseDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.activeCourse = action.payload.course;
        state.activeLessons = action.payload.lessons;
        state.isEnrolled = action.payload.isEnrolled;
        state.activeEnrollment = action.payload.enrollment;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // My Enrollments
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.myEnrollments = action.payload;
      });
  },
});

export const { setFilters, resetFilters, updateEnrollmentProgress } = courseSlice.actions;
export default courseSlice.reducer;

