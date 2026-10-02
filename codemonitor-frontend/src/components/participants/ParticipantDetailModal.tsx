'use client';

import { ParticipantResponse } from '@/types/api';
import { X, ExternalLink, Calendar, GitCommit, CheckCircle2, UserCheck, Shield } from 'lucide-react';
import Link from 'next/link';

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantResponse | null;
}

export default function ParticipantDetailModal({
  isOpen,
  onClose,
  participant,
}: ParticipantDetailModalProps) {
  if (!isOpen || !participant) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const displayName = participant.displayName || participant.githubUsername;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1B2560] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-slate-500">
                  @{participant.githubUsername}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{participant.status}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50/75 p-3">
              <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Assigned Team
              </div>
              <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
                <span className="font-mono text-blue-700">
                  #{participant.teamNumber}
                </span>
                <span className="truncate">{participant.teamName}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/75 p-3">
              <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Roster Role
              </div>
              <div className="mt-1 font-bold text-slate-900">
                {participant.role}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/75 p-3">
              <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Commits Recorded
              </div>
              <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
                <GitCommit className="h-4 w-4 text-emerald-600" />
                <span className="font-mono">{participant.commitCount}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/75 p-3">
              <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                GitHub Numeric ID
              </div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-700">
                {participant.githubUserId ? participant.githubUserId : 'Unlinked'}
              </div>
            </div>
          </div>

          {/* Audit Dates */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Registered At</span>
              </span>
              <span className="font-mono text-slate-800">
                {formatDate(participant.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <span>Last Updated</span>
              </span>
              <span className="font-mono text-slate-800">
                {formatDate(participant.updatedAt)}
              </span>
            </div>
          </div>

          {/* External Profile Link */}
          <div className="pt-2">
            <a
              href={`https://github.com/${participant.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              <span>View GitHub Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Footer with Action */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <Link
            href={`/developers?search=${encodeURIComponent(participant.githubUsername)}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B2560] hover:text-[#2E45A2] transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            <span>View Developer Activity →</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
