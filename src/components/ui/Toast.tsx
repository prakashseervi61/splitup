'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'error', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgClass = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-success' : 'bg-primary';

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${bgClass}`}
      style={{ animation: 'fade-in 0.3s ease-out' }}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 rounded p-1 hover:bg-white/20" aria-label="Dismiss">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
