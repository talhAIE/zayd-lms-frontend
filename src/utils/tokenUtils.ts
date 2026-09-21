/**
 * Utility functions for JWT token management
 */

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @returns boolean - true if token is expired or invalid
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param token - JWT token string
 * @returns Date | null - expiration date or null if invalid
 */
export const getTokenExpiration = (token: string | null): Date | null => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Check if user has valid authentication tokens
 * @returns boolean - true if user has valid tokens
 */
export const hasValidTokens = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  return !!(accessToken && refreshToken && !isTokenExpired(refreshToken));
};

/**
 * Decode JWT token payload
 * @param token - JWT token string
 * @returns object | null - decoded payload or null if invalid
 */
export const decodeJWT = (token: string | null): any | null => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Get user data from access token
 * @returns object | null - user data from token or null if invalid
 */
export const getUserDataFromToken = (): { username: string; role: string; schoolCategory: string } | null => {
  const accessToken = localStorage.getItem('accessToken');
  const payload = decodeJWT(accessToken);
  
  if (!payload) return null;
  
  return {
    username: payload.username || payload.sub || '',
    role: payload.role || '',
    schoolCategory: payload.schoolCategory || ''
  };
};

/**
 * Check if access token is valid and not expired
 * @returns boolean - true if access token is valid
 */
export const isAccessTokenValid = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  return !!(accessToken && !isTokenExpired(accessToken));
};

/**
 * Get time until access token expires (in seconds)
 * @returns number | null - seconds until expiration or null if invalid
 */
export const getTimeUntilTokenExpiry = (): number | null => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return null;
  
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    return Math.max(0, timeUntilExpiry);
  } catch (error) {
    return null;
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 * @returns boolean - true if token expires within 5 minutes
 */
export const isTokenExpiringSoon = (): boolean => {
  const timeUntilExpiry = getTimeUntilTokenExpiry();
  return timeUntilExpiry !== null && timeUntilExpiry < 300; // 5 minutes
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('AiTutorUser');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('engagementSessionId');
};
