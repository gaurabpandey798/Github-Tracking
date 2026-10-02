'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import CommitTable from '@/components/commits/CommitTable';
import CommitDetailModal from '@/components/commits/CommitDetailModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { getGlobalCommits } from '@/lib/api/commits';
import { EnrichedCommit } from '@/types/api';
import { GitCommit } from 'lucide-react';

export default function CommitsPage() {
  const [commits, setCommits] = useState<EnrichedCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Detail Modal
  const [selectedCommit, setSelectedCommit] = useState<EnrichedCommit | null>(null);

  const fetchCommits = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getGlobalCommits();
      setCommits(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to aggregate commits from backend sprints.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getGlobalCommits()
      .then((data) => {
        if (!ignore) {
          setCommits(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to aggregate commits from backend sprints.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Global Commit Stream"
        subtitle="Aggregated commit audit feed synced across all active team repositories"
        onRefresh={() => fetchCommits(true)}
        isRefreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-[#1B2560]" />
            <h2 className="text-base font-bold text-[#1F2937]">
              Synced Commits ({commits.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Real commit records aggregated from sprint audit snapshots
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Aggregating commit records from sprint details..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Commits"
            message={error.message}
            status={error.status}
            onRetry={() => fetchCommits(false)}
          />
        )}

        {/* Commits Table or Empty State */}
        {!loading && !error && (
          commits.length === 0 ? (
            <EmptyState
              title="No Commits Found"
              description="No commit activity has been recorded in the active or frozen sprints yet. New commits appear when team repositories are synchronized."
            />
          ) : (
            <CommitTable
              commits={commits}
              onSelectCommit={(c) => setSelectedCommit(c)}
            />
          )
        )}
      </div>

      {/* Commit Detail Modal */}
      <CommitDetailModal
        commit={selectedCommit}
        isOpen={!!selectedCommit}
        onClose={() => setSelectedCommit(null)}
      />
    </div>
  );
}
