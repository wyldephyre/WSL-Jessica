/**
 * Toast notification utilities
 * Provides user-friendly error and success messages
 */

import toast from 'react-hot-toast';

/**
 * Show success toast
 */
export function showSuccess(message: string) {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#1f2937',
      color: '#e5e5e5',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
  });
}

/**
 * Show error toast
 */
export function showError(message: string, duration: number = 5000) {
  toast.error(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#1f2937',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
  });
}

/**
 * Show warning toast
 */
export function showWarning(message: string) {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#1f2937',
      color: '#f59e0b',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#1f2937',
      color: '#60a5fa',
      border: '1px solid rgba(96, 165, 250, 0.3)',
    },
  });
}

/**
 * Show loading toast
 */
export function showLoading(message: string) {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#1f2937',
      color: '#e5e5e5',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
  });
}

/**
 * Update loading toast to success
 */
export function updateToSuccess(toastId: string, message: string) {
  toast.success(message, {
    id: toastId,
    duration: 3000,
    style: {
      background: '#1f2937',
      color: '#e5e5e5',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
  });
}

/**
 * Update loading toast to error
 */
export function updateToError(toastId: string, message: string) {
  toast.error(message, {
    id: toastId,
    duration: 5000,
    style: {
      background: '#1f2937',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
  });
}

