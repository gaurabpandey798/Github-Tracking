'use client';

import Link from 'next/link';
import { Timer, ArrowRight, Play, Lock, CheckCircle2 } from 'lucide-react';
import { SprintSummary } from '@/types/api';
import { formatDate, getSprintStatusConfig } from '@/lib/utils/formatters';

interface CurrentSprintCardProps {
  sprint: SprintSummary | null;
  totalSprints?: number;
  onRelease?: (sprint: SprintSummary) => void;
  onFreeze?: (sprint: SprintSummary) => void;
}

export default function CurrentSprintCard({
  sprint,
  totalSprints = 8,
  onRelease,
  onFreeze,
}: CurrentSprintCardProps) {
  if (!sprint) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
          <Timer className="h-4 w-4" />
          Current Sprint
        </div>
        <p className="mt-4 text-sm text-slate-500">
          No sprint is currently active or designated.
        </p>
      </div>
    );
  }

  const statusConfig = getSprintStatusConfig(sprint.status);
  const progressPercent = Math.min(100, Math.round((sprint.sprintNumber / totalSprints) * 100));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Top Banner / Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B2560] text-white">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Hackathon Phase
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#1F2937] mt-0.5">
              Sprint {sprint.sprintNumber}: {sprint.name}
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {sprint.status === 'NOT_STARTED' && onRelease && (
            <button
              type="button"
              onClick={() => onRelease(sprint)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Release Sprint
            </button>
          )}

          {sprint.status === 'ACTIVE' && onFreeze && (
            <button
              type="button"
              onClick={() => onFreeze(sprint)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-colors shadow-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              Freeze Sprint (Checkpoint)
            </button>
          )}

          {sprint.status === 'FROZEN' && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-[#2E45A2]">
              <CheckCircle2 className="h-4 w-4" />
              Sprint Frozen (Audit Checkpoint)
            </div>
          )}

          <Link
            href={`/sprints?id=${sprint.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Release Info */}
        <div className="rounded-lg bg-[#F2F6FF] p-3.5 border border-blue-50">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Released At
          </span>
          <p className="mt-1 text-xs font-bold text-slate-800">
            {formatDate(sprint.releasedAt)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            {sprint.releaseNote ? `"${sprint.releaseNote}"` : 'No release note provided'}
          </p>
          {sprint.releasedBy && (
            <p className="mt-1 text-[10px] text-slate-400">By {sprint.releasedBy}</p>
          )}
        </div>

        {/* Freeze / Checkpoint Info */}
        <div className="rounded-lg bg-[#F2F6FF] p-3.5 border border-blue-50">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Frozen At / Audit Checkpoint
          </span>
          <p className="mt-1 text-xs font-bold text-slate-800">
            {formatDate(sprint.frozenAt)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            {sprint.freezeNote ? `"${sprint.freezeNote}"` : 'Pending freeze / checkpoint'}
          </p>
          {sprint.frozenBy && (
            <p className="mt-1 text-[10px] text-slate-400">By {sprint.frozenBy}</p>
          )}
        </div>

        {/* Recorded Checkpoints */}
        <div className="rounded-lg bg-[#F2F6FF] p-3.5 border border-blue-50 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Audit Checkpoints Captured
            </span>
            <p className="mt-1 text-xl font-bold text-[#1B2560]">
              {sprint.checkpointsCount}
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            Immutable snapshot of repository commits & diffs
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>Sprint Progress ({sprint.sprintNumber} of {totalSprints})</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#1B2560] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
