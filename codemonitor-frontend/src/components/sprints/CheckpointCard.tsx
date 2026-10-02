'use client';

import { useState } from 'react';
import { CheckpointSummary } from '@/types/api';
import { formatDate, truncateSha } from '@/lib/utils/formatters';
import { ShieldCheck, GitCommit, Copy, Check, Users, FileCode, Plus, Minus, Clock } from 'lucide-react';

interface CheckpointCardProps {
  checkpoint: CheckpointSummary;
}

export default function CheckpointCard({ checkpoint }: CheckpointCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySha = () => {
    navigator.clipboard.writeText(checkpoint.commitSha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow">
      {/* Top row: Team & Repository info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#1B2560] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              Team {checkpoint.teamNumber}
            </span>
            <h4 className="text-sm font-bold text-[#1F2937]">
              {checkpoint.teamName}
            </h4>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {checkpoint.repositoryName}
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#2E45A2]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Audit Checkpoint</span>
        </div>
      </div>

      {/* Checkpoint SHA */}
      <div className="mt-3.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Recorded SHA:</span>
          <span className="font-mono text-xs font-bold text-[#1B2560]">
            {checkpoint.commitSha}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopySha}
          className="flex items-center gap-1 rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          title="Copy full SHA"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="text-[10px] font-mono text-slate-500">
            {copied ? 'Copied' : truncateSha(checkpoint.commitSha)}
          </span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        <div className="rounded-lg bg-[#F2F6FF] p-2.5 text-center border border-blue-50">
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
            <GitCommit className="h-3 w-3" />
            Commits
          </div>
          <p className="mt-1 text-base font-bold text-[#1F2937]">
            {checkpoint.commitCount}
          </p>
        </div>

        <div className="rounded-lg bg-[#F2F6FF] p-2.5 text-center border border-blue-50">
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
            <Users className="h-3 w-3" />
            Developers
          </div>
          <p className="mt-1 text-base font-bold text-[#1F2937]">
            {checkpoint.developerCount}
          </p>
        </div>

        <div className="rounded-lg bg-[#F2F6FF] p-2.5 text-center border border-blue-50">
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
            <FileCode className="h-3 w-3" />
            Files Changed
          </div>
          <p className="mt-1 text-base font-bold text-[#1F2937]">
            {checkpoint.filesChanged}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50/60 p-2.5 text-center border border-emerald-100">
          <div className="flex items-center justify-center gap-0.5 text-[11px] text-emerald-700 font-medium">
            <Plus className="h-3 w-3" />
            Additions
          </div>
          <p className="mt-1 text-base font-bold text-emerald-800">
            +{checkpoint.additions}
          </p>
        </div>

        <div className="rounded-lg bg-rose-50/60 p-2.5 text-center border border-rose-100 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-center gap-0.5 text-[11px] text-rose-700 font-medium">
            <Minus className="h-3 w-3" />
            Deletions
          </div>
          <p className="mt-1 text-base font-bold text-rose-800">
            -{checkpoint.deletions}
          </p>
        </div>
      </div>

      {/* Activity Timestamps */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>First activity:</span>
          <span className="font-semibold text-slate-700">
            {formatDate(checkpoint.firstActivityAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>Last activity:</span>
          <span className="font-semibold text-slate-700">
            {formatDate(checkpoint.lastActivityAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
