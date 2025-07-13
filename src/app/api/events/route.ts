import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  getOAuth2Client,
  tokenFromHeaders,
  createErrorResponse,
  createSuccessResponse,
} from "../utils";

// Constants
const CALENDAR_ID = "primary";
const MAX_RESULTS = 50; // Increased for better filtering

// Types
interface CalendarEvent {
  id: string;
  summary: string;
  start: any;
  end: any;
}

interface DateFilter {
  startDate?: string;
  endDate?: string;
}

// Helper functions
async function getCalendarEvents(
  calendar: any,
  dateFilter?: DateFilter
): Promise<CalendarEvent[]> {
  const params: any = {
    calendarId: CALENDAR_ID,
    maxResults: MAX_RESULTS,
    singleEvents: true,
    orderBy: "startTime",
  };

  // Add date filtering if provided
  if (dateFilter?.startDate) {
    params.timeMin = new Date(dateFilter.startDate).toISOString();
  }

  if (dateFilter?.endDate) {
    // Set end date to end of day for inclusive filtering
    const endDate = new Date(dateFilter.endDate);
    endDate.setHours(23, 59, 59, 999);
    params.timeMax = endDate.toISOString();
  }

  const response = await calendar.events.list(params);
  return response.data.items || [];
}

async function setupCalendarService(accessToken: string) {
  const oAuth2Client = getOAuth2Client();

  // Set the access token directly
  oAuth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: "v3", auth: oAuth2Client });
}

// Main handler
export async function GET(req: NextRequest) {
  try {
    // Validate access token
    const accessToken = tokenFromHeaders(req.headers);
    if (!accessToken) {
      return createErrorResponse(
        "Access token not provided in headers as Authorization or x-access-token"
      );
    }

    // Parse query parameters for date filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: DateFilter = {};
    if (startDate) dateFilter.startDate = startDate;
    if (endDate) dateFilter.endDate = endDate;

    // Setup calendar service
    const calendar = await setupCalendarService(accessToken);

    // Get calendar events with date filter
    const events = await getCalendarEvents(calendar, dateFilter);

    return createSuccessResponse(events);
  } catch (error: any) {
    console.error("Calendar events fetch error:", error);
    return createErrorResponse(
      error.message || "Failed to fetch calendar events",
      500
    );
  }
}
