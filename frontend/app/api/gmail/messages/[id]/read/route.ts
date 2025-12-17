/**
 * Gmail Message Read API
 * Mark a Gmail message as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { markGmailMessageAsRead } from '@/lib/api/google-gmail';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * POST /api/gmail/messages/[id]/read
 * Mark a Gmail message as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const messageId = params.id;

    if (!messageId) {
      throw new ValidationError('Message ID is required');
    }

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

    // Mark as read
    await markGmailMessageAsRead(accessToken, messageId);

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

