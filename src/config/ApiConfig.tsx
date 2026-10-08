import axios from "axios";
import { clearAuthData } from "@/utils/tokenUtils";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const baseURL = `${apiBase}/api/v1`;

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

// Science supplies a request-local account/lifetime guard. It shares this
// refresh queue with ordinary courses, so simultaneous 401s rotate only once.
const assertRequestOwner = (config: any) => {
  if (config?.scienceSession && !config.scienceSession()) {
    throw new axios.CanceledError('Science session changed');
  }
};
const sessionIdentity = () => {
  try {
    const user = JSON.parse(localStorage.getItem('AiTutorUser') || 'null');
    return JSON.stringify([user?.id, user?.username]);
  } catch { return ''; }
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Add a request interceptor for authentication
apiClient.interceptors.request.use(
  (config: any) => {
    assertRequestOwner(config);
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response: any) => {
    assertRequestOwner(response.config);
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;
    assertRequestOwner(originalRequest);

    // Handle 401 Unauthorized errors
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      const refreshTokenValue = localStorage.getItem("refreshToken");
      const refreshingIdentity = sessionIdentity();

      if (!refreshTokenValue) {
        isRefreshing = false;
        processQueue(error);
        // No refresh token, redirect to login
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: refreshTokenValue,
        }, { timeout: 30000 });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (sessionIdentity() !== refreshingIdentity || localStorage.getItem('refreshToken') !== refreshTokenValue) {
          throw new axios.CanceledError('Session changed during refresh');
        }

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, accessToken);

        // Retry the original request with new token
        originalRequest.headers["Authorization"] = "Bearer " + accessToken;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // A late refresh must never clear the newly signed-in account.
        if (sessionIdentity() !== refreshingIdentity || localStorage.getItem('refreshToken') !== refreshTokenValue) {
          return Promise.reject(refreshError);
        }
        // Refresh failed, redirect to login
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      // User doesn't have permission for this resource
      console.warn(
        "Access forbidden:",
        error.response.data?.message || "Forbidden resource"
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
