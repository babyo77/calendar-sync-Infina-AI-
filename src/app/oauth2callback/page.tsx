"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Constants
const TOKEN_STORAGE_KEY = "google_access_token";
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

async function exchangeCodeForTokens(authCode: string): Promise<string> {
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
    return data.data.access_token;
  } catch (error) {
    console.error("Token exchange error:", error);
    throw new Error("Failed to exchange authorization code for tokens");
  }
}

function saveTokenToStorage(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("Failed to save token to localStorage:", error);
    throw new Error("Failed to save authentication token");
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

        // Exchange authorization code for access token
        const accessToken = await exchangeCodeForTokens(authCode);

        // Save access token to localStorage
        saveTokenToStorage(accessToken);

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
