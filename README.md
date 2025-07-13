# Calendar Sync - Google Calendar Integration

A modern Next.js application that provides seamless Google Calendar integration with real-time event synchronization and a beautiful user interface.

## 🚀 Features

- **OAuth 2.0 Authentication**: Secure Google Calendar access with automatic token refresh
- **Real-time Event Sync**: Automatic refresh every 30 seconds with React Query
- **Date Filtering**: Filter events by specific dates with a calendar interface
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Works on desktop and mobile devices
- **Token Management**: Automatic token refresh and expiry handling

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    ┌─────────────────┐    ┌─────────────────┐
│   (React)       │◄──►│   Next.js API   │◄──►│   Google APIs   │
│                 │    │   Routes        │    │   Calendar API  │
│ • useAuth       │    │                 │    │                 │
│ • useCalendar   │    │ • /api/auth     │    │ • OAuth 2.0     │
│ • Event Cards   │    │ • /api/events   │    │ • Calendar v3   │
│ • Date Filter   │    │ • /api/refresh  │    │ • User Info     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Storage │    │   Environment   │    │   Google Cloud  │
│                 │    │   Variables     │    │   Console       │
│ • Access Token  │    │ • Client ID     │    │ • OAuth Setup   │
│ • Refresh Token │    │ • Client Secret │    │ • API Keys      │
│ • Token Expiry  │    │ • Redirect URI  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (package manager)
- Google Cloud Console project with Calendar API enabled
- OAuth 2.0 credentials configured

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd calendar-sync
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

## 🔧 Key Code Snippets

### OAuth 2.0 Authentication Flow

**Login Route** (`/api/auth/login/route.ts`):
```typescript
export async function GET(req: NextRequest) {
  const oAuth2Client = getOAuth2Client();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
  return NextResponse.redirect(authUrl);
}
```

**Token Exchange** (`/api/auth/route.ts`):
```typescript
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const tokens = await exchangeCodeForTokens(code);
  return createSuccessResponse({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expiry_date,
  });
}
```

**Token Refresh** (`/api/auth/refresh/route.ts`):
```typescript
export async function POST(req: NextRequest) {
  const { refresh_token } = await req.json();
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({ refresh_token });
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return createSuccessResponse({
    access_token: credentials.access_token,
    expires_in: credentials.expiry_date,
  });
}
```

### Calendar Events Fetching

**API Route** (`/api/events/route.ts`):
```typescript
export async function GET(req: NextRequest) {
  const accessToken = tokenFromHeaders(req.headers);
  const calendar = await setupCalendarService(accessToken);
  
  // Parse date filters from query parameters
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  
  const events = await getCalendarEvents(calendar, { startDate, endDate });
  return createSuccessResponse(events);
}
```

**React Hook** (`useCalendarEvents.ts`):
```typescript
export function useCalendarEvents(
  token: string | null,
  dateFilter?: DateFilter,
  refreshToken?: () => Promise<string | null>,
  isTokenExpired?: () => boolean
) {
  return useQuery({
    queryKey: ["calendar-events", token, dateFilter],
    queryFn: async () => {
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
    },
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
```

### Authentication Hook

**useAuth Hook** (`useAuth.ts`):
```typescript
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for tokens in localStorage on mount
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    setToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);
    setIsLoading(false);

    // Check if token is expired or about to expire (within 5 minutes)
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (currentTime >= expiryTime - fiveMinutes) {
        refreshAccessToken();
      }
    }
  }, []);

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) return null;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) throw new Error("Failed to refresh token");

      const data = await response.json();
      const newToken = data.data.access_token;
      const expiresIn = data.data.expires_in;
      const expiryTime = Date.now() + expiresIn * 1000;

      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      setToken(newToken);

      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return null;
    }
  };

  return {
    token,
    refreshToken,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    isTokenExpired,
  };
}
```

### Event Display Component

**CalendarEventCard** (`CalendarEventCard.tsx`):
```typescript
export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const startTime = formatDateTime(event.start?.dateTime, event.start?.date);
  const endTime = event.end 
    ? formatDateTime(event.end.dateTime, event.end.date) 
    : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
            {event.summary || "Untitled Event"}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {startTime}
                {endTime && endTime !== startTime && ` - ${endTime}`}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            
            {event.description && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Date Filtering Component

**DateFilter** (`DateFilter.tsx`):
```typescript
export function DateFilter({ onDateChange, className }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    onDateChange(startOfDay, endOfDay);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      onDateChange(startOfDay, endOfDay);
      setIsOpen(false);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Filter by Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calendar and filter controls */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🎯 Design Decisions

### 1. **Next.js 15 with App Router**
- **Decision**: Used Next.js 15 with App Router for modern React patterns
- **Rationale**: Provides excellent developer experience, built-in API routes, and optimal performance
- **Benefits**: Server-side rendering, automatic code splitting, and simplified routing

### 2. **OAuth 2.0 with Token Refresh**
- **Decision**: Implemented server-side OAuth flow with automatic token refresh
- **Rationale**: More secure than client-side OAuth, prevents token exposure in URLs
- **Implementation**: Authorization code flow with automatic refresh token handling

### 3. **React Query for Data Management**
- **Decision**: Used TanStack Query for calendar events fetching
- **Rationale**: Provides automatic caching, background updates, and error handling
- **Configuration**: 30-second polling interval with smart retry logic

### 4. **TypeScript Throughout**
- **Decision**: Full TypeScript implementation with strict typing
- **Rationale**: Catches errors at compile time, improves developer experience
- **Benefits**: Better IDE support, self-documenting code, safer refactoring

### 5. **Component Architecture**
- **Decision**: Modular component structure with custom hooks
- **Rationale**: Separation of concerns, reusability, and testability
- **Pattern**: Custom hooks for business logic, presentational components for UI

### 6. **Date Filtering System**
- **Decision**: Implemented client-side date filtering with calendar UI
- **Rationale**: Better user experience for viewing specific date ranges
- **Implementation**: Uses date-fns for date manipulation and react-day-picker for calendar

### 7. **Error Handling Strategy**
- **Decision**: Comprehensive error boundaries and user-friendly error messages
- **Rationale**: Better user experience and easier debugging
- **Implementation**: Try-catch blocks with meaningful error messages and automatic retry logic

## ⚖️ Trade-offs and Limitations

### **Security Considerations**
- **Current**: Access tokens stored in localStorage
- **Limitation**: Vulnerable to XSS attacks
- **Mitigation**: Consider httpOnly cookies or secure token storage for production
- **Trade-off**: Simplicity vs. security

### **Performance Limitations**
- **Polling**: 30-second intervals may miss real-time updates
- **Alternative**: WebSocket connections or Google Calendar push notifications
- **Trade-off**: Implementation complexity vs. real-time accuracy

### **Scalability Concerns**
- **API Rate Limits**: Google Calendar API has quotas
- **Current**: Basic error handling with retry logic
- **Mitigation**: Implement exponential backoff and request queuing
- **Trade-off**: Development speed vs. production readiness

### **User Experience Limitations**
- **Offline Support**: No offline functionality
- **Progressive Web App**: Could add service workers for offline access
- **Trade-off**: Feature complexity vs. user experience

### **Data Synchronization**
- **Read-only**: Currently only displays events
- **Limitation**: No create, update, or delete functionality
- **Future**: Could add full CRUD operations
- **Trade-off**: Scope management vs. feature completeness

### **Browser Compatibility**
- **Modern APIs**: Uses localStorage and modern JavaScript features
- **Limitation**: May not work in older browsers
- **Mitigation**: Could add polyfills for broader compatibility
- **Trade-off**: Modern development vs. browser support

## 🔮 Future Enhancements

1. **Real-time Updates**: Implement Google Calendar push notifications
2. **Event Management**: Add create, edit, and delete functionality
3. **Multiple Calendars**: Support for multiple Google Calendar accounts
4. **Offline Support**: Service worker implementation for offline access
5. **Advanced Filtering**: Calendar selection, search, and more date range options
6. **Mobile App**: React Native or PWA implementation
7. **Analytics**: Event analytics and usage insights
8. **Notifications**: Browser notifications for upcoming events
9. **Calendar View**: Month/week/day calendar view options
10. **Event Details**: Expandable event details with full information

## 🧪 Testing

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests (when implemented)
pnpm test
```

## 📦 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables for Production
```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/oauth2callback
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [TanStack Query](https://tanstack.com/query) for data fetching
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Google Calendar API](https://developers.google.com/calendar) for calendar integration
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [date-fns](https://date-fns.org/) for date manipulation
- [Lucide React](https://lucide.dev/) for icons
