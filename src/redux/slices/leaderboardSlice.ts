// import apiClient from '@/config/ApiConfig';
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// // Define types
// export interface LeaderboardUser {
//   rank: number;
//   username: string;
//   firstName: string;
//   lastName: string;
//   schoolName: string;
//   class: string;
//   cefrLevel: string;
//   totalSeconds: number;
// }

// interface LeaderboardState {
//   leaderboard: LeaderboardUser[];
//   currentUser: LeaderboardUser | null;
//   isLoading: boolean;
//   error: string | null;
// }

// const initialState: LeaderboardState = {
//   leaderboard: [],
//   currentUser: null,
//   isLoading: false,
//   error: null
// };

// // Helper function to convert seconds to hours and minutes format
// export const formatTime = (seconds: number): string => {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   return `${hours}h ${minutes}m`;
// };

// // Async thunk for fetching leaderboard data
// export const fetchLeaderboard = createAsyncThunk(
//   'leaderboard/fetchLeaderboard',
//   async (userId: string, { rejectWithValue }) => {
//     try {
//       const response = await apiClient.get(`/leaderboard/weekly?userId=${userId}`);
      
//       return response.data as {
//         leaderboard: LeaderboardUser[];
//         currentUser: LeaderboardUser;
//       };
//     } catch (error: any) {
//       if (error.response && error.response.data) {
//         return rejectWithValue(error.response.data.message || 'Failed to fetch leaderboard');
//       }
//       return rejectWithValue(error.message || 'Failed to fetch leaderboard');
//     }
//   }
// );

// // Leaderboard slice
// const leaderboardSlice = createSlice({
//   name: 'leaderboard',
//   initialState,
//   reducers: {
//     clearLeaderboard: (state) => {
//       state.leaderboard = [];
//       state.currentUser = null;
//     },
//     clearError: (state) => {
//       state.error = null;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchLeaderboard
//       .addCase(fetchLeaderboard.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(fetchLeaderboard.fulfilled, (state, action: PayloadAction<{
//         leaderboard: LeaderboardUser[];
//         currentUser: LeaderboardUser;
//       }>) => {
//         state.isLoading = false;
//         state.leaderboard = action.payload.leaderboard;
//         state.currentUser = action.payload.currentUser;
//         state.error = null;
//       })
//       .addCase(fetchLeaderboard.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload as string;
//       });
//   }
// });

// export const { clearLeaderboard, clearError } = leaderboardSlice.actions;
// export default leaderboardSlice.reducer;
import apiClient from '@/config/ApiConfig';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Define types
export interface LeaderboardUser {
  rank: number;
  username: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  class: string;
  // cefrLevel: string;
  aiCefrLevel: string | null;
  cefrLevel?: string | null;
  totalSeconds: number;
  completedTopics: number;
}

interface LeaderboardState {
  leaderboard: LeaderboardUser[];
  scope: 'general' | 'level' | null;
  currentUser: LeaderboardUser | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  leaderboard: [],
  scope: null,
  currentUser: null,
  isLoading: false,
  error: null
};

// Helper function to convert seconds to hours and minutes format
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Define filter types
export interface LeaderboardFilters {
  userId: string;
  class?: string;
  school?: string;
  cefrLevel?: string;
}

// Async thunk for fetching leaderboard data
export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (filters: LeaderboardFilters, { rejectWithValue }) => {
    try {
      // Construct query params
      const queryParams = new URLSearchParams();
      queryParams.append('userId', filters.userId);
      
      if (filters.class) {
        queryParams.append('class', filters.class);
      }
      
      if (filters.school) {
        queryParams.append('school', filters.school);
      }
      
      if (filters.cefrLevel) {
        queryParams.append('cefrLevel', filters.cefrLevel);
      }
      
      const response = await apiClient.get(`/leaderboard/weekly?${queryParams.toString()}`);
      
      // The LMS wraps results; older deployments returned the payload directly.
      const payload = response.data?.data ?? response.data;
      if (!Array.isArray(payload?.leaderboard) || !payload?.currentUser) {
        throw new Error('The leaderboard returned an invalid response. Please retry.');
      }
      return payload as {
        scope?: 'general' | 'level';
        leaderboard: LeaderboardUser[];
        currentUser: LeaderboardUser;
      };
    } catch (error: any) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch leaderboard');
      }
      return rejectWithValue(error.message || 'Failed to fetch leaderboard');
    }
  }
);

// Leaderboard slice
const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearLeaderboard: (state) => {
      state.leaderboard = [];
      state.scope = null;
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchLeaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action: PayloadAction<{
        scope?: 'general' | 'level';
        leaderboard: LeaderboardUser[];
        currentUser: LeaderboardUser;
      }>) => {
        state.isLoading = false;
        state.leaderboard = action.payload.leaderboard;
        state.scope = action.payload.scope ?? null;
        state.currentUser = action.payload.currentUser;
        state.error = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearLeaderboard, clearError } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
