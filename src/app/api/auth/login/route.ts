import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, createErrorResponse } from "../../utils";

// Constants
const ACCESS_TYPE = "offline";
const PROMPT_TYPE = "consent";

// Scopes for Google Calendar API
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

// Helper functions
function generateAuthUrl(oAuth2Client: any): string {
  return oAuth2Client.generateAuthUrl({
    access_type: ACCESS_TYPE,
    scope: CALENDAR_SCOPES,
    prompt: PROMPT_TYPE,
  });
}

// Main handler
export async function GET(req: NextRequest) {
  try {
    // Setup OAuth2 client
    const oAuth2Client = getOAuth2Client();

    // Generate authentication URL
    const authUrl = generateAuthUrl(oAuth2Client);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Auth URL generation error:", error);
    return createErrorResponse(
      error.message || "Failed to generate authentication URL",
      500
    );
  }
}
