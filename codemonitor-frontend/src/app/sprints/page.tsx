'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import SprintTable from '@/components/sprints/SprintTable';
import SprintDetails from '@/components/sprints/SprintDetails';
import ReleaseDialog from '@/components/sprints/ReleaseDialog';
import FreezeDialog from '@/components/sprints/FreezeDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getSprints } from '@/lib/api/sprints';
import { SprintSummary } from '@/types/api';
import { Timer, ArrowLeft } from 'lucide-react';

function SprintsContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(
    initialId ? parseInt(initialId, 10) : null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Dialog state
  const [releaseTarget, setReleaseTarget] = useState<SprintSummary | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<SprintSummary | null>(null);

  const fetchSprints = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getSprints();
      setSprints(data);

      setSelectedSprintId((prev) => {
        if (prev !== null) return prev;
        const active = data.find((s) => s.status === 'ACTIVE');
        if (active) return active.id;
        const frozen = [...data].filter((s) => s.status === 'FROZEN').pop();
        if (frozen) return frozen.id;
        return data[0]?.id || null;
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to fetch sprints from backend.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getSprints()
      .then((data) => {
        if (!ignore) {
          setSprints(data);
          setSelectedSprintId((prev) => {
            if (prev !== null) return prev;
            const active = data.find((s) => s.status === 'ACTIVE');
            if (active) return active.id;
            const frozen = [...data].filter((s) => s.status === 'FROZEN').pop();
            if (frozen) return frozen.id;
            return data[0]?.id || null;
          });
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to fetch sprints from backend.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectSprint = (sprint: SprintSummary) => {
    setSelectedSprintId(sprint.id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Sprint Management & Audit"
        subtitle="Manage sprint release, audit checkpoints, and immutable commits"
        onRefresh={() => fetchSprints(true)}
        isRefreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Loading sprints from backend..." />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Sprints"
            message={error.message}
            status={error.status}
            onRetry={() => fetchSprints(false)}
          />
        )}

        {!loading && !error && (
          <>
            {/* Top Table Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-[#1B2560]" />
                  <h2 className="text-base font-bold text-[#1F2937]">
                    Development Sprints ({sprints.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  Click a row to inspect checkpoints & commits
                </span>
              </div>

              <SprintTable
                sprints={sprints}
                selectedSprintId={selectedSprintId}
                onSelectSprint={handleSelectSprint}
                onRelease={(s) => setReleaseTarget(s)}
                onFreeze={(s) => setFreezeTarget(s)}
              />
            </div>

            {/* Selected Sprint Details View */}
            {selectedSprintId !== null && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Selected Sprint Audit Inspector
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedSprintId(null)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Hide Details
                  </button>
                </div>

                <SprintDetails
                  sprintId={selectedSprintId}
                  onClose={() => setSelectedSprintId(null)}
                  onRelease={(s) => setReleaseTarget(s)}
                  onFreeze={(s) => setFreezeTarget(s)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Release Dialog */}
      <ReleaseDialog
        sprint={releaseTarget}
        isOpen={!!releaseTarget}
        onClose={() => setReleaseTarget(null)}
        onSuccess={() => fetchSprints(true)}
      />

      {/* Freeze Dialog */}
      <FreezeDialog
        sprint={freezeTarget}
        isOpen={!!freezeTarget}
        onClose={() => setFreezeTarget(null)}
        onSuccess={() => fetchSprints(true)}
      />
    </div>
  );
}

export default function SprintsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <LoadingSpinner label="Loading Sprint Management..." />
        </div>
      }
    >
      <SprintsContent />
    </Suspense>
  );
}
