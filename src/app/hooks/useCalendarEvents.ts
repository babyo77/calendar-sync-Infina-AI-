import { useQuery } from "@tanstack/react-query";

// Types
export interface CalendarEvent {
  id: string;
  summary: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
}

interface EventsResponse {
  data: CalendarEvent[];
}

interface DateFilter {
  startDate?: string;
  endDate?: string;
}

// API functions
async function fetchCalendarEvents(
  token: string,
  dateFilter?: DateFilter
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (dateFilter?.startDate) {
    params.append("startDate", dateFilter.startDate);
  }
  if (dateFilter?.endDate) {
    params.append("endDate", dateFilter.endDate);
  }

  const url = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch calendar events");
  }

  const data: EventsResponse = await response.json();
  return data.data || [];
}

// Custom hook
export function useCalendarEvents(
  token: string | null,
  dateFilter?: DateFilter,
  refreshToken?: () => Promise<string | null>,
  isTokenExpired?: () => boolean
) {
  return useQuery({
    queryKey: ["calendar-events", token, dateFilter],
    queryFn: async () => {
      try {
        // Check if token is expired before making the request
        if (isTokenExpired && isTokenExpired()) {
          if (refreshToken) {
            const newToken = await refreshToken();
            if (newToken) {
              return await fetchCalendarEvents(newToken, dateFilter);
            }
          }
          throw new Error("Token expired and refresh failed");
        }

        return await fetchCalendarEvents(token!, dateFilter);
      } catch (error: any) {
        // Only attempt refresh for specific authentication errors, not all errors
        const isAuthError =
          error?.message?.includes("token") ||
          error?.message?.includes("auth") ||
          error?.message?.includes("authentication") ||
          error?.message?.includes("unauthorized") ||
          error?.message?.includes("401");

        if (isAuthError && refreshToken) {
          try {
            const newToken = await refreshToken();
            if (newToken) {
              return await fetchCalendarEvents(newToken, dateFilter);
            }
          } catch (refreshError: any) {
            // If refresh fails, don't retry - this prevents infinite loops
            console.error("Token refresh failed:", refreshError);
            throw new Error("Authentication failed. Please sign in again.");
          }
        }
        throw error;
      }
    },
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors - this prevents infinite loops
      const isAuthError =
        error?.message?.includes("token") ||
        error?.message?.includes("auth") ||
        error?.message?.includes("authentication") ||
        error?.message?.includes("unauthorized") ||
        error?.message?.includes("401");

      if (isAuthError) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
