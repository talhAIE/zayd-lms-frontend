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
  if (config?.authIdentity && config.authIdentity !== sessionIdentity()) {
    throw new axios.CanceledError('Session changed during request');
  }
  if (config?.scienceSession && !config.scienceSession()) {
    throw new axios.CanceledError('Science session changed');
  }
};
const sessionIdentity = () => {
  try {
    const user = JSON.parse(localStorage.getItem('AiTutorUser') || 'null');
    return JSON.stringify([user?.id, user?.username, user?.role?.toLowerCase(), user?.region]);
  } catch { return ''; }
};

let refreshing: { identity: string; refreshToken: string; promise: Promise<string> } | null = null;

// HTTP and authenticated sockets share token rotation. An old account's refresh
// must never supply credentials to, overwrite, or log out a replacement account.
export function refreshAccessToken(failedToken?: string | null): Promise<string> {
  const identity = sessionIdentity();
  const currentToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (failedToken && currentToken && currentToken !== failedToken) return Promise.resolve(currentToken);
  if (refreshing?.identity === identity && refreshing.refreshToken === refreshToken) return refreshing.promise;
  if (!refreshToken) {
    clearAuthData();
    window.location.href = '/login';
    return Promise.reject(new Error('Authentication required'));
  }
  const operation = { identity, refreshToken, promise: null as unknown as Promise<string> };
  operation.promise = axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 30000 })
    .then(({ data }) => {
      if (sessionIdentity() !== identity || localStorage.getItem('refreshToken') !== refreshToken) {
        throw new axios.CanceledError('Session changed during refresh');
      }
      if (!data.accessToken || !data.refreshToken) throw new Error('Invalid refresh response');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken as string;
    })
    .catch(error => {
      if (sessionIdentity() !== identity || localStorage.getItem('refreshToken') !== refreshToken) {
        throw new axios.CanceledError('Session changed during refresh');
      }
      clearAuthData();
      window.location.href = '/login';
      throw error;
    })
    .finally(() => { if (refreshing === operation) refreshing = null; });
  refreshing = operation;
  return operation.promise;
}

// Add a request interceptor for authentication
apiClient.interceptors.request.use(
  (config: any) => {
    config.authIdentity ??= sessionIdentity();
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
      const identity = sessionIdentity();
      const failedToken = String(originalRequest.headers?.Authorization || '').replace(/^Bearer /, '');
      const accessToken = await refreshAccessToken(failedToken);
      if (sessionIdentity() !== identity) throw new axios.CanceledError('Session changed during refresh');
      assertRequestOwner(originalRequest);
      originalRequest.headers["Authorization"] = "Bearer " + accessToken;
      return apiClient(originalRequest);
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
