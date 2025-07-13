import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Common types for API responses
export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface SuccessResponse<T = any> {
  data: T;
  message?: string;
}

// Global error response utility
export function createErrorResponse(
  error: string,
  status: number = 400,
  message?: string
): NextResponse {
  const errorResponse: ErrorResponse = { error, message };
  return NextResponse.json(errorResponse, { status });
}

// Global success response utility
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const successResponse: SuccessResponse<T> = { data, message };
  return NextResponse.json(successResponse, { status });
}

export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
}

// Extract token from headers (for Next.js API routes)
export function tokenFromHeaders(headers: Headers) {
  const tokenHeader =
    headers.get("authorization") || headers.get("x-access-token");

  if (tokenHeader) {
    return tokenHeader;
  }
  return null;
}

// Exchange authorization code for access tokens
export async function exchangeCodeForTokens(authCode: string) {
  const oAuth2Client = getOAuth2Client();

  try {
    const { tokens } = await oAuth2Client.getToken(authCode);
    return tokens;
  } catch (error) {
    console.error("Token exchange error:", error);
    throw new Error("Failed to exchange authorization code for tokens");
  }
}

// Validate required environment variables
export function validateEnvironmentVariables(): void {
  const requiredVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "WEBHOOK_URL",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}
