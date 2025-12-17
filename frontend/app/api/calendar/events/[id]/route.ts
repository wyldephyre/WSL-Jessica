/**
 * Calendar Event API (Single Event)
 * Get, update, or delete a specific calendar event
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { getCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/api/google-calendar';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';
import type { EventCreateRequest } from '@/lib/types/event';

/**
 * GET /api/calendar/events/[id]
 * Get a single calendar event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const eventId = params.id;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Get token and calendar ID
    const tokensRef = collection(db, 'oauth_tokens');
    const q = query(
      tokensRef,
      where('userId', '==', userId),
      where('provider', '==', 'google')
    );

    const docs = await getDocs(q);

    if (docs.empty) {
      throw new AuthenticationError('Google Calendar is not connected. Please connect it first.');
    }

    const tokenDoc = docs.docs[0].data();
    const calendarId = tokenDoc.calendarId || 'primary';

    // Get valid access token
    const accessToken = await getValidGoogleToken(userId);

    // Get event
    const event = await getCalendarEvent(accessToken, eventId, calendarId);

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/calendar/events/[id]
 * Update a calendar event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const eventId = params.id;
    const body = await request.json() as Partial<EventCreateRequest>;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Get token and calendar ID
    const tokensRef = collection(db, 'oauth_tokens');
    const q = query(
      tokensRef,
      where('userId', '==', userId),
      where('provider', '==', 'google')
    );

    const docs = await getDocs(q);

    if (docs.empty) {
      throw new AuthenticationError('Google Calendar is not connected. Please connect it first.');
    }

    const tokenDoc = docs.docs[0].data();
    const calendarId = tokenDoc.calendarId || 'primary';

    // Get valid access token
    const accessToken = await getValidGoogleToken(userId);

    // Update event
    const updatedEvent = await updateCalendarEvent(accessToken, eventId, body, calendarId);

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/calendar/events/[id]
 * Delete a calendar event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const eventId = params.id;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Get token and calendar ID
    const tokensRef = collection(db, 'oauth_tokens');
    const q = query(
      tokensRef,
      where('userId', '==', userId),
      where('provider', '==', 'google')
    );

    const docs = await getDocs(q);

    if (docs.empty) {
      throw new AuthenticationError('Google Calendar is not connected. Please connect it first.');
    }

    const tokenDoc = docs.docs[0].data();
    const calendarId = tokenDoc.calendarId || 'primary';

    // Get valid access token
    const accessToken = await getValidGoogleToken(userId);

    // Delete event
    await deleteCalendarEvent(accessToken, eventId, calendarId);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

