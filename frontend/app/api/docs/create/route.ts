/**
 * Google Docs Create API
 * Create a new Google Doc
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { createDocument } from '@/lib/api/google-docs';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * POST /api/docs/create
 * Create a new Google Doc
 * Body: { title: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      throw new ValidationError('Document title is required');
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

    // Create document
    const document = await createDocument(accessToken, title);

    return NextResponse.json({
      success: true,
      document,
      message: 'Document created successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

