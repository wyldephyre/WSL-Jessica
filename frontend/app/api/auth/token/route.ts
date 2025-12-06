/**
 * Secure Token Storage API
 * Stores OAuth tokens server-side in Firestore instead of localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { getUserId } from '@/lib/middleware/auth';

/**
 * POST /api/auth/token
 * Store OAuth token securely in Firestore
 * Supports multiple calendars via calendarType parameter
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const { 
      access_token, 
      refresh_token, 
      expires_at, 
      expires_in, 
      provider = 'google',
      calendarType,
      calendarId,
      calendarName
    } = body;

    if (!access_token) {
      throw new ValidationError('access_token is required');
    }

    console.log('[Token API] Storing token for userId:', userId, 'calendarType:', calendarType);

    // Initialize Firestore collection - this will trigger lazy initialization
    let tokensRef;
    try {
      tokensRef = collection(db, 'oauth_tokens');
      console.log('[Token API] Firestore collection initialized successfully');
    } catch (error) {
      console.error('[Token API] Error accessing Firestore:', error);
      throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // If calendarType is provided, check for existing token with same calendarType
    if (calendarType) {
      let q;
      try {
        q = query(
          tokensRef, 
          where('userId', '==', userId), 
          where('provider', '==', provider),
          where('calendarType', '==', calendarType)
        );
        console.log('[Token API] Query created for calendarType:', calendarType);
      } catch (error) {
        console.error('[Token API] Error creating query:', error);
        throw new Error(`Failed to create Firestore query: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      let existingDocs;
      try {
        existingDocs = await getDocs(q);
        console.log('[Token API] Query executed, found', existingDocs.size, 'existing tokens');
      } catch (error) {
        console.error('[Token API] Error executing query:', error);
        throw new Error(`Failed to query Firestore: ${error instanceof Error ? error.message : String(error)}`);
      }

      interface TokenDocumentData {
        userId: string;
        provider: string;
        calendarType?: string | null;
        access_token: string;
        refresh_token: string | null;
        expires_at: number;
        expires_in: number;
        updatedAt: Date;
        calendarId?: string;
        calendarName?: string;
        [key: string]: unknown;
      }
      
      const tokenData: TokenDocumentData = {
        userId,
        provider,
        calendarType: calendarType || null,
        access_token,
        refresh_token: refresh_token || null,
        expires_at: expires_at || Date.now() + (expires_in * 1000),
        expires_in: expires_in || 3600,
        updatedAt: new Date(),
      };

      // Add calendar-specific fields if provided
      if (calendarId) {
        tokenData.calendarId = calendarId;
      }
      if (calendarName) {
        tokenData.calendarName = calendarName;
      }

      if (!existingDocs.empty) {
        // Update existing token for this calendar type
        const docRef = doc(db, 'oauth_tokens', existingDocs.docs[0].id);
        await updateDoc(docRef, tokenData);
      } else {
        // Create new token for this calendar type
        await addDoc(tokensRef, {
          ...tokenData,
          createdAt: new Date(),
        });
      }
    } else {
      // Legacy behavior: update/create single token (backward compatibility)
      console.log('[Token API] Using legacy path (no calendarType)');
      let q;
      try {
        q = query(tokensRef, where('userId', '==', userId), where('provider', '==', provider));
        console.log('[Token API] Legacy query created');
      } catch (error) {
        console.error('[Token API] Error creating legacy query:', error);
        throw new Error(`Failed to create Firestore query: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      let existingDocs;
      try {
        existingDocs = await getDocs(q);
        console.log('[Token API] Legacy query executed, found', existingDocs.size, 'existing tokens');
      } catch (error) {
        console.error('[Token API] Error executing legacy query:', error);
        throw new Error(`Failed to query Firestore: ${error instanceof Error ? error.message : String(error)}`);
      }

      interface TokenDocumentData {
        userId: string;
        provider: string;
        calendarType?: string | null;
        access_token: string;
        refresh_token: string | null;
        expires_at: number;
        expires_in: number;
        updatedAt: Date;
        calendarId?: string;
        calendarName?: string;
        [key: string]: unknown;
      }
      
      const tokenData: TokenDocumentData = {
        userId,
        provider,
        access_token,
        refresh_token: refresh_token || null,
        expires_at: expires_at || Date.now() + (expires_in * 1000),
        expires_in: expires_in || 3600,
        updatedAt: new Date(),
      };

      if (!existingDocs.empty) {
        const docRef = doc(db, 'oauth_tokens', existingDocs.docs[0].id);
        await updateDoc(docRef, tokenData);
      } else {
        await addDoc(tokensRef, {
          ...tokenData,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Token stored securely',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/auth/token
 * Retrieve OAuth token for current user
 * Supports calendarType parameter for multi-calendar support
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const provider = request.nextUrl.searchParams.get('provider') || 'google';
    const calendarType = request.nextUrl.searchParams.get('calendarType');
    const listAll = request.nextUrl.searchParams.get('list') === 'calendars';

    const tokensRef = collection(db, 'oauth_tokens');
    
    // If listing all calendars
    if (listAll) {
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
    }

    // Get specific calendar token
    let q;
    if (calendarType) {
      q = query(
        tokensRef, 
        where('userId', '==', userId), 
        where('provider', '==', provider),
        where('calendarType', '==', calendarType)
      );
    } else {
      // Legacy: get first token (backward compatibility)
      q = query(tokensRef, where('userId', '==', userId), where('provider', '==', provider));
    }
    
    const docs = await getDocs(q);

    if (docs.empty) {
      return NextResponse.json({
        success: false,
        token: null,
      });
    }

    const tokenDoc = docs.docs[0].data();
    
    // Check if token is expired
    if (tokenDoc.expires_at && Date.now() > tokenDoc.expires_at - 300000) {
      return NextResponse.json({
        success: false,
        token: null,
        expired: true,
      });
    }

    return NextResponse.json({
      success: true,
      token: tokenDoc.access_token,
      refresh_token: tokenDoc.refresh_token,
      expires_at: tokenDoc.expires_at,
      calendarType: tokenDoc.calendarType || null,
      calendarId: tokenDoc.calendarId || 'primary',
      calendarName: tokenDoc.calendarName || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/auth/token
 * Revoke and delete OAuth token
 * Supports calendarType parameter for multi-calendar support
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const provider = request.nextUrl.searchParams.get('provider') || 'google';
    const calendarType = request.nextUrl.searchParams.get('calendarType');

    const tokensRef = collection(db, 'oauth_tokens');
    
    let q;
    if (calendarType) {
      // Delete specific calendar type
      q = query(
        tokensRef, 
        where('userId', '==', userId), 
        where('provider', '==', provider),
        where('calendarType', '==', calendarType)
      );
    } else {
      // Legacy: delete first token (backward compatibility)
      q = query(tokensRef, where('userId', '==', userId), where('provider', '==', provider));
    }
    
    const docs = await getDocs(q);

    if (!docs.empty) {
      // Revoke token with provider
      const tokenDoc = docs.docs[0].data();
      if (tokenDoc.access_token && provider === 'google') {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenDoc.access_token}`, {
            method: 'POST',
          });
        } catch (e) {
          // Continue even if revocation fails
          console.error('Token revocation failed:', e);
        }
      }

      // Mark as revoked in Firestore
      await updateDoc(doc(db, 'oauth_tokens', docs.docs[0].id), {
        revoked: true,
        revokedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Token revoked and deleted',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

