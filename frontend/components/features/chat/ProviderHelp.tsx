'use client';

import { useState } from 'react';

interface ProviderInfo {
  name: string;
  displayName: string;
  color: string;
  bestFor: string;
  examples: string[];
  routing: string;
  tip: string;
}

const providers: ProviderInfo[] = [
  {
    name: 'jessica',
    displayName: 'Jessica (Local)',
    color: 'text-purple-400',
    bestFor: 'General conversation, personality, battle buddy mode',
    examples: ['"Hey Jessica"', '"What\'s up"', 'Normal chat'],
    routing: 'Default when no specific command detected',
    tip: 'Just talk naturally - Jessica handles routing'
  },
  {
    name: 'claude',
    displayName: 'Claude',
    color: 'text-orange-400',
    bestFor: 'Strategy, analysis, business decisions, deep thinking',
    examples: ['"Use Claude for this"', '"Complex analysis needed"', '"Analyze this strategy"'],
    routing: 'Explicit command OR keywords (analyze, strategy, plan, complex)',
    tip: 'For anything that needs serious brain power'
  },
  {
    name: 'grok',
    displayName: 'Grok',
    color: 'text-blue-400',
    bestFor: 'Research, current events, web search, investigations',
    examples: ['"Research this"', '"What\'s happening with X"', '"Look up Y"', '"Web search for..."'],
    routing: 'Explicit command OR keywords (research, search, current, latest)',
    tip: 'When you need fresh info from the web'
  },
  {
    name: 'gemini',
    displayName: 'Gemini',
    color: 'text-emerald-400',
    bestFor: 'Definitions, document summaries, quick answers',
    examples: ['"What is X"', '"Summarize this"', '"Quick lookup"', '"Define..."'],
    routing: 'Explicit command OR keywords (definition, summarize, document, quick)',
    tip: 'Fast answers for simple questions'
  }
];

/**
 * ProviderHelp Component
 * 
 * Collapsible cheat sheet showing which AI provider to use for what.
 * Marine-style, direct, no bullshit.
 */
export function ProviderHelp() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-4">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:border-amber-500/30 hover:bg-gray-800/50 transition-all"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-300">Provider Cheat Sheet</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 p-4 rounded-lg bg-gray-800/30 border border-gray-700/30 space-y-4">
          {providers.map((provider) => (
            <div key={provider.name} className="pb-4 border-b border-gray-700/30 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-semibold ${provider.color}`}>{provider.displayName}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Best for: </span>
                  <span className="text-gray-300">{provider.bestFor}</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Examples: </span>
                  <span className="text-gray-300">{provider.examples.join(', ')}</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Routing: </span>
                  <span className="text-gray-300">{provider.routing}</span>
                </div>
                
                <div className="pt-1">
                  <span className="text-amber-500 font-medium">Tip: </span>
                  <span className="text-gray-300">{provider.tip}</span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t border-gray-700/30">
            <p className="text-xs text-gray-500">
              Jessica automatically routes to the right provider based on your commands or message content.
              Just talk naturally - she'll figure it out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

