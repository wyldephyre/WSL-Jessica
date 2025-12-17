/**
 * Google OAuth Callback Handler
 * Handles authorization code exchange and token storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';
import { getUserId } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors/AppError';

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback from Google
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      console.error('[Google OAuth Callback] Error:', error);
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/integrations?error=no_code', request.url)
      );
    }

    // Parse state to get calendarType if provided
    let calendarType: string | undefined;
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        calendarType = stateData.calendarType;
      } catch (e) {
        console.warn('[Google OAuth Callback] Failed to parse state:', e);
      }
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('[Google OAuth Callback] Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(`/integrations?error=token_exchange_failed`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);

    // Get user ID (may fail in single-user mode, use fallback)
    let userId: string;
    try {
      userId = await getUserId(request);
    } catch (authError) {
      // Single-user mode fallback
      userId = 'PhyreBug';
    }

    // Get user info to determine calendar ID and name
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    let calendarId = 'primary';
    let calendarName = 'Primary Calendar';

    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      calendarName = `${userInfo.email || 'User'}'s Calendar`;
    }

    // Get list of calendars to find the primary one
    try {
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (calendarsResponse.ok) {
        const calendarsData = await calendarsResponse.json();
        const primaryCalendar = calendarsData.items?.find((cal: any) => cal.primary);
        if (primaryCalendar) {
          calendarId = primaryCalendar.id;
          calendarName = primaryCalendar.summary || calendarName;
        }
      }
    } catch (e) {
      console.warn('[Google OAuth Callback] Failed to fetch calendar list:', e);
    }

    // Store token in Firestore via existing token API
    const storeTokenResponse = await fetch(
      new URL('/api/auth/token', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          expires_in: tokenData.expires_in,
          provider: 'google',
          calendarType,
          calendarId,
          calendarName,
        }),
      }
    );

    if (!storeTokenResponse.ok) {
      console.error('[Google OAuth Callback] Failed to store token');
      return NextResponse.redirect(
        new URL('/integrations?error=token_storage_failed', request.url)
      );
    }

    // Redirect to integrations page with success
    const redirectUrl = new URL('/integrations', request.url);
    redirectUrl.searchParams.set('success', 'google_connected');
    if (calendarType) {
      redirectUrl.searchParams.set('calendarType', calendarType);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('[Google OAuth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=unexpected_error', request.url)
    );
  }
}

