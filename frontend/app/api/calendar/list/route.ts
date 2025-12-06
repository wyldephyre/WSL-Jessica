/**
 * Calendar List API
 * Lists all connected calendars for the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleApiError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/calendar/list
 * List all connected calendars for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(request);
    const provider = 'google';

    const tokensRef = collection(db, 'oauth_tokens');
    const q = query(tokensRef, where('userId', '==', userId), where('provider', '==', provider));
    const docs = await getDocs(q);
    
    const calendars = docs.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        calendarType: data.calendarType || null,
        googleCalendarId: data.calendarId || 'primary',
        calendarName: data.calendarName || 'Primary Calendar',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        connectedAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        isActive: !data.revoked && (!data.expires_at || Date.now() < data.expires_at - 300000),
      };
    });

    return NextResponse.json({
      success: true,
      calendars,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

