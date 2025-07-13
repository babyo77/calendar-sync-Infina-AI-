"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Constants
const ACCESS_TOKEN_KEY = "google_access_token";
const REFRESH_TOKEN_KEY = "google_refresh_token";
const TOKEN_EXPIRY_KEY = "google_token_expiry";
const HOME_PATH = "/";
const ERROR_MESSAGE = "Authentication failed. Please try again.";

// Types
interface AuthState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

// Helper functions
function extractCodeFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("code");
  } catch (error) {
    console.error("Failed to parse URL:", error);
    return null;
  }
}

async function exchangeCodeForTokens(authCode: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: authCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to exchange code for tokens"
      );
    }

    const data = await response.json();
    return {
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
      expires_in: data.data.expires_in,
    };
  } catch (error) {
    console.error("Token exchange error:", error);
    throw new Error("Failed to exchange authorization code for tokens");
  }
}

function saveTokensToStorage(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    // Calculate expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error("Failed to save tokens to localStorage:", error);
    throw new Error("Failed to save authentication tokens");
  }
}

function cleanUrlAndRedirect(router: any): void {
  try {
    // Clean up the URL by removing query parameters
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    // Redirect to home
    router.replace(HOME_PATH);
  } catch (error) {
    console.error("Failed to clean URL and redirect:", error);
    // Fallback redirect
    window.location.href = HOME_PATH;
  }
}

// Main component
export default function OAuth2Callback() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    error: null,
    isSuccess: false,
  });

  useEffect(() => {
    async function handleAuthentication() {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Extract authorization code from URL
        const authCode = extractCodeFromUrl();

        if (!authCode) {
          throw new Error("No authentication code found in URL");
        }

        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(authCode);

        // Save tokens to localStorage
        saveTokensToStorage(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in
        );

        // Update success state
        setAuthState({
          isLoading: false,
          error: null,
          isSuccess: true,
        });

        // Clean URL and redirect after a brief delay for better UX
        setTimeout(() => {
          cleanUrlAndRedirect(router);
        }, 1500);
      } catch (error: any) {
        console.error("Authentication error:", error);

        setAuthState({
          isLoading: false,
          error: error.message || ERROR_MESSAGE,
          isSuccess: false,
        });

        // Redirect to home after showing error
        setTimeout(() => {
          cleanUrlAndRedirect(router);
        }, 3000);
      }
    }

    handleAuthentication();
  }, [router]);

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Processing authentication...</p>
      </div>
    );
  }

  // Error state
  if (authState.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-red-600 mb-2">
          Authentication Failed
        </h1>
        <p className="text-gray-600 text-center max-w-md">{authState.error}</p>
        <p className="text-sm text-gray-500 mt-4">
          Redirecting to home page...
        </p>
      </div>
    );
  }

  // Success state
  if (authState.isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-xl font-semibold text-green-600 mb-2">
          Authentication Successful
        </h1>
        <p className="text-gray-600">
          You have been successfully authenticated.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Redirecting to home page...
        </p>
      </div>
    );
  }

  // Fallback state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-lg text-gray-700">Processing...</p>
    </div>
  );
}
