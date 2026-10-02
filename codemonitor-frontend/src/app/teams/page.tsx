'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import TeamTable from '@/components/teams/TeamTable';
import AddTeamModal from '@/components/teams/AddTeamModal';
import RegisterRepositoryModal from '@/components/teams/RegisterRepositoryModal';
import TeamDetailModal from '@/components/teams/TeamDetailModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { getTeams } from '@/lib/api/teams';
import { getRepositories } from '@/lib/api/repositories';
import { TeamEntity, GitRepositoryEntity, TeamWithRepository } from '@/types/api';
import { Users, Plus, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function TeamsPage() {
  const [teamsWithRepos, setTeamsWithRepos] = useState<TeamWithRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals state
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [registeringTeam, setRegisteringTeam] = useState<TeamEntity | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithRepository | null>(null);

  // Notification state
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTeamsAndRepositories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [teamsData, reposData] = await Promise.all([
        getTeams(),
        getRepositories(),
      ]);

      const merged: TeamWithRepository[] = teamsData.map((t) => {
        const repo = reposData.find(
          (r) =>
            r.teamId === t.id ||
            r.teamNumber === t.teamNumber ||
            r.id === t.repositoryId
        );
        return {
          ...t,
          repository: repo || null,
        };
      });

      merged.sort((a, b) => a.teamNumber - b.teamNumber);
      setTeamsWithRepos(merged);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to fetch teams and repository mappings from backend.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    Promise.all([getTeams(), getRepositories()])
      .then(([teamsData, reposData]) => {
        if (!ignore) {
          const merged: TeamWithRepository[] = teamsData.map((t) => {
            const repo = reposData.find(
              (r) =>
                r.teamId === t.id ||
                r.teamNumber === t.teamNumber ||
                r.id === t.repositoryId
            );
            return {
              ...t,
              repository: repo || null,
            };
          });

          merged.sort((a, b) => a.teamNumber - b.teamNumber);
          setTeamsWithRepos(merged);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to fetch teams and repository mappings from backend.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleTeamCreated = (createdTeam: TeamEntity) => {
    setActionNotice({
      type: 'success',
      message: `Team ${createdTeam.teamNumber} (${createdTeam.teamName}) registered successfully.`,
    });
    fetchTeamsAndRepositories(true);
  };

  const handleRepositoryRegistered = (repo: GitRepositoryEntity) => {
    setActionNotice({
      type: 'success',
      message: `Repository ${repo.fullName} verified and mapped to Team ${repo.teamNumber || ''} successfully.`,
    });
    fetchTeamsAndRepositories(true);
  };

  const existingTeamNumbers = teamsWithRepos.map((t) => t.teamNumber);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Teams"
        subtitle="Manage IdeaX teams and their CodeMonitor repository mappings."
        onRefresh={() => fetchTeamsAndRepositories(true)}
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

        {/* Source of Truth Callout */}
        <div className="rounded-xl border border-blue-200 bg-[#F2F6FF] p-4 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
          <Info className="h-5 w-5 text-[#1B2560] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#1B2560]">
              Backend Database Registry Source of Truth
            </p>
            <p className="text-slate-600 leading-relaxed">
              Teams and their GitHub repository associations are strictly tracked in CodeMonitor&apos;s database. Each team is mapped to an official GitHub repository under the <span className="font-mono font-semibold">MBMC-IdeaX</span> organization. Creating or pushing repositories on GitHub does <strong className="font-semibold text-slate-800">not</strong> automatically register them here until registered through the backend.
            </p>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1B2560]" />
            <h2 className="text-base font-bold text-[#1F2937]">
              Registered Teams ({teamsWithRepos.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddTeamOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Team</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Fetching teams and repository mappings from backend..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Teams"
            message={error.message}
            status={error.status}
            onRetry={() => fetchTeamsAndRepositories(false)}
          />
        )}

        {/* Table or Empty State */}
        {!loading && !error && (
          teamsWithRepos.length === 0 ? (
            <EmptyState
              title="No Teams Registered"
              description="No IdeaX teams have been registered in CodeMonitor yet. Add a team to begin mapping GitHub repositories and monitoring audit activity."
              action={{
                label: 'Add Team',
                onClick: () => setIsAddTeamOpen(true),
              }}
            />
          ) : (
            <TeamTable
              teams={teamsWithRepos}
              onViewDetails={(team) => setSelectedTeam(team)}
              onRegisterRepo={(team) => setRegisteringTeam(team)}
            />
          )
        )}
      </div>

      {/* Add Team Modal */}
      <AddTeamModal
        isOpen={isAddTeamOpen}
        onClose={() => setIsAddTeamOpen(false)}
        onSuccess={handleTeamCreated}
        existingTeamNumbers={existingTeamNumbers}
      />

      {/* Register Repository Modal */}
      <RegisterRepositoryModal
        isOpen={!!registeringTeam}
        onClose={() => setRegisteringTeam(null)}
        team={registeringTeam}
        onSuccess={handleRepositoryRegistered}
      />

      {/* Team Detail Modal */}
      <TeamDetailModal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        team={selectedTeam}
        onRegisterRepo={(team) => setRegisteringTeam(team)}
      />
    </div>
  );
}
