'use client';

import { useState, useEffect, useCallback } from 'react';

interface Memory {
  id: string;
  content: string;
  context?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export default function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryContext, setNewMemoryContext] = useState('personal');

  // Fetch all memories
  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = searchQuery
        ? `/api/memory?query=${encodeURIComponent(searchQuery)}`
        : '/api/memory';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }

      const data = await response.json();
      setMemories(data.memories || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load memories';
      setError(errorMessage);
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Add new memory
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;

    try {
      setError(null);
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMemoryContent,
          context: newMemoryContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add memory');
      }

      setNewMemoryContent('');
      setShowAddForm(false);
      fetchMemories(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add memory';
      setError(errorMessage);
      console.error('Error adding memory:', err);
    }
  };

  // Delete memory
  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/memory?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }

      fetchMemories(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memory';
      setError(errorMessage);
      console.error('Error deleting memory:', err);
    }
  };

  // Load memories on mount and when search changes
  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-100">Memory Management</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all"
          >
            {showAddForm ? 'Cancel' : '+ Add Memory'}
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800/40 border border-gray-700/30 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-gray-600"
          />
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form onSubmit={handleAddMemory} className="mb-4 p-4 bg-gray-800/40 border border-gray-700/30 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Memory Content
              </label>
              <textarea
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="Enter memory content..."
                rows={4}
                className="w-full px-4 py-2 rounded-md bg-gray-900/60 border border-gray-700/30 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-gray-600"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Context
              </label>
              <select
                value={newMemoryContext}
                onChange={(e) => setNewMemoryContext(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-900/60 border border-gray-700/30 text-gray-200 focus:outline-none focus:border-gray-600"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="project">Project</option>
                <option value="conversation">Conversation</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all"
            >
              Save Memory
            </button>
          </form>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-red-200 font-semibold">Error</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
          <p className="mt-4 text-gray-300">Loading memories...</p>
        </div>
      ) : (
        <>
          {/* Memories List */}
          {memories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No memories found.</p>
              {!searchQuery && (
                <p className="text-sm mt-2">Click "Add Memory" to create your first memory.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="p-4 bg-gray-800/40 border border-gray-700/30 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {memory.context && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded mb-2">
                          {memory.context}
                        </span>
                      )}
                      <p className="text-gray-200 whitespace-pre-wrap">{memory.content}</p>
                      {memory.created_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(memory.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="ml-4 px-3 py-1 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

