'use client';

import { useEffect, useState } from 'react';
import { SprintReportResponse, SprintSummary } from '@/types/api';
import { getSprintReport } from '@/lib/api/reports';
import { getSprints } from '@/lib/api/sprints';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatDate, truncateSha, getSprintStatusConfig } from '@/lib/utils/formatters';
import {
  Timer,
  Users,
  GitCommit,
  Plus,
  Minus,
  ShieldAlert,
  Flag,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface SprintReportViewProps {
  initialSprintId?: number;
}

export default function SprintReportView({ initialSprintId = 1 }: SprintReportViewProps) {
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number>(initialSprintId);
  const [report, setReport] = useState<SprintReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Fetch available sprints for selector
  useEffect(() => {
    let ignore = false;
    getSprints()
      .then((data) => {
        if (!ignore) {
          setSprints(data);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch report for selected sprint
  const fetchReport = (sprintId: number) => {
    setLoading(true);
    setError(null);
    getSprintReport(sprintId)
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const errorObj = err as { message?: string; status?: number };
        setError({
          message: errorObj.message || `Failed to load report for Sprint #${sprintId}.`,
          status: errorObj.status,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getSprintReport(selectedSprintId)
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
            message: errorObj.message || `Failed to load report for Sprint #${selectedSprintId}.`,
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedSprintId]);

  const sprintConfig = getSprintStatusConfig(report?.status);

  return (
    <div className="space-y-6">
      {/* Sprint Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Timer className="h-4 w-4 text-[#1B2560]" />
          <span>Select Sprint Audit Phase:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(sprints.length > 0
            ? sprints
            : [{ id: 1, sprintNumber: 1 }, { id: 2, sprintNumber: 2 }, { id: 3, sprintNumber: 3 }]
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSprintId(s.sprintNumber)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedSprintId === s.sprintNumber
                  ? 'bg-[#1B2560] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sprint {s.sprintNumber}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
          <LoadingSpinner label={`Loading Sprint #${selectedSprintId} audit report...`} />
        </div>
      )}

      {error && !loading && (
        <ErrorMessage
          title={`Sprint #${selectedSprintId} Report Error`}
          message={error.message}
          status={error.status}
          onRetry={() => fetchReport(selectedSprintId)}
        />
      )}

      {!loading && !error && report && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                    Sprint #{report.sprintNumber}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${sprintConfig.bg} ${sprintConfig.text} ${sprintConfig.border}`}
                  >
                    {sprintConfig.label}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#1F2937] mt-0.5">
                  {report.sprintName}
                </h3>
              </div>

              <div className="text-right text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Released:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(report.releasedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Frozen:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(report.frozenAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
                <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  Teams Completed
                </span>
                <p className="mt-1 text-xl font-bold text-[#1F2937]">
                  {report.teamCompletionCount} / {report.totalTeams}
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

              <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase flex items-center justify-center gap-0.5">
                  <Plus className="h-3 w-3" />
                  Additions
                </span>
                <p className="mt-1 text-xl font-bold text-emerald-900">
                  +{report.totalAdditions}
                </p>
              </div>

              <div className="rounded-lg bg-rose-50/70 p-3 border border-rose-200">
                <span className="text-[10px] font-semibold text-rose-800 uppercase flex items-center justify-center gap-0.5">
                  <Minus className="h-3 w-3" />
                  Deletions
                </span>
                <p className="mt-1 text-xl font-bold text-rose-900">
                  -{report.totalDeletions}
                </p>
              </div>

              <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-200">
                <span className="text-[10px] font-semibold text-amber-800 uppercase flex items-center justify-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-600" />
                  Flags Count
                </span>
                <p className="mt-1 text-xl font-bold text-amber-900">
                  {report.flagsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Sprint Checkpoints Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#1B2560]" />
                Captured Team Checkpoints ({report.checkpoints?.length || 0})
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Immutable audit snapshot
              </span>
            </div>

            {report.checkpoints && report.checkpoints.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Repository</th>
                      <th className="px-4 py-3">Checkpoint SHA</th>
                      <th className="px-3 py-3 text-center">Commits</th>
                      <th className="px-3 py-3 text-center">Devs</th>
                      <th className="px-3 py-3 text-center">Files</th>
                      <th className="px-3 py-3 text-center">Add / Del</th>
                      <th className="px-4 py-3">Last Activity</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.checkpoints.map((cp) => (
                      <tr key={cp.teamNumber} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800">{cp.teamName}</span>
                          <span className="block text-[10px] text-slate-400">Team #{cp.teamNumber}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {cp.repositoryName}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-[#1B2560]">
                          {truncateSha(cp.commitSha, 7)}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {cp.commitCount}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {cp.developerCount}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {cp.filesChanged}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">+{cp.additions}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-rose-700 font-bold">-{cp.deletions}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {formatDate(cp.lastActivityAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            {cp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No checkpoints captured for this sprint.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
