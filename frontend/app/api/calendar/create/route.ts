import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { createCalendarEvent } from '@/lib/api/google-calendar';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, ValidationError, AuthenticationError, ExternalServiceError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';
import type { EventCreateRequest } from '@/lib/types/event';
import type { CalendarType } from '@/lib/types/calendar';

interface CreateCalendarEventRequestBody {
  eventData: EventCreateRequest;
  accessToken?: string;
  calendarId?: string;
  calendarType?: CalendarType;
}

interface TokenDocument {
  access_token: string;
  expires_at?: number;
  calendarId?: string;
  [key: string]: unknown;
}

interface GoogleCalendarError extends Error {
  message: string;
}

// Create calendar event endpoint
// Accepts event data from Firestore and creates event in Google Calendar
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(request);
    
    const body = (await request.json()) as CreateCalendarEventRequestBody;
    const { eventData, accessToken, calendarId, calendarType } = body;

    if (!eventData) {
      throw new ValidationError('Event data is required');
    }

    if (!eventData.title) {
      throw new ValidationError('Event title is required');
    }

    // Resolve calendar ID from calendarType if provided
    let resolvedCalendarId = calendarId || 'primary';
    let resolvedAccessToken = accessToken;

    if (calendarType && !calendarId) {
      // Get token and calendar ID for the specified calendar type from Firestore
      try {
        const tokensRef = collection(db, 'oauth_tokens');
        const q = query(
          tokensRef, 
          where('userId', '==', userId), 
          where('provider', '==', 'google'),
          where('calendarType', '==', calendarType)
        );
        const docs = await getDocs(q);

        if (docs.empty) {
          throw new AuthenticationError(
            `Calendar type '${calendarType}' is not connected. Please connect it first.`
          );
        }

        const tokenDoc = docs.docs[0].data() as TokenDocument;
        
        // Check if token is expired
        if (tokenDoc.expires_at && Date.now() > tokenDoc.expires_at - 300000) {
          throw new AuthenticationError(
            `Calendar token for '${calendarType}' has expired. Please reconnect your calendar.`
          );
        }

        resolvedAccessToken = tokenDoc.access_token;
        resolvedCalendarId = tokenDoc.calendarId || 'primary';
      } catch (error) {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new AuthenticationError(
          `Failed to get calendar token for type '${calendarType}'. Please reconnect your calendar.`
        );
      }
    }

    // Get valid token (refresh if needed)
    if (!resolvedAccessToken) {
      try {
        resolvedAccessToken = await getValidGoogleToken(userId, calendarType || undefined);
      } catch (tokenError) {
        throw new AuthenticationError('Access token is required. Please authenticate with Google.');
      }
    } else {
      // Validate and refresh token if needed (use provided token if refresh fails)
      try {
        resolvedAccessToken = await getValidGoogleToken(userId, calendarType || undefined);
      } catch (tokenError) {
        // If token refresh fails but we have an accessToken, try using it
        // (it might still be valid - will fail gracefully if not)
      }
    }

    // Create event in Google Calendar
    const createdEvent = await createCalendarEvent(
      eventData,
      resolvedAccessToken,
      resolvedCalendarId
    );

    return NextResponse.json({
      success: true,
      event: createdEvent,
      calendarId: resolvedCalendarId,
      calendarType: calendarType || null,
      message: 'Event created successfully in Google Calendar',
    });
  } catch (error) {
    // Use unified error handling
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return handleApiError(error);
    }

    // Handle specific Google Calendar errors
    const googleError = error as GoogleCalendarError;
    if (googleError.message?.includes('Invalid Credentials')) {
      return handleApiError(new AuthenticationError('Authentication expired. Please reconnect your Google account.'));
    } else if (googleError.message?.includes('insufficient permission')) {
      return handleApiError(new ExternalServiceError('Google Calendar', 'Insufficient permissions. Please grant calendar access.'));
    }

    // Fallback to generic error handling
    return handleApiError(error);
  }
}

