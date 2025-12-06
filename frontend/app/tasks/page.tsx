'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Tasks Page - Redirects to Dashboard with tasks tab active
 */
export default function TasksPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Redirecting to Tasks...</div>
    </div>
  );
}

