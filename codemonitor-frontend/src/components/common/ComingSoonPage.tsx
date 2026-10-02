import Header from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  phase?: string;
  icon: LucideIcon;
}

export default function ComingSoonPage({
  title,
  description,
  phase = 'Phase 2',
  icon: Icon,
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} subtitle="Module status: Scheduled for upcoming release" />

      <div className="flex-1 p-6 flex items-center justify-center max-w-7xl mx-auto w-full">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F6FF] text-[#1B2560] mb-4">
            <Icon className="h-7 w-7" />
          </div>

          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1B2560] border border-blue-100 uppercase tracking-wider mb-2">
            {phase} • Coming Soon
          </span>

          <h2 className="text-xl font-bold text-[#1F2937]">{title}</h2>

          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            {description}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>

            <Link
              href="/sprints"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Inspect Sprints & Checkpoints
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
