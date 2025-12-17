/**
 * Google OAuth token management and refresh utilities
 */

import { env } from '@/lib/config/env';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export interface GoogleTokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

/**
 * Refresh a Google OAuth access token using the refresh token
 */
export async function refreshGoogleToken(
  userId: string,
  refreshToken: string
): Promise<GoogleTokenData> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in * 1000);

  // Update token in Firestore
  const tokensRef = collection(db, 'oauth_tokens');
  const q = query(
    tokensRef,
    where('userId', '==', userId),
    where('provider', '==', 'google')
  );
  const docs = await getDocs(q);

  if (!docs.empty) {
    const tokenDoc = docs.docs[0];
    await updateDoc(doc(db, 'oauth_tokens', tokenDoc.id), {
      access_token: data.access_token,
      expires_at: expiresAt,
      expires_in: data.expires_in,
      updatedAt: new Date(),
    });
  }

  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Refresh token doesn't change
    expires_at: expiresAt,
    expires_in: data.expires_in,
  };
}

/**
 * Get a valid Google access token, refreshing if necessary
 */
export async function getValidGoogleToken(
  userId: string,
  calendarType?: string
): Promise<string> {
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
    throw new Error('No Google token found. Please authenticate first.');
  }

  const tokenDoc = docs.docs[0].data();
  const accessToken = tokenDoc.access_token as string;
  const refreshToken = tokenDoc.refresh_token as string;
  const expiresAt = tokenDoc.expires_at as number;

  // Check if token is expired (with 5 minute buffer)
  if (expiresAt && Date.now() > expiresAt - 300000) {
    if (!refreshToken) {
      throw new Error('Token expired and no refresh token available. Please re-authenticate.');
    }

    // Refresh the token
    const refreshed = await refreshGoogleToken(userId, refreshToken);
    return refreshed.access_token;
  }

  return accessToken;
}

/**
 * Get required OAuth scopes for Google Workspace services
 */
export function getGoogleScopes(services: string[] = ['calendar', 'gmail', 'docs']): string[] {
  const scopeMap: Record<string, string> = {
    calendar: 'https://www.googleapis.com/auth/calendar',
    gmail: 'https://www.googleapis.com/auth/gmail.readonly',
    docs: 'https://www.googleapis.com/auth/documents',
  };

  return services.map(service => scopeMap[service] || '').filter(Boolean);
}

