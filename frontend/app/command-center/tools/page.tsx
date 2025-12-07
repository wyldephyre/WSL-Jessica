'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tool {
  name: string;
  description: string;
  methods: string[];
}

interface ToolResponse {
  success: boolean;
  tools: Tool[];
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Tool Inspector UI
 * Three-column layout for exploring and testing MCP tools
 */
export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paramsJson, setParamsJson] = useState<string>('{\n  "userId": "user_default"\n}');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tools on mount
  useEffect(() => {
    async function fetchTools() {
      try {
        const response = await fetch('/api/mcp');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data: ToolResponse = await response.json();
        if (data.success && data.tools) {
          setTools(data.tools);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tools');
      }
    }
    fetchTools();
  }, []);

  // Update params when tool/method changes
  useEffect(() => {
    if (selectedTool && selectedMethod) {
      // Set default params structure
      setParamsJson(`{\n  "userId": "user_default"\n}`);
      setExecutionResult(null);
    }
  }, [selectedTool, selectedMethod]);

  // Execute tool method
  async function executeTool() {
    if (!selectedTool || !selectedMethod) {
      setError('Please select a tool and method');
      return;
    }

    setLoading(true);
    setError(null);
    setExecutionResult(null);

    try {
      // Parse JSON params
      let params;
      try {
        params = JSON.parse(paramsJson);
      } catch (e) {
        throw new Error('Invalid JSON in parameters');
      }

      // Execute via POST /api/mcp
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: selectedTool.name,
          method: selectedMethod,
          params,
        }),
      });

      const data: ExecutionResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      setExecutionResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
      setExecutionResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/command-center"
                className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all"
              >
                ← Back to Command Center
              </Link>
              <h1 className="text-4xl font-bold text-white">MCP Tool Inspector</h1>
            </div>
          </div>
          <p className="text-gray-400">
            Explore and test all available MCP tools and their methods
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Three-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Available Tools */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Available Tools</h2>
            {tools.length === 0 ? (
              <p className="text-gray-400">Loading tools...</p>
            ) : (
              <div className="space-y-2">
                {tools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => {
                      setSelectedTool(tool);
                      setSelectedMethod(null);
                      setExecutionResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-md transition-all ${
                      selectedTool?.name === tool.name
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{tool.name}</div>
                    <div className="text-sm opacity-80 mt-1">{tool.description}</div>
                    <div className="text-xs opacity-60 mt-1">
                      {tool.methods.length} method{tool.methods.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Middle Column - Methods */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Methods</h2>
            {!selectedTool ? (
              <p className="text-gray-400">Select a tool to view methods</p>
            ) : (
              <div className="space-y-2">
                {selectedTool.methods.map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setSelectedMethod(method);
                      setExecutionResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-md transition-all ${
                      selectedMethod === method
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-mono text-sm">{method}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Execution Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Execution Panel</h2>
            
            {!selectedTool || !selectedMethod ? (
              <p className="text-gray-400">Select a tool and method to execute</p>
            ) : (
              <div className="space-y-4">
                {/* Tool/Method Info */}
                <div className="bg-gray-900 p-3 rounded border border-gray-700">
                  <div className="text-sm">
                    <span className="text-gray-400">Tool:</span>{' '}
                    <span className="font-mono text-gray-300">{selectedTool.name}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-gray-400">Method:</span>{' '}
                    <span className="font-mono text-gray-300">{selectedMethod}</span>
                  </div>
                </div>

                {/* JSON Parameter Editor */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Parameters (JSON)
                  </label>
                  <textarea
                    value={paramsJson}
                    onChange={(e) => setParamsJson(e.target.value)}
                    className="w-full h-40 bg-gray-900 text-gray-100 font-mono text-sm p-3 rounded border border-gray-700 focus:border-gray-500 focus:outline-none resize-none"
                    placeholder='{\n  "userId": "user_default"\n}'
                  />
                </div>

                {/* Execute Button */}
                <button
                  onClick={executeTool}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {loading ? 'Executing...' : 'Execute'}
                </button>

                {/* Results Display */}
                {executionResult && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2 text-gray-300">Result:</div>
                    <pre className="bg-gray-900 p-4 rounded border border-gray-700 text-xs text-gray-100 overflow-auto max-h-96">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

