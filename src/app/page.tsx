"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarEventCard } from "@/components/CalendarEventCard";
import { DateFilter } from "@/components/DateFilter";
import { useAuth } from "@/app/hooks/useAuth";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      <span className="ml-2 text-gray-600">Loading events...</span>
    </div>
  );
}

// Error component
function ErrorMessage({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-red-600">
          <span className="text-sm font-medium">Error:</span>
          <span className="text-sm">{message}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state component
function EmptyState() {
  return (
    <Card className="border-dashed border-gray-300 bg-gray-50">
      <CardContent className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No events found
        </h3>
        <p className="text-gray-600">
          Your Google Calendar appears to be empty or events are not accessible.
        </p>
      </CardContent>
    </Card>
  );
}

// Events list component
function EventsList({
  events,
  isLoading,
  error,
}: {
  events: any[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (events.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <CalendarEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

// Main component
export default function Home() {
  const {
    token,
    isAuthenticated,
    isLoading: authLoading,
    login,
    logout,
    refreshAccessToken,
    isTokenExpired,
  } = useAuth();

  const [dateFilter, setDateFilter] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});

  // Convert Date objects to ISO strings for the API
  const apiDateFilter = {
    startDate: dateFilter.startDate?.toISOString().split("T")[0],
    endDate: dateFilter.endDate?.toISOString().split("T")[0],
  };

  const {
    data: events,
    isLoading,
    error,
  } = useCalendarEvents(
    token,
    apiDateFilter,
    refreshAccessToken,
    isTokenExpired
  );

  const handleDateChange = (startDate?: Date, endDate?: Date) => {
    setDateFilter({ startDate, endDate });
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Calendar Sync
              </h1>
              <p className="text-gray-600">View your Google Calendar events</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={isAuthenticated ? logout : login}
                variant={isAuthenticated ? "outline" : "default"}
                size="sm"
              >
                {isAuthenticated ? <>Sign Out</> : <>Sign in with Google</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {isAuthenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Date Filter Sidebar */}
            <div className="lg:col-span-1">
              <DateFilter onDateChange={handleDateChange} />
            </div>

            {/* Events List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Your Google Calendar Events
                    {dateFilter.startDate && (
                      <span className="text-sm font-normal text-gray-500">
                        (Filtered)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Events are automatically refreshed every 30 seconds
                    {dateFilter.startDate && " • Showing filtered results"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventsList
                    events={events || []}
                    isLoading={isLoading}
                    error={error}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Welcome Card for unauthenticated users */
          <Card className="max-w-full mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Welcome to Calendar Sync</CardTitle>
              <CardDescription>
                Connect your Google Calendar to view and manage your events
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={login} className="w-full">
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
