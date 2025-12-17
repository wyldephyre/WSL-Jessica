/**
 * Google OAuth Authorization Endpoint
 * Initiates OAuth flow by redirecting to Google consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';
import { getGoogleScopes } from '@/lib/api/google-oauth';

/**
 * GET /api/auth/google
 * Redirects user to Google OAuth consent screen
 * Query params:
 *   - services: comma-separated list of services (calendar, gmail, docs) or 'all'
 *   - calendarType: optional calendar type (personal, work, public)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const servicesParam = searchParams.get('services') || 'all';
    const calendarType = searchParams.get('calendarType');

    // Determine which services to request
    let services: string[];
    if (servicesParam === 'all') {
      services = ['calendar', 'gmail', 'docs'];
    } else {
      services = servicesParam.split(',').map(s => s.trim());
    }

    // Get OAuth scopes
    const scopes = getGoogleScopes(services);

    if (scopes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid services specified. Use: calendar, gmail, docs, or all' },
        { status: 400 }
      );
    }

    // Generate state parameter for security (include calendarType if provided)
    const state = calendarType 
      ? Buffer.from(JSON.stringify({ calendarType })).toString('base64')
      : Buffer.from(JSON.stringify({})).toString('base64');

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to get refresh token
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Redirect to Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Google OAuth] Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

