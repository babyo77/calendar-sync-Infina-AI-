import { NextRequest } from "next/server";
import { google } from "googleapis";
import {
  createErrorResponse,
  createSuccessResponse,
  validateEnvironmentVariables,
} from "../../utils";

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    validateEnvironmentVariables();

    // Parse request body
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return createErrorResponse("Refresh token is required", 400);
    }

    // Setup OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refresh_token,
    });

    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Return the new access token
    return createSuccessResponse({
      access_token: credentials.access_token,
      expires_in: credentials.expiry_date,
    });
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return createErrorResponse(
      error.message || "Failed to refresh access token",
      500
    );
  }
}
