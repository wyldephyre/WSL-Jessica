/**
 * Memory Test API
 * Utility endpoint to test Mem0 connection and verify user_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMemoryClient, getAllMemories, addMemory } from '@/lib/services/memoryService';
import { env } from '@/lib/config/env';

const USER_ID = env.JESSICA_USER_ID || 'user_default';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testUserId = searchParams.get('user_id') || USER_ID;
    
    // Test 1: Check API key
    const hasApiKey = !!env.MEM0_API_KEY;
    
    // Test 2: Try to initialize client
    let clientInitSuccess = false;
    let clientError = null;
    try {
      getMemoryClient(); // Client initialization test
      clientInitSuccess = true;
    } catch (error) {
      clientError = error instanceof Error ? error.message : String(error);
    }
    
    // Test 3: Try to get memories for the user_id
    let memoriesSuccess = false;
    let memoryCount = 0;
    let memoryError = null;
    try {
      const memories = await getAllMemories(testUserId);
      memoriesSuccess = true;
      memoryCount = memories.length;
    } catch (error) {
      memoryError = error instanceof Error ? error.message : String(error);
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        apiKey: {
          present: hasApiKey,
          value: hasApiKey ? '***' + env.MEM0_API_KEY?.slice(-4) : 'not set',
        },
        clientInit: {
          success: clientInitSuccess,
          error: clientError,
        },
        getMemories: {
          success: memoriesSuccess,
          count: memoryCount,
          error: memoryError,
          user_id: testUserId,
        },
      },
      currentUserId: USER_ID,
      testUserId,
      recommendation: !hasApiKey 
        ? 'Set MEM0_API_KEY in .env.local'
        : !clientInitSuccess
        ? 'Check MEM0_API_KEY is valid'
        : !memoriesSuccess
        ? `Check if user_id "${testUserId}" exists in Mem0. Try using the exact user_id from your Mem0 dashboard.`
        : memoryCount === 0
        ? `No memories found for user_id "${testUserId}". Add some memories using the memory seeder or chat interface.`
        : `Found ${memoryCount} memories for user_id "${testUserId}"`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, content } = await req.json();
    const testUserId = user_id || USER_ID;
    const testContent = content || `Test memory created at ${new Date().toISOString()}`;
    
    // Try to add a test memory
    const memory = await addMemory({
      content: testContent,
      user_id: testUserId,
      context: 'personal',
      metadata: {
        type: 'test',
        source: 'test_api',
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test memory added successfully',
      memory,
      user_id: testUserId,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

