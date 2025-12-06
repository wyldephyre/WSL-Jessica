'use client';

import { useState, useEffect } from 'react';
import { env } from '@/lib/config/env';

interface ServiceStatus {
  local_ollama?: {
    available: boolean;
    response_time_ms?: number;
    error?: string;
  };
  local_memory?: {
    available: boolean;
    response_time_ms?: number;
    error?: string;
  };
  claude_api?: { configured: boolean };
  grok_api?: { configured: boolean };
  gemini_api?: { configured: boolean };
  mem0_api?: { configured: boolean };
}

/**
 * Service Health Component
 * Displays status of all backend services
 */
export function ServiceHealth() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${env.API_URL}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-lg">
        <p className="text-sm text-gray-500">Checking service status...</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">Failed to fetch service status</p>
        <button
          onClick={fetchStatus}
          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (available: boolean) => {
    return available ? '✓' : '✗';
  };

  return (
    <div className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Service Status</h3>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-400 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {/* Local Services */}
        {status.local_ollama && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Ollama</span>
            <div className="flex items-center gap-2">
              {status.local_ollama.response_time_ms && (
                <span className="text-gray-500">
                  {status.local_ollama.response_time_ms}ms
                </span>
              )}
              <span className={getStatusColor(status.local_ollama.available)}>
                {getStatusIcon(status.local_ollama.available)}
              </span>
            </div>
          </div>
        )}

        {status.local_memory && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Memory Service</span>
            <div className="flex items-center gap-2">
              {status.local_memory.response_time_ms && (
                <span className="text-gray-500">
                  {status.local_memory.response_time_ms}ms
                </span>
              )}
              <span className={getStatusColor(status.local_memory.available)}>
                {getStatusIcon(status.local_memory.available)}
              </span>
            </div>
          </div>
        )}

        {/* API Services */}
        {status.claude_api && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Claude API</span>
            <span className={status.claude_api.configured ? 'text-green-400' : 'text-gray-500'}>
              {status.claude_api.configured ? '✓' : '○'}
            </span>
          </div>
        )}

        {status.grok_api && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Grok API</span>
            <span className={status.grok_api.configured ? 'text-green-400' : 'text-gray-500'}>
              {status.grok_api.configured ? '✓' : '○'}
            </span>
          </div>
        )}

        {status.gemini_api && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Gemini API</span>
            <span className={status.gemini_api.configured ? 'text-green-400' : 'text-gray-500'}>
              {status.gemini_api.configured ? '✓' : '○'}
            </span>
          </div>
        )}

        {status.mem0_api && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Mem0 API</span>
            <span className={status.mem0_api.configured ? 'text-green-400' : 'text-gray-500'}>
              {status.mem0_api.configured ? '✓' : '○'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

