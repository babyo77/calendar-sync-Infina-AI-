import { useState, useEffect } from "react";

// Constants
const ACCESS_TOKEN_KEY = "google_access_token";
const REFRESH_TOKEN_KEY = "google_refresh_token";

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

    setToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);
    setIsLoading(false);
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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

      // Update stored token
      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
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

  return {
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAccessToken,
  };
}
