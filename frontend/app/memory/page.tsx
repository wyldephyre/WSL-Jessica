'use client';

import MemoryManager from '@/components/features/memory/MemoryManager';

/**
 * Memory Page - Dedicated memory management view
 */
export default function MemoryPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100">Memory</h1>
          <p className="text-gray-500 mt-1">Manage your cognitive memory storage</p>
        </header>
        
        <MemoryManager />
      </div>
    </div>
  );
}

