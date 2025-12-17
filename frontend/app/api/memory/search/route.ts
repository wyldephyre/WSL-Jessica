import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { env } from '@/lib/config/env';

/**
 * POST /api/memory/search - Search local memories via backend memory server
 * 
 * This route proxies search requests to the local ChromaDB memory server
 * running on port 5001, then formats the response for the frontend.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, limit = 10, context } = body;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required');
    }

    // Get user ID from header (set by memoryService.ts)
    const userId = req.headers.get('X-User-ID') || 'PhyreBug';

    // Call local memory server (ChromaDB) on port 5001
    const memoryServerUrl = 'http://localhost:5001';
    
    try {
      const response = await fetch(`${memoryServerUrl}/recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          n: Math.min(limit, 10), // Memory server caps at 10
          collection: context || 'conversations',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Memory server error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'memory/search/route.ts:44','message':'Memory server response received','data':{hasDocuments:!!data.documents,documentsType:typeof data.documents,isArray:Array.isArray(data.documents),documentsLength:data.documents?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Transform memory server response to frontend format
      // Memory server returns: { documents: ["doc1", "doc2", ...] } (documents is already an array)
      // Frontend expects: { results: [{ memory: string, ... }] }
      const documents = Array.isArray(data.documents) ? data.documents : [];
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'memory/search/route.ts:50','message':'Documents extracted','data':{documentsLength:documents.length,firstDocType:typeof documents[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const results = documents.map((doc: string, index: number) => ({
        memory: doc,
        id: `local-${Date.now()}-${index}`,
        user_id: userId,
        context: context || 'personal',
        created_at: new Date().toISOString(),
      }));

      return NextResponse.json({
        results,
      });
    } catch (fetchError) {
      // If memory server is unavailable, return empty results (non-blocking)
      console.error('[Memory Search] Memory server unavailable:', fetchError);
      return NextResponse.json({
        results: [],
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

