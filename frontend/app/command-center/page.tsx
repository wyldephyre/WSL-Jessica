'use client';

import { useState } from 'react';
import { ChatInput } from '@/components/features/chat/ChatInput';
import { ProviderHelp } from '@/components/features/chat/ProviderHelp';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: Date;
}

/**
 * Command Center Page
 * Full chat interface for extended conversations with AI providers.
 */
export default function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | undefined>(undefined);

  const handleSend = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setActiveProvider(undefined); // Reset provider indicator

    try {
      // Always use /api/chat - backend handles intelligent routing based on commands
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, provider: 'auto' }),
      });

      const data = await response.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'command-center/page.tsx:42','message':'Response received from API','data':{hasResponse:!!data.response,hasMessage:!!data.message,hasContent:!!data.content,contentType:typeof data.content,contentLength:data.content?.length,contentPreview:data.content?.substring(0,100),keys:Object.keys(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const finalContent = data.content || data.response || data.message || 'No response received.';
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'command-center/page.tsx:50','message':'Final content determined','data':{finalContentLength:finalContent.length,finalContentPreview:finalContent.substring(0,100),usedField:data.content?'content':data.response?'response':data.message?'message':'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Extract provider from routing info if available
      const routingProvider = data.routing?.provider || 'local';
      setActiveProvider(routingProvider);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        provider: routingProvider,
        timestamp: new Date(),
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'command-center/page.tsx:60','message':'About to set message','data':{messageId:assistantMessage.id,messageContentLength:assistantMessage.content.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      setMessages(prev => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'command-center/page.tsx:65','message':'Before state update','data':{prevMessagesCount:prev.length,newMessageId:assistantMessage.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return [...prev, assistantMessage];
      });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'command-center/page.tsx:70','message':'After state update','data':{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ef4ed018-1c21-4582-b1cc-90858e772b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'command-center/page.tsx:74','message':'Chat error caught','data':{error:error instanceof Error?error.message:String(error),errorType:error instanceof Error?error.constructor.name:typeof error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error connecting to AI service. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Clear provider indicator when response arrives
      setIsLoading(false);
      setActiveProvider(undefined);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-100">Command Center</h1>
            <p className="text-gray-500 text-sm mt-1">Multi-AI chat with persistent memory</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-200 mb-2">Start a conversation</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Chat with Claude, Grok, Gemini, or your local Dolphin model. 
                Jessica remembers context across sessions.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-gray-800/50 border border-gray-700/30'
                  }`}
                >
                  {msg.provider && msg.role === 'assistant' && (
                    <div className="text-xs text-gray-500 mb-1">via {msg.provider}</div>
                  )}
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <div className="text-xs text-gray-600 mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="px-8 py-6 border-t border-gray-800/50 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto">
          <ProviderHelp />
          <ChatInput onSend={handleSend} isLoading={isLoading} activeProvider={activeProvider} />
        </div>
      </div>
    </div>
  );
}
