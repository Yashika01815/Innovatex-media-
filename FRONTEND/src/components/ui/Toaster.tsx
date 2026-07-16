import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/toastStore';

const config: Record<ToastVariant, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-l-emerald-500', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-l-red-500', iconColor: 'text-red-500' },
  info: { icon: Info, ring: 'border-l-blue-500', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, ring: 'border-l-amber-500', iconColor: 'text-amber-500' },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const c = config[t.variant];
        const Icon = c.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-ink-200 border-l-4 bg-white p-3.5 shadow-soft animate-slide-up ${c.ring}`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${c.iconColor}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
