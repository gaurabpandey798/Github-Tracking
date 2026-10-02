'use client';

import { useEffect, useState } from 'react';
import { TeamReportResponse, EnrichedCheckpoint } from '@/types/api';
import { getTeamReport } from '@/lib/api/reports';
import { getGlobalCheckpoints } from '@/lib/api/checkpoints';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatDate, truncateSha, getSeverityConfig } from '@/lib/utils/formatters';
import {
  Users,
  GitFork,
  GitCommit,
  Plus,
  Minus,
  Flag,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

interface DerivedTeam {
  teamId: number;
  teamNumber: number;
  teamName: string;
}

export default function TeamReportView() {
  const [teams, setTeams] = useState<DerivedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [report, setReport] = useState<TeamReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  const handleSelectTeam = (teamId: number) => {
    if (teamId === selectedTeamId) return;
    setSelectedTeamId(teamId);
    setReportLoading(true);
    setError(null);
  };

  // Derive valid teams from existing checkpoints
  useEffect(() => {
    let ignore = false;
    getGlobalCheckpoints()
      .then((cps: EnrichedCheckpoint[]) => {
        if (!ignore) {
          const map = new Map<number, DerivedTeam>();
          cps.forEach((c) => {
            if (!map.has(c.teamNumber)) {
              map.set(c.teamNumber, {
                teamId: c.teamNumber, // backend teamId maps directly to teamNumber in current dataset
                teamNumber: c.teamNumber,
                teamName: c.teamName,
              });
            }
          });
          const list = Array.from(map.values());
          setTeams(list);
          if (list.length > 0) {
            setSelectedTeamId(list[0].teamId);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          // Fallback to Team 1 if checkpoint aggregator fails
          setTeams([{ teamId: 1, teamNumber: 1, teamName: 'Team 4NF' }]);
          setSelectedTeamId(1);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch report when selected team changes
  useEffect(() => {
    if (!selectedTeamId) return;

    let ignore = false;

    getTeamReport(selectedTeamId)
      .then((data) => {
        if (!ignore) {
          setReport(data);
          setError(null);
          setReportLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || `Failed to load report for Team #${selectedTeamId}.`,
            status: errorObj.status,
          });
          setReportLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedTeamId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
        <LoadingSpinner label="Resolving team audit records from backend..." />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
        Team report selection requires team data from the backend. No active teams were found in the current sprint records.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Users className="h-4 w-4 text-[#1B2560]" />
          <span>Select Monitored Team:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teams.map((t) => (
            <button
              key={t.teamId}
              type="button"
              onClick={() => handleSelectTeam(t.teamId)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedTeamId === t.teamId
                  ? 'bg-[#1B2560] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Team {t.teamNumber}: {t.teamName}
            </button>
          ))}
        </div>
      </div>

      {reportLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
          <LoadingSpinner label={`Loading Team #${selectedTeamId} report...`} />
        </div>
      )}

      {error && !reportLoading && (
        <ErrorMessage
          title="Team Report Unavailable"
          message={error.message}
          status={error.status}
        />
      )}

      {!reportLoading && !error && report && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#1B2560] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                    Team #{report.teamNumber}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Status: {report.teamStatus}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#1F2937] mt-1">
                  {report.teamName}
                </h3>
              </div>

              {report.repository && (
                <a
                  href={report.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B2560] hover:bg-slate-50 shadow-2xs"
                >
                  <GitFork className="h-3.5 w-3.5" />
                  <span>{report.repository.fullName}</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
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
                  {report.uniqueContributors}
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
                  Flags
                </span>
                <p className="mt-1 text-xl font-bold text-amber-900">
                  {report.reviewFlags?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Commits by Sprint Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-[#1B2560]" />
              Commits by Sprint Breakdown
            </h4>

            {report.commitsBySprint && report.commitsBySprint.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5">Sprint</th>
                      <th className="px-4 py-2.5">Phase Name</th>
                      <th className="px-4 py-2.5 text-center">Commits</th>
                      <th className="px-4 py-2.5 text-center">Additions</th>
                      <th className="px-4 py-2.5 text-center">Deletions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.commitsBySprint.map((cs) => (
                      <tr key={cs.sprintNumber} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono font-bold text-[#1B2560]">
                          Sprint {cs.sprintNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {cs.sprintName}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {cs.commitCount}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-emerald-700 font-bold">
                          +{cs.additions}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-rose-700 font-bold">
                          -{cs.deletions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No sprint breakdown recorded yet.</p>
            )}
          </div>

          {/* Checkpoint History Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#1B2560]" />
              Immutable Checkpoint History
            </h4>

            {report.checkpointHistory && report.checkpointHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5">Sprint</th>
                      <th className="px-4 py-2.5">Recorded SHA</th>
                      <th className="px-4 py-2.5 text-center">Commits</th>
                      <th className="px-4 py-2.5 text-center">Files</th>
                      <th className="px-4 py-2.5 text-center">Add / Del</th>
                      <th className="px-4 py-2.5">Frozen Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.checkpointHistory.map((cp) => (
                      <tr key={cp.sprintNumber} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono font-bold text-[#1B2560]">
                          Sprint {cp.sprintNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-800">
                          {truncateSha(cp.commitSha, 8)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">
                          {cp.commitCount}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">
                          {cp.filesChanged}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">+{cp.additions}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-rose-700 font-bold">-{cp.deletions}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {formatDate(cp.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No checkpoints recorded for this team yet.</p>
            )}
          </div>

          {/* Associated Review Flags */}
          {report.reviewFlags && report.reviewFlags.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Team Review Flags ({report.reviewFlags.length})
              </h4>
              <div className="space-y-2.5">
                {report.reviewFlags.map((flag) => {
                  const sev = getSeverityConfig(flag.severity);
                  return (
                    <div
                      key={flag.id}
                      className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{flag.title}</span>
                          <span
                            className={`rounded-full border px-2 py-0.2 text-[9px] font-bold ${sev.bg} ${sev.text} ${sev.border}`}
                          >
                            {sev.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDate(flag.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-slate-600">{flag.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
