'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import CheckpointTable from '@/components/checkpoints/CheckpointTable';
import CheckpointDetailModal from '@/components/checkpoints/CheckpointDetailModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { getGlobalCheckpoints } from '@/lib/api/checkpoints';
import { EnrichedCheckpoint } from '@/types/api';
import { Flag, ShieldCheck } from 'lucide-react';

export default function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<EnrichedCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Detail Modal
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<EnrichedCheckpoint | null>(null);

  const fetchCheckpoints = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getGlobalCheckpoints();
      setCheckpoints(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to aggregate sprint checkpoints from backend.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getGlobalCheckpoints()
      .then((data) => {
        if (!ignore) {
          setCheckpoints(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to aggregate sprint checkpoints from backend.',
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
        title="Global Audit Checkpoints"
        subtitle="Immutable freeze checkpoints captured across all hackathon development phases"
        onRefresh={() => fetchCheckpoints(true)}
        isRefreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Policy Explanation Banner */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-slate-700 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#2E45A2] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#1B2560]">Immutable Audit Checkpoint System:</span>{' '}
            Checkpoints are automatically recorded at the conclusion of each sprint when the sprint is frozen. Each checkpoint captures the team HEAD commit SHA, code diff volume (+add / -del), files changed, and active developer count.
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-[#1B2560]" />
            <h2 className="text-base font-bold text-[#1F2937]">
              Recorded Checkpoints Archive ({checkpoints.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Click any checkpoint row to view details & copy full SHA
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Aggregating checkpoints across active & frozen sprints..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Checkpoints"
            message={error.message}
            status={error.status}
            onRetry={() => fetchCheckpoints(false)}
          />
        )}

        {/* Checkpoints Table or Empty State */}
        {!loading && !error && (
          checkpoints.length === 0 ? (
            <EmptyState
              title="No Checkpoints Recorded Yet"
              description="Checkpoints are created when a sprint is frozen by the organizer. Once a sprint concludes and is frozen, its immutable audit snapshot will appear here."
            />
          ) : (
            <CheckpointTable
              checkpoints={checkpoints}
              onSelectCheckpoint={(cp) => setSelectedCheckpoint(cp)}
            />
          )
        )}
      </div>

      {/* Checkpoint Detail Modal */}
      <CheckpointDetailModal
        checkpoint={selectedCheckpoint}
        isOpen={!!selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
      />
    </div>
  );
}
