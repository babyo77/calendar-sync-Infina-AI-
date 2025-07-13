import { useState, useEffect } from "react";

// Constants
const ACCESS_TOKEN_KEY = "google_access_token";
const REFRESH_TOKEN_KEY = "google_refresh_token";
const TOKEN_EXPIRY_KEY = "google_token_expiry";

// Types
interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Custom hook for authentication
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for tokens in localStorage on mount
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    setToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);
    setIsLoading(false);

    // Check if token is expired or about to expire (within 5 minutes)
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (currentTime >= expiryTime - fiveMinutes) {
        // Token is expired or will expire soon, refresh it
        refreshAccessToken();
      }
    }
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setToken(null);
    setRefreshToken(null);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newToken = data.data.access_token;
      const expiresIn = data.data.expires_in;

      // Calculate expiry time (current time + expires_in seconds)
      const expiryTime = Date.now() + expiresIn * 1000;

      // Update stored token and expiry
      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      setToken(newToken);

      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout the user
      logout();
      return null;
    }
  };

  const isAuthenticated = !!token;

  // Check if token is expired or will expire soon (within 5 minutes)
  const isTokenExpired = (): boolean => {
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!storedExpiry) return true;

    const expiryTime = parseInt(storedExpiry);
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return currentTime >= expiryTime - fiveMinutes;
  };

  return {
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    isTokenExpired,
  };
}
