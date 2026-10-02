'use client';

import { SprintSummary } from '@/types/api';
import { formatDate, getSprintStatusConfig } from '@/lib/utils/formatters';
import { Play, Lock, Eye, CheckCircle2 } from 'lucide-react';

interface SprintTableProps {
  sprints: SprintSummary[];
  selectedSprintId: number | null;
  onSelectSprint: (sprint: SprintSummary) => void;
  onRelease: (sprint: SprintSummary) => void;
  onFreeze: (sprint: SprintSummary) => void;
}

export default function SprintTable({
  sprints,
  selectedSprintId,
  onSelectSprint,
  onRelease,
  onFreeze,
}: SprintTableProps) {
  // Determine if a sprint can be released:
  // A sprint can be released if it is NOT_STARTED and it is sprint 1 or the preceding sprint is FROZEN
  const canReleaseSprint = (sprint: SprintSummary, index: number) => {
    if (sprint.status !== 'NOT_STARTED') return false;
    if (index === 0) return true;
    const prev = sprints[index - 1];
    return prev && (prev.status === 'FROZEN' || prev.status === 'COMPLETED');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5">Sprint</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Released At</th>
              <th scope="col" className="px-4 py-3.5">Frozen At</th>
              <th scope="col" className="px-4 py-3.5 text-center">Checkpoints</th>
              <th scope="col" className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sprints.map((sprint, idx) => {
              const statusConfig = getSprintStatusConfig(sprint.status);
              const isSelected = selectedSprintId === sprint.id;
              const eligibleForRelease = canReleaseSprint(sprint, idx);

              return (
                <tr
                  key={sprint.id}
                  onClick={() => onSelectSprint(sprint)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 border-l-4 border-l-[#1B2560]'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Sprint Name & Number */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1B2560]">
                        #{sprint.sprintNumber}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800">
                          {sprint.name}
                        </span>
                        {sprint.releaseNote && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {sprint.releaseNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  </td>

                  {/* Released At */}
                  <td className="px-4 py-4">
                    <div className="text-slate-700 font-medium">
                      {formatDate(sprint.releasedAt)}
                    </div>
                    {sprint.releasedBy && (
                      <div className="text-[10px] text-slate-400">
                        by {sprint.releasedBy}
                      </div>
                    )}
                  </td>

                  {/* Frozen At */}
                  <td className="px-4 py-4">
                    <div className="text-slate-700 font-medium">
                      {formatDate(sprint.frozenAt)}
                    </div>
                    {sprint.frozenBy && (
                      <div className="text-[10px] text-slate-400">
                        by {sprint.frozenBy}
                      </div>
                    )}
                  </td>

                  {/* Checkpoints count */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                        sprint.checkpointsCount > 0
                          ? 'bg-sky-100 text-[#1B2560]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sprint.checkpointsCount}
                    </span>
                  </td>

                  {/* Actions */}
                  <td
                    className="px-5 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {eligibleForRelease && (
                        <button
                          type="button"
                          onClick={() => onRelease(sprint)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#1B2560] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-2xs"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Release
                        </button>
                      )}

                      {sprint.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => onFreeze(sprint)}
                          className="inline-flex items-center gap-1 rounded-md bg-sky-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-800 transition-colors shadow-2xs"
                        >
                          <Lock className="h-3 w-3" />
                          Freeze
                        </button>
                      )}

                      {sprint.status === 'FROZEN' && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-sky-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Checkpoint
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectSprint(sprint)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-[#1B2560] bg-[#1B2560] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>{isSelected ? 'Viewing' : 'Details'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
