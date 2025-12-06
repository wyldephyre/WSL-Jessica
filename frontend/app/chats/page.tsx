'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Chats Page - Redirects to Command Center
 */
export default function ChatsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/command-center');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Redirecting to Chats...</div>
    </div>
  );
}

