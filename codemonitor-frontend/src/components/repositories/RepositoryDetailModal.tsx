'use client';

import Modal from '@/components/common/Modal';
import { GitRepositoryEntity } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';
import { GitFork, ExternalLink, Calendar, GitBranch, ShieldCheck } from 'lucide-react';

interface RepositoryDetailModalProps {
  repository: GitRepositoryEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onSync?: (repo: GitRepositoryEntity) => void;
}

export default function RepositoryDetailModal({
  repository,
  isOpen,
  onClose,
  onSync,
}: RepositoryDetailModalProps) {
  if (!repository) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repository Information"
      subtitle={repository.fullName}
    >
      <div className="space-y-4">
        {/* Top Info Banner */}
        <div className="flex items-center justify-between rounded-lg bg-[#F2F6FF] p-4 border border-blue-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B2560] text-white">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {repository.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                Owner: {repository.owner}
              </p>
            </div>
          </div>

          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B2560] hover:bg-slate-50 shadow-2xs"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Internal ID / GitHub ID
            </span>
            <p className="mt-1 font-mono font-bold text-slate-800">
              #{repository.id} • {repository.githubRepositoryId}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="h-3 w-3 text-slate-400" />
              Default Branch
            </span>
            <p className="mt-1 font-mono font-bold text-[#1B2560]">
              {repository.defaultBranch || 'main'}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Visibility & Archive
            </span>
            <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1.5">
              <span>{repository.private ? 'Private Repository' : 'Public Repository'}</span>
              <span>•</span>
              <span className={repository.archived ? 'text-amber-700' : 'text-emerald-700'}>
                {repository.archived ? 'Archived' : 'Active'}
              </span>
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Registered At
            </span>
            <p className="mt-1 text-slate-800 font-medium">
              {formatDate(repository.createdAt)}
            </p>
          </div>
        </div>

        {/* Audit Status */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            This repository is connected to automated audit tracking and webhook ingestion for IdeaX 2026.
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          {onSync && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSync(repository);
              }}
              className="rounded-md bg-[#1B2560] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors"
            >
              Sync Repository Now
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
