'use client';

import { ErrorBoundary } from './ErrorBoundary';
import { Toaster } from 'react-hot-toast';

/**
 * Client-side providers wrapper
 * Includes error boundary and toast notifications
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <Toaster />
    </ErrorBoundary>
  );
}

