import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui';

export function KpiCard({
  label,
  value,
  delta,
  icon,
  accent = '#6366f1',
  hint,
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon: React.ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{value}</p>
          {delta != null && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(delta)}% <span className="font-normal text-ink-400">vs last month</span>
            </p>
          )}
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        <div className="rounded-xl p-2.5" style={{ background: `${accent}14`, color: accent }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
