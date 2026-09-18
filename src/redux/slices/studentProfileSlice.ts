import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchStudentProfile, StudentProfileData } from '@/services/teacherService';

interface StudentProfileState {
  data: StudentProfileData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentProfileState = {
  data: null,
  isLoading: false,
  error: null
};

export const fetchStudentProfileData = createAsyncThunk(
  'studentProfile/fetchStudentProfileData',
  async (
    { teacherId, studentId, timeFilter = 'all' }: { teacherId: string; studentId: string; timeFilter?: 'weekly' | 'monthly' | 'all' },
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchStudentProfile(teacherId, studentId, timeFilter);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch student profile data');
    }
  }
);

const studentProfileSlice = createSlice({
  name: 'studentProfile',
  initialState,
  reducers: {
    clearStudentProfile: (state) => {
      state.data = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentProfileData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfileData.fulfilled, (state, action: PayloadAction<StudentProfileData>) => {
        state.isLoading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchStudentProfileData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearStudentProfile, clearError } = studentProfileSlice.actions;
export default studentProfileSlice.reducer;
