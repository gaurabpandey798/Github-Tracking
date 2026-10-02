'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import ReviewFlagTable from '@/components/review/ReviewFlagTable';
import ReviewFlagCard from '@/components/review/ReviewFlagCard';
import ResolveDialog from '@/components/review/ResolveDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import { getReviewFlags } from '@/lib/api/reviewFlags';
import { ReviewFlag, ReviewFlagStatus } from '@/types/api';
import { ShieldAlert, Info, LayoutGrid, List } from 'lucide-react';

export default function ReviewCenterPage() {
  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Dialog state
  const [resolveTarget, setResolveTarget] = useState<ReviewFlag | null>(null);

  const fetchFlags = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const apiFilter = statusFilter === 'ALL' ? undefined : (statusFilter as ReviewFlagStatus);
      const data = await getReviewFlags(apiFilter);
      setFlags(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      setError({
        message: errorObj.message || 'Failed to fetch review flags from backend.',
        status: errorObj.status,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    const apiFilter = statusFilter === 'ALL' ? undefined : (statusFilter as ReviewFlagStatus);
    getReviewFlags(apiFilter)
      .then((data) => {
        if (!ignore) {
          setFlags(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorObj = err as { message?: string; status?: number };
          setError({
            message: errorObj.message || 'Failed to fetch review flags from backend.',
            status: errorObj.status,
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  // Metric counts
  const totalCount = flags.length;
  const openCount = flags.filter((f) => f.status === 'OPEN').length;
  const postCheckpointCount = flags.filter((f) => f.type === 'POST_CHECKPOINT_ACTIVITY').length;
  const resolvedCount = flags.filter((f) => f.status === 'REVIEWED' || f.status === 'DISMISSED').length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Organizer Review Center"
        subtitle="Review heuristic activity flags and checkpoint compliance"
        onRefresh={() => fetchFlags(true)}
        isRefreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Ethical Review Policy Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#2E45A2] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#1B2560]">Organizer Audit Principle:</span>{' '}
            Review flags indicate automated activity patterns (such as commits submitted after a checkpoint freeze or bulk file additions) that require organizer verification. Flagged activity is never an automated verdict; organizers evaluate the context before making decisions.
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Flags
            </span>
            <p className="mt-1 text-2xl font-bold text-[#1F2937]">{totalCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Recorded by heuristics</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Needs Review
            </span>
            <p className="mt-1 text-2xl font-bold text-amber-700">{openCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pending organizer action</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-bold text-[#1B2560] uppercase tracking-wider">
              Post-Checkpoint
            </span>
            <p className="mt-1 text-2xl font-bold text-[#1B2560]">{postCheckpointCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Activity after freeze</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Resolved
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{resolvedCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Reviewed or dismissed</p>
          </div>
        </div>

        {/* View Controls & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#2E45A2]" />
            <h2 className="text-base font-bold text-[#1F2937]">
              Review Recommended Queue ({flags.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-[#1B2560] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-[#1B2560] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-xs">
            <LoadingSpinner label="Fetching review flags from backend..." />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <ErrorMessage
            title="Failed to Load Review Flags"
            message={error.message}
            status={error.status}
            onRetry={() => fetchFlags(false)}
          />
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {flags.length === 0 ? (
              <EmptyState
                title="No Review Flags Found"
                description={
                  statusFilter === 'ALL'
                    ? 'There are currently no activity flags requiring organizer review in the system.'
                    : `No flags match the current status filter "${statusFilter}".`
                }
                action={
                  statusFilter !== 'ALL'
                    ? {
                        label: 'Show All Flags',
                        onClick: () => setStatusFilter('ALL'),
                      }
                    : undefined
                }
              />
            ) : viewMode === 'table' ? (
              <ReviewFlagTable
                flags={flags}
                onResolve={(f) => setResolveTarget(f)}
                statusFilter={statusFilter}
                onFilterChange={(st) => setStatusFilter(st)}
              />
            ) : (
              <div className="space-y-4">
                {/* Filter Toolbar for cards view */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    Filter by Status:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['ALL', 'OPEN', 'REVIEWED', 'DISMISSED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                          statusFilter === st
                            ? 'bg-[#1B2560] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flags.map((flag) => (
                    <ReviewFlagCard
                      key={flag.id}
                      flag={flag}
                      onResolve={(f) => setResolveTarget(f)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Resolve Dialog */}
      <ResolveDialog
        flag={resolveTarget}
        isOpen={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        onSuccess={() => fetchFlags(true)}
      />
    </div>
  );
}
