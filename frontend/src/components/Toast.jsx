import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

let toastListeners = [];

export const toast = (message) => {
  notify({ message, type: 'info' });
};

toast.success = (message) => {
  notify({ message, type: 'success' });
};

toast.error = (message) => {
  notify({ message, type: 'error' });
};

function notify(item) {
  const toastItem = {
    id: Date.now() + Math.random(),
    message: item.message,
    type: item.type || 'info',
  };
  toastListeners.forEach((listener) => listener(toastItem));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    toastListeners.push(handleToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-glow animate-fade-up ${
            t.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
              : t.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
              : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-indigo-400 shrink-0" />}
            <p className="text-sm font-medium">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-white/60 hover:text-white ml-2 p-1"
            aria-label="Close toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
