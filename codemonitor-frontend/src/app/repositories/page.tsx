'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import RepositoryTable from '@/components/repositories/RepositoryTable';
import SyncResultModal from '@/components/repositories/SyncResultModal';
import RepositoryDetailModal from '@/components/repositories/RepositoryDetailModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { getRepositories, syncRepository, setupTeam4NF } from '@/lib/api/repositories';
import Link from 'next/link';
import { GitRepositoryEntity, RepositorySyncResponse } from '@/types/api';
import { GitFork, PlusCircle, AlertCircle, CheckCircle2, Loader2, Info, Users } from 'lucide-react';

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<GitRepositoryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Sync state
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<RepositorySyncResponse | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Setup state
  const [settingUp, setSettingUp] = useState(false);

  // Detail modal state
  const [selectedRepo, setSelectedRepo] = useState<GitRepositoryEntity | null>(null);

  const fetchRepositories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to fetch repositories from backend.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getRepositories()
      .then((data) => {
        if (!ignore) {
          setRepositories(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to fetch repositories from backend.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSync = async (repo: GitRepositoryEntity) => {
    setSyncingId(repo.id);
    setActionNotice(null);

    try {
      const result = await syncRepository(repo.id);
      setSyncResult(result);
      setActionNotice({
        type: 'success',
        message: `Successfully synced ${repo.name}. Recorded ${result.newCommitsCount} new commit(s).`,
      });
      // Refresh repository records
      await fetchRepositories(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setActionNotice({
        type: 'error',
        message: `Sync failed for ${repo.name}: ${errorObj.message || 'Server error'}`,
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSetupTeam4NF = async () => {
    setSettingUp(true);
    setActionNotice(null);

    try {
      await setupTeam4NF();
      setActionNotice({
        type: 'success',
        message: 'Team 4NF repository setup triggered successfully.',
      });
      await fetchRepositories(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setActionNotice({
        type: 'error',
        message: `Team 4NF setup failed: ${errorObj.message || 'Server error'}`,
      });
    } finally {
      setSettingUp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Repository Management"
        subtitle="Monitor GitHub repositories, commit trees, and webhook sync"
        onRefresh={() => fetchRepositories(true)}
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

        {/* Backend Registry Source-of-Truth Callout */}
        <div className="rounded-xl border border-blue-200 bg-[#F2F6FF] p-4 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
          <Info className="h-5 w-5 text-[#1B2560] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#1B2560]">
              Backend Database Registry Source of Truth
            </p>
            <p className="text-slate-600 leading-relaxed">
              Only repositories explicitly registered in CodeMonitor&apos;s backend database are tracked for audit checkpoints, commit streams, and review flags. Creating or hosting a repository on GitHub does <strong className="font-semibold text-slate-800">not</strong> automatically register it with CodeMonitor until registered in the backend.
            </p>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-[#1B2560]" />
            <h2 className="text-base font-bold text-[#1F2937]">
              Monitored Team Repositories ({repositories.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B2560] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Users className="h-3.5 w-3.5 text-[#1B2560]" />
              <span>Manage Teams &amp; Registrations</span>
            </Link>

            {/* Optional explicit Team 4NF Setup button */}
            <button
              type="button"
              onClick={handleSetupTeam4NF}
              disabled={settingUp}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
              title="Explicitly register/re-sync Team 4NF repository integration"
            >
              {settingUp ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlusCircle className="h-3.5 w-3.5 text-[#2E45A2]" />
              )}
              <span>{settingUp ? 'Configuring...' : 'Setup Team 4NF'}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Fetching repository registry from backend..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Repositories"
            message={error.message}
            status={error.status}
            onRetry={() => fetchRepositories(false)}
          />
        )}

        {/* Table or Empty State */}
        {!loading && !error && (
          repositories.length === 0 ? (
            <EmptyState
              title="No Repositories Registered"
              description="No team repositories are currently registered in CodeMonitor's database. Creating a GitHub repository does not automatically register it here; repositories must be registered through the backend to be monitored."
              action={{
                label: 'Setup Team 4NF Repository',
                onClick: handleSetupTeam4NF,
              }}
            />
          ) : (
            <RepositoryTable
              repositories={repositories}
              syncingId={syncingId}
              onSync={handleSync}
              onViewDetails={(repo) => setSelectedRepo(repo)}
            />
          )
        )}
      </div>

      {/* Sync Result Modal */}
      <SyncResultModal
        result={syncResult}
        isOpen={!!syncResult}
        onClose={() => setSyncResult(null)}
      />

      {/* Repository Detail Modal */}
      <RepositoryDetailModal
        repository={selectedRepo}
        isOpen={!!selectedRepo}
        onClose={() => setSelectedRepo(null)}
        onSync={handleSync}
      />
    </div>
  );
}
