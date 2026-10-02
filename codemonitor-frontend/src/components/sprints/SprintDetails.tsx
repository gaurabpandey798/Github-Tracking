'use client';

import { useEffect, useState } from 'react';
import { SprintDetail, SprintSummary } from '@/types/api';
import { getSprintById } from '@/lib/api/sprints';
import { formatDate, getSprintStatusConfig, truncateSha, getSeverityConfig, getReviewFlagTypeLabel } from '@/lib/utils/formatters';
import CheckpointCard from './CheckpointCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import {
  Timer,
  Play,
  Lock,
  Flag,
  GitCommit,
  ShieldAlert,
  User,
  CheckCircle2,
} from 'lucide-react';

interface SprintDetailsProps {
  sprintId: number;
  onClose?: () => void;
  onRelease?: (sprint: SprintSummary) => void;
  onFreeze?: (sprint: SprintSummary) => void;
}

export default function SprintDetails({
  sprintId,
  onClose,
  onRelease,
  onFreeze,
}: SprintDetailsProps) {
  const [detail, setDetail] = useState<SprintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  const handleReload = () => {
    setLoading(true);
    setError(null);
    getSprintById(sprintId)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const errorObj = err as { message?: string; status?: number };
        setError({
          message: errorObj.message || 'Failed to load sprint details from backend.',
          status: errorObj.status,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getSprintById(sprintId)
      .then((data) => {
        if (!ignore) {
          setDetail(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to load sprint details from backend.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [sprintId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
        <LoadingSpinner label={`Loading Sprint #${sprintId} details...`} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <ErrorMessage
          title={`Error loading Sprint #${sprintId}`}
          message={error?.message || 'Sprint not found.'}
          status={error?.status}
          onRetry={handleReload}
        />
      </div>
    );
  }

  const statusConfig = getSprintStatusConfig(detail.status);

  // Convert detail to SprintSummary for action dialogs
  const summaryForAction: SprintSummary = {
    id: detail.id,
    sprintNumber: detail.sprintNumber,
    name: detail.name,
    status: detail.status,
    releaseNote: detail.releaseNote,
    freezeNote: detail.freezeNote,
    releasedAt: detail.releasedAt,
    releasedBy: detail.releasedBy,
    frozenAt: detail.frozenAt,
    frozenBy: detail.frozenBy,
    checkpointsCount: detail.checkpoints?.length || 0,
  };

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1B2560] text-white">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                Sprint #{detail.sprintNumber}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#1F2937] mt-0.5">
              {detail.name}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {detail.status === 'NOT_STARTED' && onRelease && (
            <button
              type="button"
              onClick={() => onRelease(summaryForAction)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Release Sprint
            </button>
          )}

          {detail.status === 'ACTIVE' && onFreeze && (
            <button
              type="button"
              onClick={() => onFreeze(summaryForAction)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-colors shadow-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              Freeze Sprint (Audit Checkpoint)
            </button>
          )}

          {detail.status === 'FROZEN' && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-[#2E45A2]">
              <CheckCircle2 className="h-4 w-4" />
              Sprint Frozen (Audit Checkpoint)
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Release & Freeze Audit Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Release Metadata */}
        <div className="rounded-lg bg-[#F2F6FF] p-4 border border-blue-50">
          <div className="flex items-center justify-between text-xs font-bold text-[#1B2560] mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 fill-current" />
              Release Record
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {detail.releasedAt ? formatDate(detail.releasedAt) : 'Not Released'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Released by:</span>
              <span className="font-semibold text-slate-800">
                {detail.releasedBy || '—'}
              </span>
            </div>
            <div className="mt-2 text-slate-700">
              <span className="text-slate-500 font-medium">Release Note:</span>
              <p className="mt-1 rounded bg-white p-2.5 text-xs font-mono text-slate-800 border border-slate-200/80">
                {detail.releaseNote || 'No release note on record.'}
              </p>
            </div>
          </div>
        </div>

        {/* Freeze Metadata */}
        <div className="rounded-lg bg-[#F2F6FF] p-4 border border-blue-50">
          <div className="flex items-center justify-between text-xs font-bold text-[#1B2560] mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Audit Checkpoint / Freeze Record
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {detail.frozenAt ? formatDate(detail.frozenAt) : 'Pending Freeze'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Frozen by:</span>
              <span className="font-semibold text-slate-800">
                {detail.frozenBy || '—'}
              </span>
            </div>
            <div className="mt-2 text-slate-700">
              <span className="text-slate-500 font-medium">Freeze Note:</span>
              <p className="mt-1 rounded bg-white p-2.5 text-xs font-mono text-slate-800 border border-slate-200/80">
                {detail.freezeNote || 'Sprint has not been frozen yet.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoints Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <Flag className="h-4 w-4 text-[#1B2560]" />
            Audit Checkpoints Captured ({detail.checkpoints?.length || 0})
          </h3>
          <span className="text-xs text-slate-500">
            Immutable snapshot of HEAD commits
          </span>
        </div>

        {detail.checkpoints && detail.checkpoints.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {detail.checkpoints.map((cp) => (
              <CheckpointCard key={cp.checkpointId} checkpoint={cp} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            No audit checkpoints recorded for this sprint. Checkpoints are automatically captured when a sprint is frozen.
          </div>
        )}
      </div>

      {/* Recent Commits Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-[#1B2560]" />
            Recent Commits ({detail.recentCommits?.length || 0})
          </h3>
          <span className="text-xs text-slate-500">
            Synced from GitHub repository
          </span>
        </div>

        {detail.recentCommits && detail.recentCommits.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5">SHA</th>
                  <th className="px-4 py-2.5">Message</th>
                  <th className="px-4 py-2.5">Author</th>
                  <th className="px-4 py-2.5 text-center">Changes</th>
                  <th className="px-4 py-2.5">Committed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {detail.recentCommits.map((c) => (
                  <tr key={c.commitSha} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-[#1B2560]">
                      {truncateSha(c.commitSha)}
                    </td>
                    <td className="px-4 py-3 text-slate-800 max-w-sm truncate">
                      {c.message}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      @{c.authorUsername}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-emerald-700 font-bold flex items-center">
                          +{c.additions}
                        </span>
                        <span className="text-rose-700 font-bold flex items-center">
                          -{c.deletions}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          ({c.changedFiles} files)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {formatDate(c.committedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            No recent commits recorded for this sprint yet.
          </div>
        )}
      </div>

      {/* Review Flags Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#2E45A2]" />
            Associated Review Flags ({detail.reviewFlags?.length || 0})
          </h3>
          <span className="text-xs text-slate-500">
            Activity flags requiring organizer review
          </span>
        </div>

        {detail.reviewFlags && detail.reviewFlags.length > 0 ? (
          <div className="space-y-3">
            {detail.reviewFlags.map((flag) => {
              const sevConfig = getSeverityConfig(flag.severity);
              const typeInfo = getReviewFlagTypeLabel(flag.type);

              return (
                <div
                  key={flag.id}
                  className="rounded-lg border border-amber-200 bg-amber-50/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        {typeInfo.badge}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">
                        {flag.title}
                      </h4>
                      <span
                        className={`rounded-full border px-2 py-0.2 text-[10px] font-bold ${sevConfig.bg} ${sevConfig.text} ${sevConfig.border}`}
                      >
                        {sevConfig.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Team {flag.teamNumber} • {formatDate(flag.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                    {flag.description}
                  </p>

                  {flag.type === 'POST_CHECKPOINT_ACTIVITY' && (
                    <div className="mt-2 text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded">
                      <strong>Audit Note:</strong> This commit was detected after the recorded checkpoint while the sprint was frozen.
                    </div>
                  )}

                  {flag.commitSha && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-slate-600">
                      <GitCommit className="h-3.5 w-3.5 text-slate-400" />
                      <span>Commit SHA:</span>
                      <span className="font-bold text-[#1B2560]">{flag.commitSha}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            No open review flags for this sprint.
          </div>
        )}
      </div>
    </div>
  );
}
