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
  refreshToken?: () => Promise<string | null>
) {
  return useQuery({
    queryKey: ["calendar-events", token, dateFilter],
    queryFn: async () => {
      try {
        return await fetchCalendarEvents(token!, dateFilter);
      } catch (error: any) {
        // If it's an authentication error and we have a refresh function, try to refresh
        if (
          (error?.message?.includes("token") ||
            error?.message?.includes("auth") ||
            error?.message?.includes("authentication")) &&
          refreshToken
        ) {
          const newToken = await refreshToken();
          if (newToken) {
            return await fetchCalendarEvents(newToken, dateFilter);
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
      // Don't retry on authentication errors after refresh attempt
      if (
        error?.message?.includes("token") ||
        error?.message?.includes("auth")
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
