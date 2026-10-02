'use client';

import { useState } from 'react';
import { ReviewFlag } from '@/types/api';
import {
  formatDate,
  truncateSha,
  getSeverityConfig,
  getReviewFlagTypeLabel,
} from '@/lib/utils/formatters';
import {
  CheckCircle2,
  Check,
  Copy,
  Info,
  UserCheck,
} from 'lucide-react';

interface ReviewFlagCardProps {
  flag: ReviewFlag;
  onResolve?: (flag: ReviewFlag) => void;
}

export default function ReviewFlagCard({ flag, onResolve }: ReviewFlagCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sevConfig = getSeverityConfig(flag.severity);
  const typeConfig = getReviewFlagTypeLabel(flag.type);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'REVIEWED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DISMISSED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Badge */}
            <span className="rounded-md bg-[#F2F6FF] px-2.5 py-0.5 text-[11px] font-bold text-[#1B2560] border border-blue-100">
              {typeConfig.badge}
            </span>

            {/* Severity Badge */}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${sevConfig.bg} ${sevConfig.text} ${sevConfig.border}`}
            >
              {sevConfig.label}
            </span>

            {/* Status Badge */}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                flag.status
              )}`}
            >
              {flag.status}
            </span>
          </div>

          <h3 className="mt-2 text-sm font-bold text-[#1F2937]">
            {flag.title}
          </h3>
        </div>

        {/* Resolve button for OPEN flags */}
        {flag.status === 'OPEN' && onResolve && (
          <button
            type="button"
            onClick={() => onResolve(flag)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolve Flag
          </button>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-slate-700 leading-relaxed">
        {flag.description}
      </p>

      {/* Specific explanation for POST_CHECKPOINT_ACTIVITY */}
      {flag.type === 'POST_CHECKPOINT_ACTIVITY' && (
        <div className="mt-3 rounded-lg bg-blue-50/70 p-3 border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-[#2E45A2] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#1B2560]">Post-Checkpoint Audit Notice:</span>{' '}
            This commit occurred after the recorded sprint checkpoint while the sprint was in a frozen audit state.
            Organizer review is recommended to assess whether this change affects judging.
          </div>
        </div>
      )}

      {/* Meta Grid: Team, Sprint, Commit SHA */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* Team */}
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Team & Repository
          </span>
          <p className="mt-0.5 font-bold text-slate-800">
            {flag.team?.teamName || `Team #${flag.team?.teamNumber || '—'}`}
          </p>
          <p className="font-mono text-[11px] text-slate-500 truncate">
            {flag.repository?.fullName || flag.repository?.name || '—'}
          </p>
        </div>

        {/* Sprint */}
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Associated Sprint
          </span>
          <p className="mt-0.5 font-bold text-slate-800">
            {flag.sprint?.name || `Sprint ${flag.sprint?.sprintNumber || '—'}`}
          </p>
          <p className="text-[11px] text-slate-500">
            Status: {flag.sprint?.status || '—'}
          </p>
        </div>

        {/* Commit SHA */}
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Commit Reference
          </span>
          {flag.commitSha ? (
            <div className="mt-0.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#1B2560]">
                {truncateSha(flag.commitSha, 10)}
              </span>
              <button
                type="button"
                onClick={() => handleCopySha(flag.commitSha!)}
                className="text-slate-400 hover:text-slate-700"
                title="Copy SHA"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ) : (
            <p className="mt-0.5 text-[11px] text-slate-500 italic">No specific commit</p>
          )}
          <p className="text-[10px] text-slate-400">
            {formatDate(flag.createdAt)}
          </p>
        </div>
      </div>

      {/* Resolution Details (if reviewed/dismissed) */}
      {flag.status !== 'OPEN' && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Resolution Record</span>
          </div>
          <p className="text-slate-600 italic">
            {flag.reviewNote || 'Resolved without additional notes.'}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            {flag.reviewedBy && <span>By: {flag.reviewedBy}</span>}
            {flag.reviewedAt && <span>At: {formatDate(flag.reviewedAt)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
