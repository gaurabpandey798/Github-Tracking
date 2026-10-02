'use client';

import { useState } from 'react';
import { ReviewFlag } from '@/types/api';
import {
  formatDate,
  truncateSha,
  getSeverityConfig,
  getReviewFlagTypeLabel,
} from '@/lib/utils/formatters';
import { CheckCircle2, Copy, Check, Filter } from 'lucide-react';

interface ReviewFlagTableProps {
  flags: ReviewFlag[];
  onResolve: (flag: ReviewFlag) => void;
  statusFilter: string;
  onFilterChange: (status: string) => void;
}

export default function ReviewFlagTable({
  flags,
  onResolve,
  statusFilter,
  onFilterChange,
}: ReviewFlagTableProps) {
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

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
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="h-4 w-4 text-[#2E45A2]" />
          <span>Status Filter:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {['ALL', 'OPEN', 'REVIEWED', 'DISMISSED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange(st)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#1B2560] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Severity</th>
                <th className="px-4 py-3.5">Team</th>
                <th className="px-4 py-3.5">Type & Title</th>
                <th className="px-4 py-3.5">Sprint</th>
                <th className="px-4 py-3.5">Commit SHA</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created At</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flags.map((flag) => {
                const sevConfig = getSeverityConfig(flag.severity);
                const typeInfo = getReviewFlagTypeLabel(flag.type);

                return (
                  <tr key={flag.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Severity */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${sevConfig.bg} ${sevConfig.text} ${sevConfig.border}`}
                      >
                        {sevConfig.label}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">
                        {flag.team?.teamName || `Team ${flag.team?.teamNumber || '—'}`}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                        {flag.repository?.name || '—'}
                      </div>
                    </td>

                    {/* Type & Title */}
                    <td className="px-4 py-3.5 max-w-sm">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="rounded bg-[#F2F6FF] px-1.5 py-0.2 text-[9px] font-bold text-[#1B2560] border border-blue-100 uppercase">
                          {typeInfo.badge}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {flag.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {flag.description}
                      </p>
                      {flag.type === 'POST_CHECKPOINT_ACTIVITY' && (
                        <p className="text-[10px] text-amber-800 font-medium mt-1">
                          Activity detected after sprint checkpoint freeze.
                        </p>
                      )}
                    </td>

                    {/* Sprint */}
                    <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {flag.sprint?.name || `Sprint ${flag.sprint?.sprintNumber || '—'}`}
                    </td>

                    {/* Commit SHA */}
                    <td className="px-4 py-3.5 font-mono text-[11px] whitespace-nowrap">
                      {flag.commitSha ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[#1B2560] font-bold">
                            {truncateSha(flag.commitSha, 7)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySha(flag.commitSha!)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                            title="Copy full SHA"
                          >
                            {copiedSha === flag.commitSha ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                          flag.status
                        )}`}
                      >
                        {flag.status}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDate(flag.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {flag.status === 'OPEN' ? (
                        <button
                          type="button"
                          onClick={() => onResolve(flag)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#1B2560] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-2xs"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 italic">
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
