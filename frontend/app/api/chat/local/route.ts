import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';

/**
 * Proxy route for local provider (Jessica Core backend)
 * This runs server-side in WSL, so localhost:8000 works correctly
 */
export async function POST(req: NextRequest) {
  try {
    const { message, provider = 'local', mode = 'default' } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    // Get backend URL from environment (defaults to localhost:8000)
    // This works because Next.js API routes run server-side in WSL
    const backendUrl = env.API_URL || 'http://localhost:8000';
    const backendEndpoint = `${backendUrl}/chat`;

    // Proxy request to Jessica Core backend
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        provider,
        mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      content: data.response || '',
      provider: 'local',
      routing: data.routing,
      request_id: data.request_id,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

