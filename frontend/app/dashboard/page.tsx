'use client';

import { useState, useEffect, useCallback } from 'react';
import TaskList from '@/components/features/tasks/TaskList';
import MemoryManager from '@/components/features/memory/MemoryManager';
import type { Task } from '@/lib/types/task';

/**
 * Dashboard Page Component
 * 
 * Full task management view with filtering, stats, and memory manager.
 * Now integrated into sidebar navigation layout.
 */
export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'memory'>('tasks');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const url = showCompleted ? '/api/tasks?includeCompleted=true&limit=500' : '/api/tasks?limit=500';
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`Failed to fetch tasks: HTTP ${res.status}`);
      const data = await res.json();
      setTasks((data?.tasks || []) as Task[]);
    } catch (err) {
      console.error('[Dashboard] Error fetching tasks:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showCompleted]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = t.dueDate instanceof Date
      ? t.dueDate
      : new Date(t.dueDate as string);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  }).length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100">
            Tasks & Memory
          </h1>
          <p className="text-gray-500 mt-1">Manage your tasks and cognitive memory storage</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tasks'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'memory'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            Memory
          </button>
        </div>

        {activeTab === 'tasks' ? (
          <>
            {/* Task Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
                <div className="text-2xl font-semibold text-gray-100">{totalTasks}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <div className="text-sm text-gray-500 mb-1">Pending</div>
                <div className="text-2xl font-semibold text-amber-400">{pendingTasks}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <div className="text-sm text-gray-500 mb-1">Completed</div>
                <div className="text-2xl font-semibold text-emerald-400">{completedTasks}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <div className="text-sm text-gray-500 mb-1">Due Today</div>
                <div className="text-2xl font-semibold text-blue-400">{todayTasks}</div>
              </div>
            </div>

            {/* Task Filter Toggle */}
            <div className="mb-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/50"
                />
                <span className="text-sm text-gray-400">Show completed tasks</span>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="mt-4 text-gray-500">Loading tasks...</p>
              </div>
            ) : (
              <TaskList tasks={tasks} />
            )}
          </>
        ) : (
          <MemoryManager />
        )}
      </div>
    </div>
  );
}
