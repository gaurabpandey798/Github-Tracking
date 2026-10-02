'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/layout/Header';
import DeveloperTable from '@/components/developers/DeveloperTable';
import DeveloperDetailModal from '@/components/developers/DeveloperDetailModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { getDevelopers, syncAllContributors } from '@/lib/api/developers';
import { getTeams } from '@/lib/api/teams';
import { DeveloperContributor, TeamEntity } from '@/types/api';
import {
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Users,
  GitCommit,
  ShieldCheck,
} from 'lucide-react';

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<DeveloperContributor[]>([]);
  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Detail Modal state
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperContributor | null>(null);

  // Notification state
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDevelopersData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [devs, teamsData] = await Promise.all([
        getDevelopers(),
        getTeams().catch(() => []),
      ]);
      setDevelopers(devs);
      setTeams(teamsData);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to aggregate developers from backend.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    Promise.all([getDevelopers(), getTeams().catch(() => [])])
      .then(([devs, teamsData]) => {
        if (!ignore) {
          setDevelopers(devs);
          setTeams(teamsData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to aggregate developers from backend.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSyncContributors = async () => {
    setSyncing(true);
    setActionNotice(null);

    try {
      const syncResult = await syncAllContributors();
      setActionNotice({
        type: 'success',
        message: `Successfully synchronized repository contributors across ${syncResult.successCount} monitored repo(s).`,
      });
      await fetchDevelopersData(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setActionNotice({
        type: 'error',
        message: `Contributor synchronization encountered an issue: ${errorObj.message || 'Network error'}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Filtered developers
  const filteredDevelopers = useMemo(() => {
    return developers.filter((dev) => {
      // Search matching: username, displayName, team name, repository name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchUser = dev.username.toLowerCase().includes(query);
        const matchName = dev.displayName?.toLowerCase().includes(query);
        const matchTeam = dev.teamName.toLowerCase().includes(query);
        const matchRepo = dev.repositoryName?.toLowerCase().includes(query);
        if (!matchUser && !matchName && !matchTeam && !matchRepo) {
          return false;
        }
      }

      // Team filter
      if (selectedTeamFilter !== 'ALL') {
        const teamNum = parseInt(selectedTeamFilter, 10);
        if (dev.teamNumber !== teamNum) {
          return false;
        }
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        if (dev.status !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [developers, searchQuery, selectedTeamFilter, selectedStatusFilter]);

  // High-level statistics
  const totalCommitsAuthored = useMemo(
    () => developers.reduce((acc, d) => acc + d.commitsCount, 0),
    [developers]
  );
  const registeredCount = useMemo(
    () => developers.filter((d) => d.status === 'REGISTERED').length,
    [developers]
  );
  const detectedCount = useMemo(
    () => developers.filter((d) => d.status === 'DETECTED').length,
    [developers]
  );
  const unknownCount = useMemo(
    () => developers.filter((d) => d.status === 'UNKNOWN').length,
    [developers]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Developers"
        subtitle="Monitor GitHub contributors and participant activity across IdeaX teams."
        onRefresh={() => fetchDevelopersData(true)}
        isRefreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`rounded-xl p-4 border text-xs flex items-center justify-between gap-3 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{actionNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Participant vs Contributor Architecture Notice */}
        <div className="rounded-xl border border-blue-200 bg-[#F2F6FF] p-4 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
          <Info className="h-5 w-5 text-[#1B2560] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#1B2560]">
              Contributor Detection &amp; Participant Roster Context
            </p>
            <p className="text-slate-600 leading-relaxed">
              GitHub commit authors are verified and categorized by CodeMonitor:
              contributors identified through Git commit history are marked as{' '}
              <strong className="font-semibold text-blue-800">Detected</strong>,
              enrolled participants appear as{' '}
              <strong className="font-semibold text-emerald-800">Registered</strong>, and
              unrecognized commit authors outside the official roster are flagged for organizer review as{' '}
              <strong className="font-semibold text-amber-800">Review Needed</strong>.
            </p>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Contributors
              </span>
              <UserCheck className="h-4 w-4 text-[#1B2560]" />
            </div>
            <p className="font-mono text-2xl font-bold text-[#1F2937] mt-2">
              {developers.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Active across all teams
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Enrolled Roster
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-700 mt-2">
              {registeredCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Officially registered
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detected Authors
              </span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-blue-700 mt-2">
              {detectedCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Discovered via commits
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Commits
              </span>
              <GitCommit className="h-4 w-4 text-[#2E45A2]" />
            </div>
            <p className="font-mono text-2xl font-bold text-[#1F2937] mt-2">
              {totalCommitsAuthored}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Aggregated from sprints
            </p>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, name, team, or repo..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden transition-colors"
              />
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden"
              >
                <option value="ALL">All Teams ({developers.length})</option>
                {teams.map((t) => {
                  const countForTeam = developers.filter((d) => d.teamNumber === t.teamNumber).length;
                  return (
                    <option key={t.id} value={t.teamNumber.toString()}>
                      Team #{t.teamNumber} ({t.teamName}) — {countForTeam}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="REGISTERED">Registered Roster ({registeredCount})</option>
                <option value="DETECTED">Detected Contributor ({detectedCount})</option>
                {unknownCount > 0 && (
                  <option value="UNKNOWN">Review Needed ({unknownCount})</option>
                )}
              </select>
            </div>
          </div>

          {/* Sync Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncContributors}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
              title="Synchronize repository commits and refresh contributor activity"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing contributors...' : 'Sync Contributors'}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Aggregating developer activity from backend..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Developers"
            message={error.message}
            status={error.status}
            onRetry={() => fetchDevelopersData(false)}
          />
        )}

        {/* Table or Empty States */}
        {!loading && !error && (
          developers.length === 0 ? (
            <EmptyState
              title="No GitHub Contributor Activity Detected"
              description="No contributor activity has been detected yet. When teams commit to their registered GitHub repositories, their activity will be tracked and audited here."
              action={{
                label: 'Sync Contributors Now',
                onClick: handleSyncContributors,
              }}
            />
          ) : filteredDevelopers.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-3">
              <UserCheck className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">No matching developers</h3>
              <p className="text-xs text-slate-500">
                No contributors match your search query or filter criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTeamFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <DeveloperTable
              developers={filteredDevelopers}
              onViewDetails={(dev) => setSelectedDeveloper(dev)}
            />
          )
        )}
      </div>

      {/* Developer Detail Modal */}
      <DeveloperDetailModal
        developer={selectedDeveloper}
        isOpen={!!selectedDeveloper}
        onClose={() => setSelectedDeveloper(null)}
      />
    </div>
  );
}
