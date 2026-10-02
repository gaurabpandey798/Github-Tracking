'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { EnrichedCommit } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';
import { Copy, Check, FileCode, Plus, Minus, User, Calendar, ShieldCheck } from 'lucide-react';

interface CommitDetailModalProps {
  commit: EnrichedCommit | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommitDetailModal({
  commit,
  isOpen,
  onClose,
}: CommitDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!commit) return null;

  const handleCopySha = () => {
    navigator.clipboard.writeText(commit.commitSha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commit Audit Record"
      subtitle={`Sprint ${commit.sprintNumber} • Team ${commit.teamNumber}`}
    >
      <div className="space-y-4">
        {/* Full SHA Box */}
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Commit SHA
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-[#1B2560] break-all select-all">
              {commit.commitSha}
            </span>
            <button
              type="button"
              onClick={handleCopySha}
              className="inline-flex items-center gap-1 shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy SHA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message Card */}
        <div className="rounded-lg bg-[#F2F6FF] p-3.5 border border-blue-50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Commit Message
          </span>
          <p className="text-xs font-semibold text-slate-800">
            {commit.message}
          </p>
        </div>

        {/* Author & Timestamp */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              Author Handle
            </span>
            <p className="mt-1 font-bold text-slate-800">
              @{commit.authorUsername}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Committed At
            </span>
            <p className="mt-1 font-semibold text-slate-800">
              {formatDate(commit.committedAt)}
            </p>
          </div>
        </div>

        {/* Diff Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <FileCode className="h-3 w-3" />
              Files Changed
            </span>
            <p className="mt-1 text-base font-bold text-slate-800">
              {commit.changedFiles}
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-200">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase flex items-center justify-center gap-0.5">
              <Plus className="h-3 w-3" />
              Additions
            </span>
            <p className="mt-1 text-base font-bold text-emerald-800">
              +{commit.additions}
            </p>
          </div>

          <div className="rounded-lg bg-rose-50/70 p-2.5 border border-rose-200">
            <span className="text-[10px] font-semibold text-rose-700 uppercase flex items-center justify-center gap-0.5">
              <Minus className="h-3 w-3" />
              Deletions
            </span>
            <p className="mt-1 text-base font-bold text-rose-800">
              -{commit.deletions}
            </p>
          </div>
        </div>

        {/* Audit Context */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#2E45A2] shrink-0" />
          <span>
            Associated with <strong>{commit.sprintName}</strong> for <strong>Team {commit.teamNumber}</strong>.
          </span>
        </div>

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
