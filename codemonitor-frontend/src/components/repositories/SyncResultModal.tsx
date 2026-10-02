'use client';

import Modal from '@/components/common/Modal';
import { RepositorySyncResponse } from '@/types/api';
import { CheckCircle2, GitCommit, Users, ShieldAlert } from 'lucide-react';

interface SyncResultModalProps {
  result: RepositorySyncResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncResultModal({
  result,
  isOpen,
  onClose,
}: SyncResultModalProps) {
  if (!result) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repository Synchronized"
      subtitle={`${result.repositoryName} (${result.branch})`}
    >
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-950">
              GitHub Synchronization Complete
            </p>
            <p className="mt-0.5 text-emerald-800">
              Fetched latest commit trees, author signatures, and heuristic checks from GitHub.
            </p>
          </div>
        </div>

        {/* Sync Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <GitCommit className="h-3.5 w-3.5 text-[#1B2560]" />
              New Commits Synced
            </span>
            <p className="mt-1 text-2xl font-bold text-[#1B2560]">
              {result.newCommitsCount}
            </p>
          </div>

          <div className="rounded-lg bg-[#F2F6FF] p-3 border border-blue-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <GitCommit className="h-3.5 w-3.5 text-slate-600" />
              Total Commits Recorded
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {result.totalCommitsCount}
            </p>
          </div>
        </div>

        {/* Contributors */}
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            Detected Contributors ({result.detectedContributors?.length || 0})
          </span>
          {result.detectedContributors && result.detectedContributors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {result.detectedContributors.map((author) => (
                <span
                  key={author}
                  className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 border border-slate-200"
                >
                  @{author}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-[11px] italic">No new contributors detected in this sync.</p>
          )}
        </div>

        {/* Flags Created */}
        {result.flagsCreated && result.flagsCreated.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
              Review Flags Generated ({result.flagsCreated.length})
            </span>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
              {result.flagsCreated.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
