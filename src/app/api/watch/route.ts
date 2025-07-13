import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  getOAuth2Client,
  tokenFromHeaders,
  createErrorResponse,
  exchangeCodeForTokens,
} from "../utils";

// Types
interface WatchRequestBody {
  id: string;
  type: string;
  resourceId: string;
  address: string;
}

// Constants
const CALENDAR_ID = "primary";
const WEBHOOK_TYPE = "web_hook";
const CHANNEL_ID_PREFIX = "calendar-watch-";

// Helper functions
function createChannelId(userId: string): string {
  return `${CHANNEL_ID_PREFIX}${userId}`;
}

function createWatchRequestBody(channelId: string): WatchRequestBody {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("WEBHOOK_URL environment variable is not configured");
  }

  return {
    id: channelId,
    type: WEBHOOK_TYPE,
    resourceId: channelId,
    address: webhookUrl,
  };
}

async function getUserIdFromToken(authCode: string): Promise<string> {
  const oAuth2Client = getOAuth2Client();

  // Exchange authorization code for tokens
  const tokens = await exchangeCodeForTokens(authCode);
  oAuth2Client.setCredentials(tokens);

  const tokenInfo = await oAuth2Client.getTokenInfo(tokens.access_token!);

  if (!tokenInfo.user_id) {
    throw new Error("Unable to retrieve user ID from token");
  }

  return tokenInfo.user_id;
}

async function setupCalendarWatch(
  calendar: any,
  requestBody: WatchRequestBody
) {
  return await calendar.events.watch({
    calendarId: CALENDAR_ID,
    requestBody,
  });
}

// Main handler
export async function GET(req: NextRequest) {
  try {
    // Validate authorization code
    const authCode = tokenFromHeaders(req.headers);
    if (!authCode) {
      return createErrorResponse(
        "Authorization code not provided in headers as x-access-token"
      );
    }

    // Get user ID from token
    const userId = await getUserIdFromToken(authCode);
    const channelId = createChannelId(userId);

    // Setup OAuth2 client and calendar service
    const oAuth2Client = getOAuth2Client();

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(authCode);
    oAuth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    // Create watch request body
    const watchRequestBody = createWatchRequestBody(channelId);

    // Setup calendar watch
    const response = await setupCalendarWatch(calendar, watchRequestBody);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Calendar watch setup error:", error);
    return createErrorResponse(
      error.message || "Failed to setup calendar watch",
      500
    );
  }
}
