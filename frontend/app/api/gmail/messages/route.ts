/**
 * Gmail Messages API
 * List Gmail messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { listGmailMessages, GmailListParams } from '@/lib/api/google-gmail';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/gmail/messages
 * List Gmail messages
 * Query params:
 *   - query: Gmail search query (e.g., "is:unread", "from:example@gmail.com")
 *   - maxResults: number (default: 10)
 *   - pageToken: pagination token
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;

    const gmailQuery = searchParams.get('query') || undefined;
    const maxResults = searchParams.get('maxResults')
      ? parseInt(searchParams.get('maxResults')!, 10)
      : undefined;
    const pageToken = searchParams.get('pageToken') || undefined;

    // Get token
    const tokensRef = collection(db, 'oauth_tokens');
    const q = query(
      tokensRef,
      where('userId', '==', userId),
      where('provider', '==', 'google')
    );

    const docs = await getDocs(q);

    if (docs.empty) {
      throw new AuthenticationError('Google account is not connected. Please connect it first.');
    }

    // Get valid access token
    const accessToken = await getValidGoogleToken(userId);

    // Build list params
    const listParams: GmailListParams = {
      query: gmailQuery,
      maxResults: maxResults || 10,
      pageToken,
    };

    // List messages
    const result = await listGmailMessages(accessToken, listParams);

    return NextResponse.json({
      success: true,
      messages: result.messages,
      count: result.messages.length,
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

