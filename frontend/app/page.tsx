'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { ChatInput } from '@/components/features/chat/ChatInput';
import type { Task } from '@/lib/types/task';

// Shortcut card type
interface Shortcut {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
}

// Simple icons
const NoteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AudioIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const shortcuts: Shortcut[] = [
  { id: 'audio', name: 'Upload Audio', icon: <AudioIcon />, href: '/audio' },
  { id: 'note', name: 'Quick Note', icon: <NoteIcon />, href: '/notes' },
];

/**
 * Home Page - Martin AI Inspired
 * 
 * Unified dashboard with chat input, scheduled tasks, shortcuts, and events.
 */
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const userName = 'Jason';

  // Fetch pending tasks
  const fetchTasks = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('completed', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const tasksData: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });

      // Sort by createdAt descending
      tasksData.sort((a, b) => {
        const getTs = (t: Task): number => {
          const ts = t.createdAt;
          if (ts && typeof ts === 'object' && 'toMillis' in ts) return (ts as Timestamp).toMillis();
          if (ts instanceof Date) return ts.getTime();
          return 0;
        };
        return getTs(b) - getTs(a);
      });

      setTasks(tasksData.slice(0, 5)); // Only show top 5
    } catch (err) {
      console.error('[Home] Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle chat send
  const handleSend = async (message: string, provider: string) => {
    setChatLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      // Route to appropriate API based on provider
      const endpoint = provider === 'local' ? '/api/chat' : `/api/chat/${provider}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, provider }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'No response' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI service.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Get current date info for upcoming events
  const today = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100 italic">
            Welcome home, {userName}.
          </h1>
        </header>

        {/* Chat Input Section */}
        <section className="mb-10">
          <ChatInput 
            onSend={handleSend} 
            isLoading={chatLoading}
          />
          
          {/* Recent Messages */}
          {messages.length > 0 && (
            <div className="mt-4 space-y-3">
              {messages.slice(-4).map((msg, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-amber-500/10 border border-amber-500/20 ml-8' 
                      : 'bg-gray-800/50 border border-gray-700/30 mr-8'
                  }`}
                >
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Scheduled Tasks Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-medium text-gray-200">Scheduled Tasks</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-amber-500 hover:text-amber-400 transition-colors">
                Active {tasks.length}
              </button>
              <span className="text-gray-600">|</span>
              <button className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                Completed
              </button>
              <button className="ml-3 px-3 py-1.5 text-sm bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors">
                + Create Task
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending tasks. Nice work!</div>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:border-gray-600/50 transition-colors group"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="flex-1 text-gray-300 text-sm">{task.text || task.title}</span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-gray-300 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Shortcuts Section */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-200">Shortcuts</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shortcuts.map((shortcut) => (
              <a
                key={shortcut.id}
                href={shortcut.href}
                className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:border-amber-500/30 hover:bg-gray-800/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors mb-3">
                  {shortcut.icon}
                </div>
                <span className="text-sm text-gray-300">{shortcut.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Upcoming Events Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-200">Upcoming Events</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="text-sm text-gray-500 w-32">{formatDate(today)}</div>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Today</span>
            </div>
            <div className="text-center py-4 text-gray-600 text-sm">
              No upcoming events. Connect your calendar in Settings.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
