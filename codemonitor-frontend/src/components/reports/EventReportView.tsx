'use client';

import { useEffect, useState } from 'react';
import { EventReportResponse } from '@/types/api';
import { getEventReport } from '@/lib/api/reports';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getSprintStatusConfig } from '@/lib/utils/formatters';
import {
  Users,
  GitFork,
  GitCommit,
  ShieldAlert,
  Flag,
} from 'lucide-react';

export default function EventReportView() {
  const [report, setReport] = useState<EventReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  const fetchReport = () => {
    setLoading(true);
    setError(null);
    getEventReport()
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const errorObj = err as { message?: string; status?: number };
        setError({
          message: errorObj.message || 'Failed to load event audit report.',
          status: errorObj.status,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getEventReport()
      .then((data) => {
        if (!ignore) {
          setReport(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to load event audit report.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
        <LoadingSpinner label="Generating Event Audit Report from backend..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <ErrorMessage
        title="Failed to Load Event Report"
        message={error?.message || 'Report not available.'}
        status={error?.status}
        onRetry={fetchReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                Event: {report.eventStatus}
              </span>
              <span className="font-mono text-xs text-slate-500">
                Sprint #{report.currentSprintNumber} Active
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#1F2937] mt-1">
              IdeaX 2026 Hackathon Global Audit Report
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Checkpoint Completion
            </span>
            <p className="text-2xl font-bold text-[#1B2560]">
              {report.checkpointCompletionPercentage}%
            </p>
          </div>
        </div>

        {/* Global Key Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Teams
            </span>
            <p className="mt-1 text-xl font-bold text-[#1F2937]">
              {report.totalTeams}
            </p>
          </div>

          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <GitFork className="h-3 w-3" />
              Repositories
            </span>
            <p className="mt-1 text-xl font-bold text-[#1F2937]">
              {report.totalRepositories}
            </p>
          </div>

          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <GitCommit className="h-3 w-3" />
              Total Commits
            </span>
            <p className="mt-1 text-xl font-bold text-[#1F2937]">
              {report.totalCommits}
            </p>
          </div>

          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Contributors
            </span>
            <p className="mt-1 text-xl font-bold text-[#1F2937]">
              {report.totalContributors}
            </p>
          </div>

          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <Flag className="h-3 w-3" />
              Checkpoints
            </span>
            <p className="mt-1 text-xl font-bold text-[#1F2937]">
              {report.totalCheckpointsCreated}
            </p>
          </div>

          <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-200">
            <span className="text-[10px] font-semibold text-amber-800 uppercase flex items-center justify-center gap-1">
              <ShieldAlert className="h-3 w-3 text-amber-600" />
              Open Flags
            </span>
            <p className="mt-1 text-xl font-bold text-amber-900">
              {report.openReviewFlags}
            </p>
          </div>
        </div>
      </div>

      {/* Sprints Audit Progress Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#1B2560]" />
              Sprint Audit Schedule & Checkpoints Breakdown
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit status across all event development phases
            </p>
          </div>
          <span className="text-xs font-semibold text-[#1B2560]">
            {report.sprints.filter((s) => s.status === 'FROZEN').length} of {report.sprints.length} Frozen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Sprint Number</th>
                <th className="px-4 py-3">Phase Name</th>
                <th className="px-4 py-3">Audit Status</th>
                <th className="px-4 py-3 text-center">Recorded Checkpoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.sprints.map((s) => {
                const config = getSprintStatusConfig(s.status);
                return (
                  <tr key={s.sprintNumber} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-[#1B2560]">
                      #{s.sprintNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {s.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${config.bg} ${config.text} ${config.border}`}
                      >
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                      {s.checkpointsCount}
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
