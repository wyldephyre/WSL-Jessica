'use client';

import { useState, useMemo } from 'react';
import type { Task } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Sort and filter tasks
  const sortedAndFilteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    // Sort tasks
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const aDate = a.dueDate ? new Date(a.dueDate as any).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate as any).getTime() : 0;
          return aDate - bDate;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return bPriority - aPriority;
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, sortBy, filterPriority]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No tasks found.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority' | 'title')}
            className="px-3 py-1 rounded-md bg-gray-800/40 border border-gray-700/30 text-gray-200 text-sm focus:outline-none focus:border-gray-600"
          >
            <option value="date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Priority:</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 rounded-md bg-gray-800/40 border border-gray-700/30 text-gray-200 text-sm focus:outline-none focus:border-gray-600"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-sm text-gray-400">
          Showing {sortedAndFilteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedAndFilteredTasks.map((task) => {
          const dueDate = task.dueDate
            ? new Date(task.dueDate as any)
            : null;
          const isOverdue = dueDate && dueDate < new Date() && !task.completed;
          const isToday = dueDate && dueDate.toDateString() === new Date().toDateString();

          return (
            <div
              key={task.id}
              className={`p-4 rounded-lg border ${
                task.completed
                  ? 'bg-gray-800/20 border-gray-700/20 opacity-60'
                  : isOverdue
                  ? 'bg-red-900/20 border-red-700/30'
                  : isToday
                  ? 'bg-blue-900/20 border-blue-700/30'
                  : 'bg-gray-800/40 border-gray-700/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3
                      className={`font-semibold ${
                        task.completed ? 'line-through text-gray-400' : 'text-gray-100'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.priority && (
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          task.priority === 'high'
                            ? 'bg-red-900/50 text-red-200'
                            : task.priority === 'medium'
                            ? 'bg-yellow-900/50 text-yellow-200'
                            : 'bg-blue-900/50 text-blue-200'
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.completed && (
                      <span className="px-2 py-1 text-xs bg-green-900/50 text-green-200 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-300 mb-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    {dueDate && (
                      <span className={isOverdue ? 'text-red-300' : isToday ? 'text-blue-300' : ''}>
                        Due: {dueDate.toLocaleDateString()}
                      </span>
                    )}
                    {task.createdAt && (
                      <span>
                        Created: {new Date(task.createdAt as any).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

