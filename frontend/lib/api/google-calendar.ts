import { CalendarEvent, EventCreateRequest } from '@/lib/types/event';

/**
 * Create a calendar event
 * This is a placeholder - full implementation would use Google Calendar API
 */
export async function createCalendarEvent(
  event: EventCreateRequest,
  accessToken?: string,
  calendarId?: string
): Promise<CalendarEvent> {
  // TODO: Implement Google Calendar API integration
  // For now, return the event data as-is
  return {
    ...event,
    // Preserve calendar target for debugging/UX if provided
    ...(calendarId ? { calendarId } : {}),
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
  };
}

