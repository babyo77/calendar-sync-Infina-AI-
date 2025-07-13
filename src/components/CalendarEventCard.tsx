import { CalendarEvent } from "@/app/hooks/useCalendarEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

// Google Calendar API Types
interface GoogleCalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  creator: {
    email: string;
    self: boolean;
  };
  organizer: {
    email: string;
    self: boolean;
  };
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  iCalUID: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
  };
  eventType: string;
  description?: string;
  location?: string;
}

interface CalendarEventCardProps {
  event: CalendarEvent | GoogleCalendarEvent;
}

function formatDateTime(dateTime?: string, date?: string): string {
  if (dateTime) {
    try {
      const parsedDate = parseISO(dateTime);
      if (isValid(parsedDate)) {
        return format(parsedDate, "MMM d, yyyy 'at' h:mm a");
      }
    } catch (error) {
      console.warn("Invalid dateTime format:", dateTime);
    }
  }

  if (date) {
    try {
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        return format(parsedDate, "MMM d, yyyy");
      }
    } catch (error) {
      console.warn("Invalid date format:", date);
    }
  }

  return "No date specified";
}

function isGoogleCalendarEvent(
  event: CalendarEvent | GoogleCalendarEvent
): event is GoogleCalendarEvent {
  return "kind" in event && event.kind === "calendar#event";
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  // Handle both CalendarEvent and GoogleCalendarEvent types
  const isGoogleEvent = isGoogleCalendarEvent(event);

  const startTime = formatDateTime(
    isGoogleEvent ? event.start?.dateTime : event.start?.dateTime,
    isGoogleEvent ? event.start?.date : event.start?.date
  );

  const endTime = event.end
    ? formatDateTime(
        isGoogleEvent ? event.end.dateTime : event.end.dateTime,
        isGoogleEvent ? event.end.date : event.end.date
      )
    : null;

  const summary = isGoogleEvent ? event.summary : event.summary;
  const location = isGoogleEvent ? event.location : event.location;
  const description = isGoogleEvent ? event.description : event.description;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Event Title */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
            {summary || "Untitled Event"}
          </h3>

          {/* Event Details */}
          <div className="space-y-2">
            {/* Date/Time */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {startTime}
                {endTime && endTime !== startTime && ` - ${endTime}`}
              </span>
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
