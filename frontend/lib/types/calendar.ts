/**
 * Calendar-related TypeScript types
 */

export type CalendarType = 'personal' | 'work' | 'public';

export interface ConnectedCalendar {
  id: string; // Firestore document ID
  calendarType: CalendarType;
  googleCalendarId: string; // Google Calendar API calendar ID
  calendarName: string; // Display name
  accessToken: string; // OAuth token for this calendar
  refreshToken?: string | null;
  connectedAt: Date | string;
  isActive: boolean;
  userId?: string;
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  description?: string;
  accessRole: 'owner' | 'reader' | 'writer' | 'freeBusyReader';
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

