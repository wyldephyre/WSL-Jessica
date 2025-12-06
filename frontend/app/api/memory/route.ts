import { NextRequest, NextResponse } from 'next/server';
import {
  searchMemories,
  addMemory,
  updateMemory,
  deleteMemory,
  getAllMemories,
} from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/memory - Search or retrieve memories
 */
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const context = searchParams.get('context') as MemoryContext | null;
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query) {
      // Search memories
      const results = await searchMemories(query, {
        user_id: userId,
        context: context || undefined,
        limit,
      });

      return NextResponse.json({
        success: true,
        memories: results,
      });
    } else {
      // Get all memories
      const memories = await getAllMemories(userId, context || undefined);

      return NextResponse.json({
        success: true,
        memories,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/memory - Add a new memory
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    
    const { content, context = 'personal' as MemoryContext, metadata } = await req.json();

    if (!content || typeof content !== 'string') {
      throw new ValidationError('Content is required');
    }

    const memory = await addMemory({
      content,
        user_id: userId,
      context,
      metadata,
    });

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/memory - Update an existing memory
 */
export async function PUT(req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    
    const { id, content, metadata } = await req.json();

    if (!id || !content) {
      throw new ValidationError('Memory ID and content are required');
    }

    const memory = await updateMemory(id, content, metadata);

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/memory - Delete a memory
 */
export async function DELETE(req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Memory ID is required');
    }

    await deleteMemory(id);

    return NextResponse.json({
      success: true,
      message: 'Memory deleted',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

