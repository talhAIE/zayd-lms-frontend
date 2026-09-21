import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { User } from '@/types/auth';
import { clearAuthData } from '@/utils/tokenUtils';

export type UserRole = 'student' | 'teacher';

export interface AuthResponse {
  status: string;
  message: string;
  user: User;
  accessToken: string; // JWT access token
  refreshToken: string; // JWT refresh token
  /** Present when LMS activity tracking is enabled for the deployment. */
  engagementSessionId?: string;
}

export interface LoginCredentials {
  username: string;
}

export interface PhoneNumberCredentials {
  username: string;
  phoneNumber: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initialize state from localStorage
const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('AiTutorUser') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,
  isAuthenticated: Boolean(localStorage.getItem('AiTutorUser')),
};

const AVAILABLE_TOPIC_MODES_KEY = 'availableTopicModes';
const TOPIC_MODES_TO_CHECK = [
  'chat-mode',
  'photo-mode',
  'reading-mode',
  'roleplay-mode',
  'listening-mode',
  'debate-mode',
  'curriculum-mode',
  '3d-reading-mode',
  '3d-roleplay-mode',
  '3d-listening-mode',
];

/**
 * The former Topic API is not part of the LMS backend. Preserve the previous
 * fail-open behaviour locally so login never calls the removed endpoint.
 * School-specific visibility remains enforced by the learning-mode page.
 */
const getAvailableTopicModes = (): string[] => [...TOPIC_MODES_TO_CHECK];

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`, credentials);
      
      const data = response.data as AuthResponse;
      
      const userWithRole = {
        ...data.user,
        role: data.user.role.toLowerCase() as UserRole
      };
      
      localStorage.setItem('AiTutorUser', JSON.stringify(userWithRole));
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.engagementSessionId) {
        localStorage.setItem('engagementSessionId', data.engagementSessionId);
      } else {
        localStorage.removeItem('engagementSessionId');
      }
      
      localStorage.setItem('loginEvent', Date.now().toString());
      localStorage.removeItem('loginEvent');

      try {
        const availableModes = getAvailableTopicModes();
        localStorage.setItem(
          AVAILABLE_TOPIC_MODES_KEY,
          JSON.stringify(availableModes)
        );
      } catch {
        // ignore availability errors
      }
      
      return {
        user: userWithRole,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        message: data.message
      };
    } catch (error: any) {
      // Handle errors from the API
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'An unknown error occurred');
      }
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

// Add phone number thunk
export const addPhoneNumber = createAsyncThunk(
  'auth/addPhoneNumber',
  async (credentials: PhoneNumberCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/add-phone`,
        credentials
      );
      
      const data = response.data as Partial<AuthResponse> & { user: User };
      
      const existingUserData = JSON.parse(localStorage.getItem('AiTutorUser') || '{}');
      
      const userWithRole = {
        ...existingUserData, 
        ...data.user,
        role: data.user.role.toLowerCase() as UserRole
      };
      
      localStorage.setItem('AiTutorUser', JSON.stringify(userWithRole));
      
      const accessToken = localStorage.getItem('accessToken') || '';
      const refreshToken = localStorage.getItem('refreshToken') || '';
      
      localStorage.setItem('loginEvent', Date.now().toString());
      localStorage.removeItem('loginEvent');

      if (accessToken) {
        try {
          const availableModes = getAvailableTopicModes();
          localStorage.setItem(
            AVAILABLE_TOPIC_MODES_KEY,
            JSON.stringify(availableModes)
          );
        } catch {
          // ignore availability errors
        }
      }
      
      return {
        user: userWithRole,
        accessToken,
        refreshToken,
        message: data.message
      };
    } catch (error: any) {
      // Handle errors from the API
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'An unknown error occurred');
      }
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

// Refresh token thunk
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken: refreshTokenValue }
      );
      
      const data = response.data as { accessToken: string; refreshToken: string };
      
      // Store new tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    } catch (error: any) {
      // If refresh fails, clear tokens and redirect to login
      clearAuthData();
      window.location.href = '/login';
      
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'Token refresh failed');
      }
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

// Get current user thunk (validate token)
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const userData = response.data;
      
      // Update localStorage with fresh user data
      const userWithRole = {
        ...userData,
        role: userData.role.toLowerCase() as UserRole
      };
      
      localStorage.setItem('AiTutorUser', JSON.stringify(userWithRole));

      const cached = localStorage.getItem(AVAILABLE_TOPIC_MODES_KEY);
      if (!cached) {
        try {
          const availableModes = getAvailableTopicModes();
          localStorage.setItem(
            AVAILABLE_TOPIC_MODES_KEY,
            JSON.stringify(availableModes)
          );
        } catch {
          // ignore availability errors
        }
      }
      
      return userWithRole;
    } catch (error: any) {
      // If token validation fails, clear auth data
      if (error.response?.status === 401) {
        clearAuthData();
        window.location.href = '/login';
      }
      
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'Token validation failed');
      }
      return rejectWithValue(error.message || 'Token validation failed');
    }
  }
);

// Logout thunk
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout API endpoint if we have tokens
    if (accessToken && refreshToken) {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/logout`,
        { refreshToken },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error: any) {
    // Even if logout API fails, we should still clear local data
    console.warn('Logout API call failed:', error.message);
  } finally {
    // Always clear localStorage regardless of API call result
    clearAuthData();
    
    localStorage.setItem('logoutEvent', Date.now().toString());
    localStorage.removeItem('logoutEvent');
  }
  
  return null;
});

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    crossTabLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Add phone number
      .addCase(addPhoneNumber.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPhoneNumber.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(addPhoneNumber.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, crossTabLogout } = authSlice.actions;
export default authSlice.reducer;
