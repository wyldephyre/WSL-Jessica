'use client';

interface ActiveProviderIndicatorProps {
  provider: string; // 'claude' | 'grok' | 'gemini' | 'local' | 'jessica'
  isLoading: boolean;
}

const providerConfig: Record<string, { name: string; color: string; bgColor: string }> = {
  claude: {
    name: 'Claude',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20'
  },
  grok: {
    name: 'Grok',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20'
  },
  gemini: {
    name: 'Gemini',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20'
  },
  local: {
    name: 'Jessica',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20'
  },
  jessica: {
    name: 'Jessica',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20'
  }
};

/**
 * ActiveProviderIndicator Component
 * 
 * Shows which AI provider is currently being used during active requests.
 * Appears in lower left corner of chat input, disappears when response arrives.
 */
export function ActiveProviderIndicator({ provider, isLoading }: ActiveProviderIndicatorProps) {
  if (!isLoading || !provider) {
    return null;
  }

  const config = providerConfig[provider.toLowerCase()] || {
    name: provider.charAt(0).toUpperCase() + provider.slice(1),
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20'
  };

  return (
    <div
      className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 ${
        isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      } ${config.bgColor} ${config.color}`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} animate-pulse`} />
        <span>{config.name} is being used</span>
      </div>
    </div>
  );
}

