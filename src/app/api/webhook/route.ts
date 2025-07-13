import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "../utils";

// Constants
const CHANNEL_ID_PREFIX = "calendar-watch-";
const UNKNOWN_USER = "unknown";

// Types
interface WebhookBody {
  resourceId?: string;
  id?: string;
}

interface WebhookData {
  userId: string;
  resourceId?: string;
  channelId?: string;
  headers: Record<string, string>;
  body: WebhookBody;
}

// Helper functions
function extractUserIdFromChannelId(channelId?: string): string {
  if (!channelId || typeof channelId !== "string") {
    return UNKNOWN_USER;
  }

  if (channelId.startsWith(CHANNEL_ID_PREFIX)) {
    return channelId.replace(CHANNEL_ID_PREFIX, "");
  }

  return UNKNOWN_USER;
}

function parseWebhookBody(body: any): WebhookBody {
  return {
    resourceId: body?.resourceId,
    id: body?.id,
  };
}

function createWebhookData(body: WebhookBody, headers: Headers): WebhookData {
  const userId = extractUserIdFromChannelId(body.id);

  return {
    userId,
    resourceId: body.resourceId,
    channelId: body.id,
    headers: Object.fromEntries(headers.entries()),
    body,
  };
}

function logWebhookData(webhookData: WebhookData): void {
  console.log(`Webhook received for user: ${webhookData.userId}`, webhookData);
}

// Main handler
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const webhookBody = parseWebhookBody(body);

    // Create webhook data object
    const webhookData = createWebhookData(webhookBody, req.headers);

    // Log webhook data
    logWebhookData(webhookData);

    // Return success response
    return createSuccessResponse(
      { message: "Webhook processed successfully" },
      "Webhook received and processed"
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return createErrorResponse(
      error.message || "Failed to process webhook",
      500
    );
  }
}
