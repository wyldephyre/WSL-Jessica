import { NextRequest, NextResponse } from 'next/server';
import { callAIProvider, AIProvider } from '@/lib/api/aiFactory';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { detectCalendarIntent } from '@/lib/utils/calendarIntent';
import { createCalendarEvent } from '@/lib/api/google-calendar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * Get Google OAuth token for the user
 * Uses authenticated userId from request
 */
async function getGoogleToken(userId: string): Promise<string | null> {
  try {
    
    const tokensRef = collection(db, 'oauth_tokens');
    const q = query(tokensRef, where('userId', '==', userId), where('provider', '==', 'google'));
    const docs = await getDocs(q);

    if (docs.empty) {
      return null;
    }

    const tokenDoc = docs.docs[0].data();
    
    // Check if token is expired (with 5 minute buffer)
    if (tokenDoc.expires_at && Date.now() > tokenDoc.expires_at - 300000) {
      return null;
    }

    return tokenDoc.access_token || null;
  } catch (error) {
    console.error('[Chat API] Error getting Google token:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    
    const { message, context = 'personal' as MemoryContext, provider = 'auto' as AIProvider, memoryStorageContexts } = await req.json();
    
    // Use memoryStorageContexts if provided (array), otherwise default to operational context
    // Support both old single context format and new array format for backward compatibility
    const memoryContexts: MemoryContext[] = Array.isArray(memoryStorageContexts) 
      ? memoryStorageContexts 
      : memoryStorageContexts 
        ? [memoryStorageContexts as MemoryContext]
        : [context];

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    // Check for calendar event intent
    const calendarIntent = detectCalendarIntent(message);
    let calendarEventResult = null;

    if (calendarIntent.hasIntent) {
      // Get user's Google OAuth token
      const accessToken = await getGoogleToken(userId);

      if (!accessToken) {
        // Return response indicating authentication needed
        return NextResponse.json({
          success: true,
          message: "I'd be happy to create a calendar event for you! However, I need you to connect your Google Calendar first. Please go to the audio upload page and click 'Connect Google Calendar' to authorize access.",
          provider: provider === 'auto' ? 'claude' : provider,
          requiresAuth: true,
          calendarIntent: calendarIntent,
        });
      }

      // Create calendar event
      try {
        const eventData = {
          title: calendarIntent.title || 'Untitled Event',
          date: calendarIntent.date || new Date().toISOString().split('T')[0],
          time: calendarIntent.time || undefined,
          notes: calendarIntent.notes || undefined,
        };

        const createdEvent = await createCalendarEvent(eventData, accessToken, 'primary');
        
        calendarEventResult = {
          success: true,
          event: createdEvent,
          message: `Calendar event "${eventData.title}" created successfully!`,
        };

        // Update the AI response to include calendar confirmation
        const calendarConfirmation = `\n\n✅ Calendar event created: "${eventData.title}"${eventData.date ? ` on ${eventData.date}` : ''}${eventData.time ? ` at ${eventData.time}` : ''}`;
        
        // Retrieve relevant memories and core relationship memories in parallel
        const [memories, coreRelationshipMemories] = await Promise.all([
          searchMemories(message, {
            user_id: userId,
            context,
            limit: 5,
          }),
          getCoreRelationshipMemories(userId),
        ]);

        // Format memory context for system prompt
        const memoryContext = memories.length > 0
          ? memories.map((m: { memory: string }) => `- ${m.memory}`).join('\n')
          : 'No relevant memories found.';

        // Build system prompt using master prompt system (includes core relationship memories)
        const baseSystemPrompt = buildSystemPrompt(context, memoryContext, coreRelationshipMemories);
        const systemPrompt = `${baseSystemPrompt}\n\nA calendar event has been created. Confirm this to the user in a friendly way.`;

        // Call AI provider with intelligent routing
        const response = await callAIProvider(provider, message + calendarConfirmation, systemPrompt);

        // Store conversation in memory (async, non-blocking) using memory storage contexts
        if (memoryContexts.length === 1) {
          addConversation(
            [
              { role: 'user', content: message },
              { role: 'assistant', content: response.content }
            ],
            userId,
            memoryContexts[0]
          ).catch((err: Error) => console.error('[Chat API] Memory storage failed:', err));
        } else {
          addConversationToMultipleContexts(
            [
              { role: 'user', content: message },
              { role: 'assistant', content: response.content }
            ],
            userId,
            memoryContexts
          ).catch((err: Error) => console.error('[Chat API] Multi-context memory storage failed:', err));
        }

        return NextResponse.json({
          success: true,
          ...response,
          calendarEvent: calendarEventResult,
        });
      } catch (calendarError) {
        console.error('[Chat API] Calendar event creation failed:', calendarError);
        // Continue with normal AI response, but note the calendar error
        calendarEventResult = {
          success: false,
          error: calendarError instanceof Error ? calendarError.message : 'Failed to create calendar event',
        };
      }
    }

    // Retrieve relevant memories and core relationship memories in parallel
    const [memories, coreRelationshipMemories] = await Promise.all([
      searchMemories(message, {
        user_id: userId,
        context,
        limit: 5,
      }),
      getCoreRelationshipMemories(userId),
    ]);

    // Format memory context for system prompt
    const memoryContext = memories.length > 0
      ? memories.map((m: { memory: string }) => `- ${m.memory}`).join('\n')
      : 'No relevant memories found.';

    // Build system prompt using master prompt system (includes core relationship memories)
    const systemPrompt = buildSystemPrompt(context, memoryContext, coreRelationshipMemories);

    // Call AI provider with intelligent routing
    const response = await callAIProvider(provider, message, systemPrompt);

    // Store conversation in memory (async, non-blocking) using memory storage contexts
    if (memoryContexts.length === 1) {
      addConversation(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content }
        ],
        userId,
        memoryContexts[0]
      ).catch((err: Error) => console.error('[Chat API] Memory storage failed:', err));
    } else {
      addConversationToMultipleContexts(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content }
        ],
        userId,
        memoryContexts
      ).catch((err: Error) => console.error('[Chat API] Multi-context memory storage failed:', err));
    }

    return NextResponse.json({
      success: true,
      ...response,
      ...(calendarEventResult && { calendarEvent: calendarEventResult }),
    });

  } catch (error) {
    return handleApiError(error);
  }
}

