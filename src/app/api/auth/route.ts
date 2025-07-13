import { NextRequest } from "next/server";
import {
  exchangeCodeForTokens,
  createErrorResponse,
  createSuccessResponse,
  validateEnvironmentVariables,
} from "../utils";

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    validateEnvironmentVariables();

    // Parse request body
    const { code } = await req.json();

    if (!code) {
      return createErrorResponse("Authorization code is required", 400);
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Return the access token
    return createSuccessResponse({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date,
    });
  } catch (error: any) {
    console.error("Auth error:", error);
    return createErrorResponse(error.message || "Authentication failed", 500);
  }
}
