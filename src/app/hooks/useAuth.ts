import { useState, useEffect } from "react";

// Constants
const TOKEN_STORAGE_KEY = "google_access_token";

// Custom hook for authentication
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  };

  const isAuthenticated = !!token;

  return {
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
