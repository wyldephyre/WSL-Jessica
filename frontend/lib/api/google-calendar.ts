/**
 * Google Calendar API Client
 * Full implementation using Google Calendar API v3
 */

import { calendar } from 'googleapis';
import { CalendarEvent, EventCreateRequest } from '@/lib/types/event';
import { getValidGoogleToken } from './google-oauth';

export interface CalendarListParams {
  timeMin?: string; // ISO 8601
  timeMax?: string; // ISO 8601
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}

/**
 * Create a calendar event using Google Calendar API
 */
export async function createCalendarEvent(
  event: EventCreateRequest,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const auth = {
    access_token: accessToken,
  };

  const calendarClient = calendar({
    version: 'v3',
    auth,
  });

  // Convert event data to Google Calendar format
  const googleEvent = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: event.attendees?.map(email => ({ email })),
  };

  const response = await calendarClient.events.insert({
    calendarId,
    requestBody: googleEvent,
  });

  if (!response.data) {
    throw new Error('Failed to create calendar event');
  }

  const createdEvent = response.data;

  return {
    id: createdEvent.id || undefined,
    title: createdEvent.summary || event.title,
    description: createdEvent.description || event.description,
    startTime: createdEvent.start?.dateTime || createdEvent.start?.date || event.startTime,
    endTime: createdEvent.end?.dateTime || createdEvent.end?.date || event.endTime,
    location: createdEvent.location || event.location,
    attendees: createdEvent.attendees?.map(a => a.email || '').filter(Boolean) || event.attendees,
    calendarId,
    calendarType: 'google',
    metadata: {
      googleEventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink,
      iCalUID: createdEvent.iCalUID,
    },
  };
}

/**
 * List calendar events
 */
export async function listCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  params: CalendarListParams = {}
): Promise<CalendarEvent[]> {
  const auth = {
    access_token: accessToken,
  };

  const calendarClient = calendar({
    version: 'v3',
    auth,
  });

  const response = await calendarClient.events.list({
    calendarId,
    timeMin: params.timeMin || new Date().toISOString(),
    timeMax: params.timeMax,
    maxResults: params.maxResults || 10,
    singleEvents: params.singleEvents !== false,
    orderBy: params.orderBy || 'startTime',
  });

  if (!response.data.items) {
    return [];
  }

  return response.data.items.map(item => ({
    id: item.id,
    title: item.summary || 'Untitled Event',
    description: item.description,
    startTime: item.start?.dateTime || item.start?.date || new Date().toISOString(),
    endTime: item.end?.dateTime || item.end?.date || new Date().toISOString(),
    location: item.location,
    attendees: item.attendees?.map(a => a.email || '').filter(Boolean),
    calendarId,
    calendarType: 'google',
    metadata: {
      googleEventId: item.id,
      htmlLink: item.htmlLink,
      iCalUID: item.iCalUID,
      status: item.status,
    },
  }));
}

/**
 * Get a single calendar event by ID
 */
export async function getCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const auth = {
    access_token: accessToken,
  };

  const calendarClient = calendar({
    version: 'v3',
    auth,
  });

  const response = await calendarClient.events.get({
    calendarId,
    eventId,
  });

  if (!response.data) {
    throw new Error('Event not found');
  }

  const event = response.data;

  return {
    id: event.id,
    title: event.summary || 'Untitled Event',
    description: event.description,
    startTime: event.start?.dateTime || event.start?.date || new Date().toISOString(),
    endTime: event.end?.dateTime || event.end?.date || new Date().toISOString(),
    location: event.location,
    attendees: event.attendees?.map(a => a.email || '').filter(Boolean),
    calendarId,
    calendarType: 'google',
    metadata: {
      googleEventId: event.id,
      htmlLink: event.htmlLink,
      iCalUID: event.iCalUID,
      status: event.status,
    },
  };
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<EventCreateRequest>,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const auth = {
    access_token: accessToken,
  };

  const calendarClient = calendar({
    version: 'v3',
    auth,
  });

  // Get existing event first
  const existingEvent = await calendarClient.events.get({
    calendarId,
    eventId,
  });

  if (!existingEvent.data) {
    throw new Error('Event not found');
  }

  // Merge updates
  const googleEvent = {
    ...existingEvent.data,
    summary: updates.title || existingEvent.data.summary,
    description: updates.description !== undefined ? updates.description : existingEvent.data.description,
    location: updates.location !== undefined ? updates.location : existingEvent.data.location,
    start: updates.startTime ? {
      dateTime: updates.startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } : existingEvent.data.start,
    end: updates.endTime ? {
      dateTime: updates.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } : existingEvent.data.end,
    attendees: updates.attendees?.map(email => ({ email })) || existingEvent.data.attendees,
  };

  const response = await calendarClient.events.update({
    calendarId,
    eventId,
    requestBody: googleEvent,
  });

  if (!response.data) {
    throw new Error('Failed to update calendar event');
  }

  const updatedEvent = response.data;

  return {
    id: updatedEvent.id || eventId,
    title: updatedEvent.summary || 'Untitled Event',
    description: updatedEvent.description,
    startTime: updatedEvent.start?.dateTime || updatedEvent.start?.date || new Date().toISOString(),
    endTime: updatedEvent.end?.dateTime || updatedEvent.end?.date || new Date().toISOString(),
    location: updatedEvent.location,
    attendees: updatedEvent.attendees?.map(a => a.email || '').filter(Boolean),
    calendarId,
    calendarType: 'google',
    metadata: {
      googleEventId: updatedEvent.id,
      htmlLink: updatedEvent.htmlLink,
      iCalUID: updatedEvent.iCalUID,
      status: updatedEvent.status,
    },
  };
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const auth = {
    access_token: accessToken,
  };

  const calendarClient = calendar({
    version: 'v3',
    auth,
  });

  await calendarClient.events.delete({
    calendarId,
    eventId,
  });
}
