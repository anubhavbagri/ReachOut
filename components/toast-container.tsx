'use client';

import { useStore } from '@/lib/store';
import { ToastNotification } from '@/lib/types';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export function ToastContainer() {
  const toasts = useStore(state => state.toasts);
  const removeToast = useStore(state => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast: ToastNotification) => {
        const IconComponent = toastIcons[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${toastColors[toast.type]} animate-in slide-in-from-right-full`}
          >
            <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
