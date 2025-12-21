import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/AppError';

/**
 * GET /api/memory/all - Get all memories for a user
 * 
 * This route retrieves all memories from the local ChromaDB memory server.
 * Note: ChromaDB doesn't have a direct "get all" endpoint, so we return empty
 * results. In practice, memories are retrieved via search queries.
 */
export async function GET(req: NextRequest) {
  try {
    // Get user ID and context from headers
    const userId = req.headers.get('X-User-ID') || 'PhyreBug';
    const context = req.headers.get('X-Context') || 'personal';

    // ChromaDB memory server doesn't have a "get all" endpoint
    // Memories are retrieved via search. Return empty array for now.
    // If needed, we could implement a workaround by searching with a very broad query.
    
    return NextResponse.json({
      results: [],
      message: 'Use /api/memory/search to retrieve memories',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

