'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import CurrentSprintCard from '@/components/dashboard/CurrentSprintCard';
import ReleaseDialog from '@/components/sprints/ReleaseDialog';
import FreezeDialog from '@/components/sprints/FreezeDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getEventStatus } from '@/lib/api/event';
import { getSprints } from '@/lib/api/sprints';
import { getReviewFlags } from '@/lib/api/reviewFlags';
import { EventStatusResponse, SprintSummary, ReviewFlag } from '@/types/api';
import { formatDate, truncateSha, getSeverityConfig, getReviewFlagTypeLabel } from '@/lib/utils/formatters';
import Link from 'next/link';
import {
  Activity,
  Users,
  GitFork,
  UserCheck,
  ShieldAlert,
  Flag,
  ArrowRight,
  GitCommit,
  Timer,
} from 'lucide-react';

export default function DashboardPage() {
  const [event, setEvent] = useState<EventStatusResponse | null>(null);
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Dialog states
  const [releaseSprintTarget, setReleaseSprintTarget] = useState<SprintSummary | null>(null);
  const [freezeSprintTarget, setFreezeSprintTarget] = useState<SprintSummary | null>(null);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [eventData, sprintsData, flagsData] = await Promise.all([
        getEventStatus(),
        getSprints(),
        getReviewFlags('OPEN'),
      ]);

      setEvent(eventData);
      setSprints(sprintsData);
      setFlags(flagsData);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to communicate with backend server on port 8085.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([getEventStatus(), getSprints(), getReviewFlags('OPEN')])
      .then(([eventData, sprintsData, flagsData]) => {
        if (!ignore) {
          setEvent(eventData);
          setSprints(sprintsData);
          setFlags(flagsData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to communicate with backend server on port 8085.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Identify current sprint
  const currentSprint = (() => {
    if (!sprints || sprints.length === 0) return null;
    if (event?.currentSprintNumber) {
      const found = sprints.find((s) => s.sprintNumber === event.currentSprintNumber);
      if (found) return found;
    }
    // Fallback: active sprint, or most recently updated/released
    const active = sprints.find((s) => s.status === 'ACTIVE');
    if (active) return active;
    const frozen = [...sprints].filter((s) => s.status === 'FROZEN').pop();
    if (frozen) return frozen;
    return sprints[0];
  })();

  const totalCheckpoints = sprints.reduce((acc, s) => acc + (s.checkpointsCount || 0), 0);
  const openFlagsCount = event?.openReviewFlags ?? flags.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Event Operations Dashboard"
        subtitle="IdeaX 2026 Hackathon Code Monitoring & Audit"
        onRefresh={() => loadDashboardData(true)}
        isRefreshing={refreshing}
        eventStatus={event?.eventStatus || null}
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Connecting to backend and aggregating hackathon audit data..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Dashboard Metrics"
            message={error.message}
            status={error.status}
            onRetry={() => loadDashboardData(false)}
          />
        )}

        {/* Main Content */}
        {!loading && !error && event && (
          <>
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Event Status */}
              <StatCard
                title="Event Status"
                value={event.eventStatus}
                subtitle={event.startedAt ? `Started: ${formatDate(event.startedAt)}` : 'Hackathon in progress'}
                icon={Activity}
                badge={{
                  text: event.eventStatus,
                  variant: event.eventStatus === 'ACTIVE' ? 'emerald' : 'slate',
                }}
              />

              {/* Current Sprint */}
              <StatCard
                title="Current Sprint"
                value={currentSprint ? `#${currentSprint.sprintNumber}` : '—'}
                subtitle={currentSprint ? currentSprint.name : 'No sprint designated'}
                icon={Timer}
                badge={
                  currentSprint
                    ? {
                        text: currentSprint.status,
                        variant: currentSprint.status === 'ACTIVE' ? 'emerald' : 'blue',
                      }
                    : undefined
                }
              />

              {/* Total Teams */}
              <StatCard
                title="Registered Teams"
                value={event.teamCount !== undefined ? event.teamCount : 'Not available'}
                subtitle="Monitored teams"
                icon={Users}
              />

              {/* Total Developers */}
              <StatCard
                title="Total Developers"
                value={event.participantCount !== undefined ? event.participantCount : 'Not available'}
                subtitle="Tracked participants"
                icon={UserCheck}
              />

              {/* Repository Count */}
              <StatCard
                title="Repositories"
                value={event.repositoryCount !== undefined ? event.repositoryCount : 'Not available'}
                subtitle="GitHub team repos"
                icon={GitFork}
              />

              {/* Open Review Flags */}
              <StatCard
                title="Open Review Flags"
                value={openFlagsCount}
                subtitle="Requires organizer review"
                icon={ShieldAlert}
                highlight={openFlagsCount > 0}
                badge={{
                  text: openFlagsCount > 0 ? 'Needs Attention' : 'Clean',
                  variant: openFlagsCount > 0 ? 'amber' : 'emerald',
                }}
              />
            </div>

            {/* Current Sprint Section Prominently Displayed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Current Active Phase
                </h2>
                <Link
                  href="/sprints"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B2560] hover:text-[#2E45A2]"
                >
                  <span>Manage All Sprints</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <CurrentSprintCard
                sprint={currentSprint}
                totalSprints={sprints.length || 8}
                onRelease={(s) => setReleaseSprintTarget(s)}
                onFreeze={(s) => setFreezeSprintTarget(s)}
              />
            </div>

            {/* Two Column Grid: Sprints Status & Open Review Flags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sprints Overview Snapshot */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                      <Flag className="h-4 w-4 text-[#1B2560]" />
                      Sprints Schedule ({sprints.length})
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      Checkpoints: {totalCheckpoints}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                    {sprints.map((s) => (
                      <div
                        key={s.id}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#1B2560]">
                            #{s.sprintNumber}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {s.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {s.frozenAt ? `Frozen: ${formatDate(s.frozenAt)}` : s.releasedAt ? `Released: ${formatDate(s.releasedAt)}` : 'Not started'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              s.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : s.status === 'FROZEN'
                                ? 'bg-sky-50 text-[#2E45A2] border-sky-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {s.status}
                          </span>
                          <Link
                            href={`/sprints?id=${s.id}`}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="View sprint details"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-right">
                  <Link
                    href="/sprints"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1B2560] hover:underline"
                  >
                    View Sprint Management Table
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Review Center Highlights */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-[#2E45A2]" />
                      Open Review Flags ({flags.length})
                    </h3>
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Requires Organizer Review
                    </span>
                  </div>

                  {flags.length > 0 ? (
                    <div className="mt-3 space-y-3 max-h-[360px] overflow-y-auto">
                      {flags.map((flag) => {
                        const sevConfig = getSeverityConfig(flag.severity);
                        const typeInfo = getReviewFlagTypeLabel(flag.type);

                        return (
                          <div
                            key={flag.id}
                            className="rounded-lg border border-amber-200/80 bg-amber-50/30 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-[#1B2560] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                  {flag.team?.teamName || `Team ${flag.team?.teamNumber || '—'}`}
                                </span>
                                <span className="rounded bg-[#F2F6FF] px-1.5 py-0.2 text-[9px] font-bold text-[#1B2560] border border-blue-100">
                                  {typeInfo.badge}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.2 text-[9px] font-bold ${sevConfig.bg} ${sevConfig.text} ${sevConfig.border}`}
                                >
                                  {sevConfig.label}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(flag.createdAt)}
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs font-bold text-slate-900">
                              {flag.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                              {flag.description}
                            </p>

                            {flag.type === 'POST_CHECKPOINT_ACTIVITY' && (
                              <p className="mt-1.5 text-[11px] text-[#1B2560] font-medium bg-blue-50/70 p-1.5 rounded border border-blue-100">
                                Activity occurred after Sprint {flag.sprint?.sprintNumber || '—'} checkpoint freeze.
                              </p>
                            )}

                            {flag.commitSha && (
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-mono text-slate-500">
                                <GitCommit className="h-3 w-3" />
                                <span>Commit:</span>
                                <span className="font-bold text-slate-700">
                                  {truncateSha(flag.commitSha, 8)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No open review flags. All team commit activity is aligned with checkpoints.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-right">
                  <Link
                    href="/review-center"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1B2560] hover:underline"
                  >
                    Open Review Center
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Release Dialog */}
      <ReleaseDialog
        sprint={releaseSprintTarget}
        isOpen={!!releaseSprintTarget}
        onClose={() => setReleaseSprintTarget(null)}
        onSuccess={() => loadDashboardData(true)}
      />

      {/* Freeze Dialog */}
      <FreezeDialog
        sprint={freezeSprintTarget}
        isOpen={!!freezeSprintTarget}
        onClose={() => setFreezeSprintTarget(null)}
        onSuccess={() => loadDashboardData(true)}
      />
    </div>
  );
}
