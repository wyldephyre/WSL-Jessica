/**
 * Google Docs Append API
 * Append text to a Google Doc
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { appendTextToDocument, getDocument } from '@/lib/api/google-docs';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * POST /api/docs/[id]/append
 * Append text to a Google Doc
 * Body: { text: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const documentId = params.id;
    const body = await request.json();
    const { text } = body;

    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    if (!text || typeof text !== 'string') {
      throw new ValidationError('Text content is required');
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

    // Append text
    await appendTextToDocument(accessToken, documentId, text);

    // Get updated document
    const document = await getDocument(accessToken, documentId);

    return NextResponse.json({
      success: true,
      document,
      message: 'Text appended successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

