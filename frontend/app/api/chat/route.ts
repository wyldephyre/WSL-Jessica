import { NextRequest, NextResponse } from 'next/server';
import { callAIProvider, AIProvider } from '@/lib/api/aiFactory';
import { searchMemories, addConversation, addConversationToMultipleContexts, getCoreRelationshipMemories } from '@/lib/services/memoryService';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { MemoryContext } from '@/lib/types/memory';
import { detectCalendarIntent } from '@/lib/utils/calendarIntent';
import { detectGmailIntent } from '@/lib/utils/gmailIntent';
import { detectDocsIntent } from '@/lib/utils/docsIntent';
import { createCalendarEvent } from '@/lib/api/google-calendar';
import { listGmailMessages, getGmailMessage, markGmailMessageAsRead } from '@/lib/api/google-gmail';
import { createDocument, getDocument, appendTextToDocument } from '@/lib/api/google-docs';
import { getValidGoogleToken } from '@/lib/api/google-oauth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { buildSystemPrompt } from '@/lib/prompts/jessica-master-prompt';
import { requireAuth } from '@/lib/middleware/auth';
import { env } from '@/lib/config/env';

/**
 * Call Jessica Core backend directly (for local provider)
 * This runs server-side in WSL, so localhost:8000 works correctly
 */
async function callLocalBackend(message: string, mode: string = 'default'): Promise<{ content: string; routing?: any; request_id?: string }> {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:23',message:'callLocalBackend entry',data:{messageLength:message.length,mode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const backendUrl = env.API_URL || 'http://localhost:8000';
  const backendEndpoint = `${backendUrl}/chat`;

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:27',message:'Before fetch to backend',data:{endpoint:backendEndpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const response = await fetch(backendEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      provider: 'local',
      mode,
    }),
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:39',message:'After fetch response',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (!response.ok) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:40',message:'Response not OK',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const errorData = await response.json().catch(() => ({}));
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:41',message:'Backend error details',data:{error:errorData.error,errorCode:errorData.error_code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error(errorData.error || `Backend error: ${response.statusText}`);
  }

  const data = await response.json();
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:44',message:'Backend success',data:{hasResponse:!!data.response,provider:data.routing?.provider},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return {
    content: data.response || '',
    routing: data.routing,
    request_id: data.request_id,
  };
}

/**
 * Get Google OAuth token for the user (with auto-refresh)
 * Uses authenticated userId from request
 */
async function getGoogleToken(userId: string): Promise<string | null> {
  try {
    return await getValidGoogleToken(userId);
  } catch (error) {
    console.error('[Chat API] Error getting Google token:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:84',message:'POST handler entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Single-user system: Use constant user ID (backend handles this, but we need it for memory storage)
    // TODO: For multi-user, restore requireAuth(req)
    let userId: string;
    try {
      const authResult = await requireAuth(req);
      userId = authResult.userId;
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:92',message:'Auth succeeded',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (authError) {
      // Single-user mode: Use constant user ID if auth fails
      // Backend uses USER_ID constant, but frontend memory service needs a user ID
      userId = 'PhyreBug'; // Match backend USER_ID constant
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:98',message:'Auth failed, using default',data:{userId,error:String(authError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
    
    let { message, context = 'personal' as MemoryContext, provider = 'auto' as AIProvider, memoryStorageContexts } = await req.json();
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:103',message:'Request parsed',data:{messageLength:message?.length,provider,context},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    
    // Always use 'auto' provider - backend handles intelligent routing based on commands
    const routingProvider = 'auto';
    
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

    // Check for intents (Calendar, Gmail, Docs)
    const calendarIntent = detectCalendarIntent(message);
    const gmailIntent = detectGmailIntent(message);
    const docsIntent = detectDocsIntent(message);
    
    let calendarEventResult = null;
    let gmailResult = null;
    let docsResult = null;

    // Handle Calendar Intent
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
        // Parse date and time into ISO 8601 format
        const now = new Date();
        let startTime = now.toISOString();
        let endTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour duration

        if (calendarIntent.date || calendarIntent.time) {
          // Simple date/time parsing (can be enhanced)
          const dateStr = calendarIntent.date || now.toISOString().split('T')[0];
          const timeStr = calendarIntent.time || now.toTimeString().split(' ')[0].substring(0, 5);
          
          // Combine date and time
          const combinedDateTime = `${dateStr}T${timeStr}:00`;
          startTime = new Date(combinedDateTime).toISOString();
          endTime = new Date(new Date(combinedDateTime).getTime() + 60 * 60 * 1000).toISOString();
        }

        const eventData = {
          title: calendarIntent.eventData?.title || 'Untitled Event',
          description: calendarIntent.eventData?.description || calendarIntent.notes,
          startTime,
          endTime,
          location: calendarIntent.eventData?.location,
          attendees: calendarIntent.eventData?.attendees,
        };

        const createdEvent = await createCalendarEvent(eventData, accessToken, 'primary');
        
        calendarEventResult = {
          success: true,
          event: createdEvent,
          message: `Calendar event "${eventData.title}" created successfully!`,
        };

        // Update the AI response to include calendar confirmation
        const eventDate = new Date(startTime);
        const calendarConfirmation = `\n\n✅ Calendar event created: "${eventData.title}" on ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString()}`;
        
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
        // Note: searchMemories returns Memory[] but API actually returns { memory: string } objects
        const memoryContext = memories.length > 0
          ? memories.map((m: any) => `- ${m.memory || m.content || String(m)}`).join('\n')
          : 'No relevant memories found.';

        // Build system prompt using master prompt system (includes core relationship memories)
        const baseSystemPrompt = buildSystemPrompt({
          memoryContext: memoryContext + (coreRelationshipMemories.length > 0 ? '\n\nCore relationship context:\n' + coreRelationshipMemories.map((m: any) => `- ${m.memory || m.content || String(m)}`).join('\n') : '')
        });
        const systemPrompt = `${baseSystemPrompt}\n\nA calendar event has been created. Confirm this to the user in a friendly way.`;

        // Backend handles intelligent routing - always use 'auto' to let backend decide
        const calendarProvider = routingProvider === 'auto' ? 'local' : routingProvider;

        // Call AI provider - use direct backend call for local, otherwise use callAIProvider
        const response = calendarProvider === 'local'
          ? await callLocalBackend(message + calendarConfirmation, 'default')
          : await callAIProvider(calendarProvider, message + calendarConfirmation, systemPrompt);

        // Store conversation in memory (async, non-blocking) using memory storage contexts
        if (memoryContexts.length === 1) {
          addConversation(
            [
              { role: 'user', content: message },
              { role: 'assistant', content: response.content }
            ],
            userId,
            memoryContexts[0] || 'personal'
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

    // Handle Gmail Intent
    if (gmailIntent.hasIntent) {
      const accessToken = await getGoogleToken(userId);

      if (!accessToken) {
        return NextResponse.json({
          success: true,
          message: "I'd be happy to check your emails! However, I need you to connect your Google account first. Please go to the integrations page and connect Google.",
          provider: provider === 'auto' ? 'claude' : provider,
          requiresAuth: true,
          gmailIntent: gmailIntent,
        });
      }

      try {
        if (gmailIntent.action === 'list') {
          const result = await listGmailMessages(accessToken, {
            query: gmailIntent.filters?.query,
            maxResults: 10,
          });

          gmailResult = {
            success: true,
            messages: result.messages,
            count: result.messages.length,
            message: `Found ${result.messages.length} email${result.messages.length !== 1 ? 's' : ''}`,
          };

          // Format message summary for AI
          const emailSummary = result.messages.slice(0, 5).map((msg, idx) => 
            `${idx + 1}. ${msg.unread ? '[UNREAD] ' : ''}${msg.subject || 'No subject'} - From: ${msg.from || 'Unknown'} - ${msg.snippet?.substring(0, 100)}...`
          ).join('\n');

          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:256',message:'Attempting to append to message (Gmail list)',data:{messageLength:message.length,emailCount:result.messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          message += `\n\nHere are your emails:\n${emailSummary}`;
        } else if (gmailIntent.action === 'read' && gmailIntent.messageId) {
          const messageDetail = await getGmailMessage(accessToken, gmailIntent.messageId);
          gmailResult = {
            success: true,
            message: messageDetail,
            messageText: `Email from ${messageDetail.from}: ${messageDetail.subject || 'No subject'}\n\n${messageDetail.body || messageDetail.snippet}`,
          };
          message += `\n\nEmail content:\n${gmailResult.messageText}`;
        } else if (gmailIntent.action === 'markRead' && gmailIntent.messageId) {
          await markGmailMessageAsRead(accessToken, gmailIntent.messageId);
          gmailResult = {
            success: true,
            message: 'Email marked as read',
          };
          message += '\n\nEmail marked as read.';
        }
      } catch (gmailError) {
        console.error('[Chat API] Gmail operation failed:', gmailError);
        gmailResult = {
          success: false,
          error: gmailError instanceof Error ? gmailError.message : 'Failed to access Gmail',
        };
      }
    }

    // Handle Docs Intent
    if (docsIntent.hasIntent) {
      const accessToken = await getGoogleToken(userId);

      if (!accessToken) {
        return NextResponse.json({
          success: true,
          message: "I'd be happy to work with your documents! However, I need you to connect your Google account first. Please go to the integrations page and connect Google.",
          provider: provider === 'auto' ? 'claude' : provider,
          requiresAuth: true,
          docsIntent: docsIntent,
        });
      }

      try {
        if (docsIntent.action === 'create' && docsIntent.title) {
          const document = await createDocument(accessToken, docsIntent.title);
          docsResult = {
            success: true,
            document,
            message: `Document "${docsIntent.title}" created successfully!`,
          };
          message += `\n\n✅ Document created: "${docsIntent.title}" - ${document.webViewLink}`;
        } else if (docsIntent.action === 'read' && docsIntent.documentId) {
          const document = await getDocument(accessToken, docsIntent.documentId);
          docsResult = {
            success: true,
            document,
            message: `Document content retrieved`,
          };
          message += `\n\nDocument: "${document.title}"\n\n${document.content || 'Document is empty'}`;
        } else if (docsIntent.action === 'append' && docsIntent.documentId && docsIntent.content) {
          await appendTextToDocument(accessToken, docsIntent.documentId, docsIntent.content);
          const document = await getDocument(accessToken, docsIntent.documentId);
          docsResult = {
            success: true,
            document,
            message: 'Content appended to document',
          };
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:321',message:'Attempting to append to message (Docs append)',data:{messageLength:message.length,documentTitle:document.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          message += `\n\n✅ Content added to document "${document.title}"`;
        }
      } catch (docsError) {
        console.error('[Chat API] Docs operation failed:', docsError);
        docsResult = {
          success: false,
          error: docsError instanceof Error ? docsError.message : 'Failed to access Google Docs',
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
    // Note: searchMemories returns Memory[] but API actually returns { memory: string } objects
    const memoryContext = memories.length > 0
      ? memories.map((m: any) => `- ${m.memory || m.content || String(m)}`).join('\n')
      : 'No relevant memories found.';

    // Build system prompt using master prompt system (includes core relationship memories)
    const systemPrompt = buildSystemPrompt({
      memoryContext: memoryContext + (coreRelationshipMemories.length > 0 ? '\n\nCore relationship context:\n' + coreRelationshipMemories.map((m: any) => `- ${m.memory || m.content || String(m)}`).join('\n') : '')
    });

    // Backend handles intelligent routing - always use 'auto' to let backend decide
    const actualProvider = routingProvider === 'auto' ? 'local' : routingProvider;
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:394',message:'Before AI call',data:{actualProvider,messageLength:message?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Call AI provider - use direct backend call for local, otherwise use callAIProvider
    const response = actualProvider === 'local'
      ? await callLocalBackend(message, 'default')
      : await callAIProvider(actualProvider, message, systemPrompt);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:402',message:'After AI call',data:{hasContent:!!response?.content,contentLength:response?.content?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});

    // Store conversation in memory (async, non-blocking) using memory storage contexts
    if (memoryContexts.length === 1) {
      addConversation(
        [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content }
        ],
        userId,
        memoryContexts[0] || 'personal'
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
      ...(gmailResult && { gmail: gmailResult }),
      ...(docsResult && { docs: docsResult }),
    });

  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24e2521f-e070-4e10-b9bd-1790b19d541e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat/route.ts:catch',message:'Error caught',data:{error:String(error),name:(error as Error)?.name,stack:(error as Error)?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return handleApiError(error);
  }
}

