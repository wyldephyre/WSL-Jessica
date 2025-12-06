/**
 * Event type definitions
 */

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  attendees?: string[];
  calendarId?: string;
  calendarType?: 'google' | 'outlook' | 'other';
  metadata?: Record<string, any>;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  location?: string;
  attendees?: string[];
  calendarId?: string;
}

