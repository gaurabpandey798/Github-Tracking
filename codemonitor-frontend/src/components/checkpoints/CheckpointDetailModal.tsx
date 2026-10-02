'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { EnrichedCheckpoint } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';
import {
  ShieldCheck,
  GitCommit,
  Copy,
  Check,
  Users,
  FileCode,
  Plus,
  Minus,
  Clock,
  Calendar,
} from 'lucide-react';

interface CheckpointDetailModalProps {
  checkpoint: EnrichedCheckpoint | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckpointDetailModal({
  checkpoint,
  isOpen,
  onClose,
}: CheckpointDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!checkpoint) return null;

  const handleCopySha = () => {
    navigator.clipboard.writeText(checkpoint.commitSha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Checkpoint Details"
      subtitle={`${checkpoint.teamName} • Sprint ${checkpoint.sprintNumber}`}
    >
      <div className="space-y-4">
        {/* Top Info Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F2F6FF] p-4 border border-blue-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#1B2560] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Team {checkpoint.teamNumber}
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                {checkpoint.teamName}
              </h4>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {checkpoint.repositoryName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-[#2E45A2]">
            <ShieldCheck className="h-4 w-4" />
            <span>Immutable Audit Checkpoint</span>
          </div>
        </div>

        {/* Checkpoint SHA Box */}
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Recorded HEAD Commit SHA
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-[#1B2560] break-all select-all">
              {checkpoint.commitSha}
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

        {/* Code Diff Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <GitCommit className="h-3 w-3" />
              Commits
            </span>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {checkpoint.commitCount}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Developers
            </span>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {checkpoint.developerCount}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
              <FileCode className="h-3 w-3" />
              Files
            </span>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {checkpoint.filesChanged}
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-200">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase flex items-center justify-center gap-0.5">
              <Plus className="h-3 w-3" />
              Additions
            </span>
            <p className="mt-1 text-lg font-bold text-emerald-800">
              +{checkpoint.additions}
            </p>
          </div>

          <div className="rounded-lg bg-rose-50/70 p-2.5 border border-rose-200">
            <span className="text-[10px] font-semibold text-rose-700 uppercase flex items-center justify-center gap-0.5">
              <Minus className="h-3 w-3" />
              Deletions
            </span>
            <p className="mt-1 text-lg font-bold text-rose-800">
              -{checkpoint.deletions}
            </p>
          </div>
        </div>

        {/* Timestamps Section */}
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Checkpoint Captured / Frozen:
            </span>
            <span className="font-semibold text-slate-800">
              {formatDate(checkpoint.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              First Activity in Sprint:
            </span>
            <span className="font-semibold text-slate-800">
              {formatDate(checkpoint.firstActivityAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Activity Before Freeze:
            </span>
            <span className="font-semibold text-slate-800">
              {formatDate(checkpoint.lastActivityAt)}
            </span>
          </div>
        </div>

        {/* Audit Disclaimer */}
        <p className="text-[11px] text-slate-500 leading-relaxed italic">
          Audit checkpoints are immutable snapshots captured at the official sprint freeze. Any commits pushed after this SHA will be automatically logged in the Review Center.
        </p>

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
