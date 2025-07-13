# Calendar Sync - Google Calendar Integration

A modern Next.js application that provides seamless Google Calendar integration with real-time event synchronization and a beautiful user interface.

## 🚀 Features

- **OAuth 2.0 Authentication**: Secure Google Calendar access
- **Real-time Event Sync**: Automatic refresh every 30 seconds
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **TypeScript**: Full type safety throughout the application
- **React Query**: Efficient data fetching and caching
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │   Google APIs   │
│   (React)       │◄──►│   Routes        │◄──►│   Calendar API  │
│                 │    │                 │    │                 │
│ • useAuth       │    │ • /api/auth     │    │ • OAuth 2.0     │
│ • useCalendar   │    │ • /api/events   │    │ • Calendar v3   │
│ • Event Cards   │    │ • /api/login    │    │ • User Info     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Storage │    │   Environment   │    │   Google Cloud  │
│                 │    │   Variables     │    │   Console       │
│ • Access Token  │    │ • Client ID     │    │ • OAuth Setup   │
│ • Auth State    │    │ • Client Secret │    │ • API Keys      │
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
   WEBHOOK_URL=your_webhook_url
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

### Calendar Events Fetching

**API Route** (`/api/events/route.ts`):
```typescript
export async function GET(req: NextRequest) {
  const accessToken = tokenFromHeaders(req.headers);
  const calendar = await setupCalendarService(accessToken);
  const events = await getCalendarEvents(calendar);
  return createSuccessResponse(events);
}
```

**React Hook** (`useCalendarEvents.ts`):
```typescript
export function useCalendarEvents(token: string | null) {
  return useQuery({
    queryKey: ["calendar-events", token],
    queryFn: () => fetchCalendarEvents(token!),
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
```

### Event Display Component

**CalendarEventCard** (`CalendarEventCard.tsx`):
```typescript
export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const startTime = formatDateTime(event.start?.dateTime, event.start?.date);
  const endTime = event.end ? formatDateTime(event.end.dateTime, event.end.date) : null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-gray-900">
          {event.summary || "Untitled Event"}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{startTime}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 🎯 Design Decisions

### 1. **Next.js App Router Architecture**
- **Decision**: Used Next.js 15 with App Router for modern React patterns
- **Rationale**: Provides excellent developer experience, built-in API routes, and optimal performance
- **Benefits**: Server-side rendering, automatic code splitting, and simplified routing

### 2. **OAuth 2.0 Implementation**
- **Decision**: Implemented server-side OAuth flow with client-side token storage
- **Rationale**: More secure than client-side OAuth, prevents token exposure in URLs
- **Implementation**: Authorization code flow with PKCE would be more secure for production

### 3. **React Query for Data Management**
- **Decision**: Used TanStack Query for calendar events fetching
- **Rationale**: Provides automatic caching, background updates, and error handling
- **Configuration**: 30-second polling interval for real-time updates

### 4. **TypeScript Throughout**
- **Decision**: Full TypeScript implementation with strict typing
- **Rationale**: Catches errors at compile time, improves developer experience
- **Benefits**: Better IDE support, self-documenting code, safer refactoring

### 5. **Component Architecture**
- **Decision**: Modular component structure with custom hooks
- **Rationale**: Separation of concerns, reusability, and testability
- **Pattern**: Custom hooks for business logic, presentational components for UI

### 6. **Error Handling Strategy**
- **Decision**: Comprehensive error boundaries and user-friendly error messages
- **Rationale**: Better user experience and easier debugging
- **Implementation**: Try-catch blocks with meaningful error messages

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
- **Current**: No rate limiting implementation
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
5. **Advanced Filtering**: Date range, calendar selection, and search
6. **Mobile App**: React Native or PWA implementation
7. **Analytics**: Event analytics and usage insights
8. **Notifications**: Browser notifications for upcoming events

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
WEBHOOK_URL=https://yourdomain.com/api/webhook
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
