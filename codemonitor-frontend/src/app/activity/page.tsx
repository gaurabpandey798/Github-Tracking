'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  ScrollText,
  ShieldAlert,
  GitCommit,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import ActivityFilterBar, { FilterState } from '@/components/activity/ActivityFilterBar';
import ActivityTimeline from '@/components/activity/ActivityTimeline';
import ActivityTable from '@/components/activity/ActivityTable';
import ActivityDetailModal from '@/components/activity/ActivityDetailModal';
import AuditLogTable from '@/components/activity/AuditLogTable';
import { getActivityFeed } from '@/lib/api/activity';
import { getAuditLogs } from '@/lib/api/auditLogs';
import { getTeams } from '@/lib/api/teams';
import {
  ActivityItem,
  AuditLogItem,
  PagedResponse,
  TeamEntity,
} from '@/types/api';

export default function ActivityPage() {
  // Navigation & View tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'audit'>('feed');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    teamId: undefined,
    type: 'ALL',
    severity: 'ALL',
    search: '',
    pageSize: 50,
  });

  // Audit tab filters
  const [auditTeamId, setAuditTeamId] = useState<number | undefined>(undefined);
  const [auditAction, setAuditAction] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditPage, setAuditPage] = useState<number>(0);

  // Pagination for Activity feed
  const [page, setPage] = useState<number>(0);

  // Data states
  const [activityData, setActivityData] = useState<PagedResponse<ActivityItem> | null>(null);
  const [auditData, setAuditData] = useState<PagedResponse<AuditLogItem> | null>(null);
  const [teams, setTeams] = useState<TeamEntity[]>([]);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Selected item for modal
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Load teams once on mount
  useEffect(() => {
    async function loadTeams() {
      try {
        const teamList = await getTeams();
        setTeams(teamList);
      } catch (err: unknown) {
        console.error('Failed to load teams:', err);
      }
    }
    loadTeams();
  }, []);

  // Fetch Activity Feed for manual refresh
  const refreshActivities = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getActivityFeed({
        teamId: filters.teamId,
        type: filters.type,
        severity: filters.severity,
        search: filters.search,
        page,
        size: filters.pageSize,
      });
      setActivityData(res);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load activity stream.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [filters, page]);

  // Fetch Audit Logs for manual refresh
  const refreshAuditLogs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getAuditLogs({
        teamId: auditTeamId,
        action: auditAction,
        page: auditPage,
        size: 50,
      });
      setAuditData(res);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [auditTeamId, auditAction, auditPage]);

  // Primary data synchronization effect
  useEffect(() => {
    let ignore = false;

    if (activeTab === 'feed') {
      getActivityFeed({
        teamId: filters.teamId,
        type: filters.type,
        severity: filters.severity,
        search: filters.search,
        page,
        size: filters.pageSize,
      })
        .then((res) => {
          if (!ignore) {
            setActivityData(res);
            setErrorMessage(null);
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            setErrorMessage(
              err instanceof Error ? err.message : 'Failed to load activity stream.'
            );
            setIsLoading(false);
          }
        });
    } else {
      getAuditLogs({
        teamId: auditTeamId,
        action: auditAction,
        page: auditPage,
        size: 50,
      })
        .then((res) => {
          if (!ignore) {
            setAuditData(res);
            setErrorMessage(null);
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            setErrorMessage(
              err instanceof Error ? err.message : 'Failed to load audit logs.'
            );
            setIsLoading(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [activeTab, filters, page, auditTeamId, auditAction, auditPage]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        if (activeTab === 'feed') {
          refreshActivities();
        } else {
          refreshAuditLogs();
        }
      }, 30000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, activeTab, refreshActivities, refreshAuditLogs]);

  // Handle filter changes (resets page to 0)
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleAuditFilterChange = (teamId?: number, action?: string, search?: string) => {
    setAuditTeamId(teamId);
    if (action !== undefined) setAuditAction(action);
    if (search !== undefined) setAuditSearch(search);
    setAuditPage(0);
  };

  const handleManualRefresh = () => {
    if (activeTab === 'feed') {
      refreshActivities();
    } else {
      refreshAuditLogs();
    }
  };

  // Metrics computation from current page items
  const items = activityData?.items || [];
  const totalCommitsInFeed = items.filter((i) => i.type === 'COMMIT').length;
  const totalAuditInFeed = items.filter((i) => i.type === 'AUDIT' || i.type === 'PARTICIPANT' || i.type === 'SPRINT').length;
  const totalRequiresReview = items.filter((i) => i.requiresReview).length;

  return (
    <div className="min-h-screen bg-[#F2F6FF]/60 flex flex-col">
      <Header
        title="Activity & Audit Center"
        subtitle="Chronological audit stream, event lifecycle tracking, and review indicators across IdeaX teams."
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric summary counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Activities
              </span>
              <Layers className="w-4 h-4 text-[#1B2560]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#1B2560] mt-1 font-mono">
              {activityData?.totalElements ?? '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Unified event stream</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Commits Logged
              </span>
              <GitCommit className="w-4 h-4 text-[#2E45A2]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#2E45A2] mt-1 font-mono">
              {totalCommitsInFeed}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Commits in view</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Audit Actions
              </span>
              <ScrollText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 font-mono">
              {auditData?.totalElements ?? totalAuditInFeed}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Administrative events</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Requires Review
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1 font-mono">
              {totalRequiresReview}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated heuristics</div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg shadow-sm">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'feed'
                ? 'border-[#1B2560] text-[#1B2560]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity Feed</span>
            {activityData && (
              <span className="ml-1 text-[11px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                {activityData.totalElements}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-[#1B2560] text-[#1B2560]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Audit Logs</span>
            {auditData && (
              <span className="ml-1 text-[11px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                {auditData.totalElements}
              </span>
            )}
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3.5 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Activity Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <ActivityFilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              teams={teams}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
              autoRefresh={autoRefresh}
              onAutoRefreshToggle={setAutoRefresh}
              totalCount={activityData?.totalElements || 0}
            />

            {/* View Mode: Timeline vs Table */}
            {viewMode === 'timeline' ? (
              <ActivityTimeline
                activities={activityData?.items || []}
                onSelectActivity={(act) => setSelectedActivity(act)}
                isLoading={isLoading}
              />
            ) : (
              <ActivityTable
                activities={activityData?.items || []}
                onSelectActivity={(act) => setSelectedActivity(act)}
                isLoading={isLoading}
              />
            )}

            {/* Pagination Controls */}
            {activityData && activityData.totalPages > 1 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between text-xs shadow-sm">
                <div className="text-slate-500">
                  Showing page <span className="font-bold text-slate-800">{activityData.page + 1}</span> of{' '}
                  <span className="font-bold text-slate-800">{activityData.totalPages}</span> ({activityData.totalElements} total activities)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={activityData.page <= 0 || isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="font-mono text-slate-700 px-2">
                    {activityData.page + 1} / {activityData.totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!activityData.hasNext || isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Audit Logs */}
        {activeTab === 'audit' && (
          <AuditLogTable
            auditLogs={auditData}
            teams={teams}
            isLoading={isLoading}
            onRefresh={handleManualRefresh}
            onPageChange={(p) => setAuditPage(p)}
            onFilterChange={handleAuditFilterChange}
            currentTeamId={auditTeamId}
            currentAction={auditAction}
            currentSearch={auditSearch}
          />
        )}

        {/* Modal for detailed inspection */}
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      </main>
    </div>
  );
}
