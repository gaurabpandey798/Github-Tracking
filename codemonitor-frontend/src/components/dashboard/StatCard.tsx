import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  };
  highlight?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  highlight = false,
}: StatCardProps) {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-[#2E45A2] border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badge?.variant || 'slate'];

  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-xs transition-shadow ${
        highlight ? 'border-[#2E45A2]/30 ring-1 ring-[#2E45A2]/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F6FF] text-[#1B2560]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#1F2937]">
          {value}
        </span>
        {badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeClasses}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
