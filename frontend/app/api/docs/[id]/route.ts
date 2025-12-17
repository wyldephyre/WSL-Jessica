/**
 * Google Docs API (Single Document)
 * Get or update a specific Google Doc
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { getDocument, updateDocumentTitle } from '@/lib/api/google-docs';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/errors/AppError';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/docs/[id]
 * Get a Google Doc
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const documentId = params.id;

    if (!documentId) {
      throw new ValidationError('Document ID is required');
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

    // Get document
    const document = await getDocument(accessToken, documentId);

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/docs/[id]
 * Update a Google Doc (currently only supports title update)
 * Body: { title?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(request);
    const documentId = params.id;
    const body = await request.json();
    const { title } = body;

    if (!documentId) {
      throw new ValidationError('Document ID is required');
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

    // Update document (currently only title)
    if (title) {
      await updateDocumentTitle(accessToken, documentId, title);
    }

    // Get updated document
    const document = await getDocument(accessToken, documentId);

    return NextResponse.json({
      success: true,
      document,
      message: 'Document updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

