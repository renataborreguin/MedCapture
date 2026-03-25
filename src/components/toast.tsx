"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, Info } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "warning";
}

const ToastContext = createContext<{
  showToast: (message: string, type?: "info" | "success" | "warning") => void;
}>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: "info" | "success" | "warning" = "info") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const colors = {
    info: { bg: "var(--primary-light)", border: "var(--ai-border)", text: "var(--primary)" },
    success: { bg: "var(--success-bg)", border: "var(--ai-border)", text: "var(--success)" },
    warning: { bg: "var(--warning-bg)", border: "var(--warning-border)", text: "var(--warning)" },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2" style={{ maxWidth: 380 }}>
        {toasts.map((toast) => {
          const colorSet = colors[toast.type];
          return (
            <div
              key={toast.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm animate-in slide-in-from-right"
              style={{ background: colorSet.bg, border: `1px solid ${colorSet.border}`, color: colorSet.text }}
            >
              <Info className="h-4 w-4 shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => dismiss(toast.id)} className="shrink-0 p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
