import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';

/**
 * POST /api/memory/add - Add a new memory via backend memory server
 * 
 * This route proxies memory storage requests to the local ChromaDB memory server
 * running on port 5001.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, context = 'personal', metadata } = body;

    if (!content || typeof content !== 'string') {
      throw new ValidationError('Content is required');
    }

    // Get user ID from header (set by memoryService.ts)
    const userId = req.headers.get('X-User-ID') || 'PhyreBug';

    // Call local memory server (ChromaDB) on port 5001
    const memoryServerUrl = 'http://localhost:5001';
    
    // Generate a unique memory ID (backend requires this)
    const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const response = await fetch(`${memoryServerUrl}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: memoryId,
          text: content,
          collection: context || 'conversations',
          metadata: {
            ...metadata,
            user_id: userId,
            context: context || 'personal',
            created_at: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Memory server error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Transform memory server response to frontend format
      return NextResponse.json({
        id: data.id || memoryId,
        content,
        user_id: userId,
        context: context || 'personal',
        metadata: {
          ...metadata,
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });
    } catch (fetchError) {
      console.error('[Memory Add] Memory server unavailable:', fetchError);
      throw new Error('Memory server unavailable');
    }
  } catch (error) {
    return handleApiError(error);
  }
}

