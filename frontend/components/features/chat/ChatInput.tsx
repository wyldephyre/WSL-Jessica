'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { ActiveProviderIndicator } from './ActiveProviderIndicator';

interface ChatInputProps {
  onSend?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  activeProvider?: string; // Provider currently being used (e.g., 'claude', 'grok', 'jessica')
}

/**
 * ChatInput Component
 * 
 * Main chat input with mic and attachment icons.
 * Inspired by Martin AI interface design.
 * Routing is handled automatically by the backend.
 */
export function ChatInput({ onSend, isLoading = false, placeholder = "How can I help you today?", activeProvider }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && onSend && !isLoading) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  return (
    <div className="w-full relative">
      {/* Main Input Container */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800/50 focus-within:border-amber-500/30 focus-within:glow-amber transition-all relative">
        {/* Text Input Area */}
        <div className="p-4 pb-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent text-gray-200 placeholder-gray-500 resize-none outline-none text-base leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '200px' }}
          />
        </div>

        {/* Bottom Bar */}
        <div className="px-4 pb-3 flex items-center justify-between">
          {/* Left: Icons */}
          <div className="flex items-center gap-3">
            {/* Attachment Icon */}
            <button className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Mic Icon */}
            <button className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>

          {/* Right: Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className={`p-2 rounded-full transition-all ${
              message.trim() && !isLoading
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Active Provider Indicator - Lower Left Corner */}
        <ActiveProviderIndicator provider={activeProvider || ''} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default ChatInput;

