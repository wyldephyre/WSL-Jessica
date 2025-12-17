/**
 * Calendar Events API
 * List upcoming calendar events
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { listCalendarEvents, CalendarListParams } from '@/lib/api/google-calendar';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';
import type { CalendarType } from '@/lib/types/calendar';

/**
 * GET /api/calendar/events
 * List upcoming calendar events
 * Query params:
 *   - timeMin: ISO 8601 datetime (default: now)
 *   - timeMax: ISO 8601 datetime
 *   - maxResults: number (default: 10)
 *   - calendarType: personal, work, public
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    
    const calendarType = searchParams.get('calendarType') as CalendarType | null;
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;
    const maxResults = searchParams.get('maxResults') 
      ? parseInt(searchParams.get('maxResults')!, 10)
      : undefined;

    // Get token and calendar ID
    const tokensRef = collection(db, 'oauth_tokens');
    let q;
    
    if (calendarType) {
      q = query(
        tokensRef,
        where('userId', '==', userId),
        where('provider', '==', 'google'),
        where('calendarType', '==', calendarType)
      );
    } else {
      q = query(
        tokensRef,
        where('userId', '==', userId),
        where('provider', '==', 'google')
      );
    }

    const docs = await getDocs(q);

    if (docs.empty) {
      throw new AuthenticationError('Google Calendar is not connected. Please connect it first.');
    }

    const tokenDoc = docs.docs[0].data();
    const calendarId = tokenDoc.calendarId || 'primary';

    // Get valid access token (refresh if needed)
    const accessToken = await getValidGoogleToken(userId, calendarType || undefined);

    // Build list params
    const listParams: CalendarListParams = {
      timeMin,
      timeMax,
      maxResults: maxResults || 10,
      singleEvents: true,
      orderBy: 'startTime',
    };

    // List events
    const events = await listCalendarEvents(accessToken, calendarId, listParams);

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

