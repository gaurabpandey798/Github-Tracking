'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  ShieldAlert,
  GitCommit,
  Clock,
  User,
  Users,
  GitFork,
  FileCode,
  Tag,
} from 'lucide-react';
import { ActivityItem } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';

interface ActivityDetailModalProps {
  activity: ActivityItem | null;
  onClose: () => void;
}

export default function ActivityDetailModal({
  activity,
  onClose,
}: ActivityDetailModalProps) {
  if (!activity) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'COMMIT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SPRINT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CHECKPOINT':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'PARTICIPANT':
        return 'bg-sky-50 text-[#1B2560] border-sky-200';
      case 'REPOSITORY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REVIEW':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'WEBHOOK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AUDIT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const meta = activity.metadata || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getTypeBadge(
                  activity.type
                )}`}
              >
                {activity.type}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                  activity.severity
                )}`}
              >
                {activity.severity}
              </span>
              {activity.requiresReview && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                  <ShieldAlert className="w-3 h-3" />
                  Review Required
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#1B2560] leading-snug">
              {activity.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(activity.timestamp)}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-slate-400">ID: {activity.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Description
            </div>
            <p className="text-slate-800 leading-relaxed font-medium">
              {activity.description}
            </p>
          </div>

          {/* Context Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Team */}
            <div className="border border-slate-200 rounded-md p-3 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-[#2E45A2] mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Team
                </div>
                <div className="font-semibold text-slate-800">
                  {activity.teamName || (activity.teamNumber ? `Team ${activity.teamNumber}` : 'Global / Event-wide')}
                </div>
                {activity.teamNumber !== null && activity.teamNumber !== undefined && (
                  <div className="text-[11px] text-slate-500">
                    Team Number: {activity.teamNumber.toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>

            {/* Repository */}
            <div className="border border-slate-200 rounded-md p-3 flex items-start gap-2.5">
              <GitFork className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Repository
                </div>
                <div className="font-semibold text-slate-800">
                  {activity.repositoryName || 'N/A'}
                </div>
                {activity.repositoryId && (
                  <div className="text-[11px] text-slate-500">
                    Repository ID: {activity.repositoryId}
                  </div>
                )}
              </div>
            </div>

            {/* Actor */}
            <div className="border border-slate-200 rounded-md p-3 flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Actor / Author
                </div>
                <div className="font-semibold text-slate-800 font-mono">
                  {activity.actor || activity.githubUsername || 'System'}
                </div>
                {activity.githubUsername && activity.actor && activity.actor !== activity.githubUsername && (
                  <div className="text-[11px] text-slate-500">
                    GitHub: @{activity.githubUsername}
                  </div>
                )}
              </div>
            </div>

            {/* Action & Status */}
            <div className="border border-slate-200 rounded-md p-3 flex items-start gap-2.5">
              <Tag className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Action & Status
                </div>
                <div className="font-semibold text-slate-800 font-mono">
                  {activity.action}
                </div>
                <div className="text-[11px] text-slate-500">
                  Status: {activity.status}
                </div>
              </div>
            </div>
          </div>

          {/* Commit Specific Metadata */}
          {activity.type === 'COMMIT' && Boolean(meta.commitSha) && (
            <div className="border border-slate-200 rounded-md p-3 space-y-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <GitCommit className="w-4 h-4 text-[#2E45A2]" />
                <span>Commit Details</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">SHA</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {String(meta.commitSha).substring(0, 7)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Additions</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    +{String(meta.additions ?? 0)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Deletions</span>
                  <span className="font-mono text-rose-600 font-bold">
                    -{String(meta.deletions ?? 0)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Files Changed</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {String(meta.changedFiles ?? 0)}
                  </span>
                </div>
              </div>
              {Boolean(meta.commitUrl) && (
                <div className="pt-1">
                  <a
                    href={String(meta.commitUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#2E45A2] hover:underline"
                  >
                    <span>View commit on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Checkpoint Specific Metadata */}
          {activity.type === 'CHECKPOINT' && (
            <div className="border border-slate-200 rounded-md p-3 space-y-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <FileCode className="w-4 h-4 text-teal-600" />
                <span>Checkpoint Record</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {meta.sprintId !== undefined && (
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Sprint ID</span>
                    <span className="font-semibold text-slate-800">{String(meta.sprintId)}</span>
                  </div>
                )}
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Commits</span>
                  <span className="font-semibold text-slate-800">{String(meta.commitCount ?? 0)}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Additions / Deletions</span>
                  <span className="font-semibold text-slate-800">
                    +{String(meta.additions ?? 0)} / -{String(meta.deletions ?? 0)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">SHA</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {meta.commitSha ? String(meta.commitSha).substring(0, 7) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Review Flag Notice */}
          {activity.requiresReview && (
            <div className="border border-rose-200 bg-rose-50/50 rounded-md p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Review Recommended</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                This activity triggered an automated heuristic flag and requires human organizer inspection. CodeMonitor does not accuse participants of misconduct; review flags exist solely to guide organizer evaluation.
              </p>
              <div className="pt-1">
                <Link
                  href="/review-center"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                >
                  <span>Open in Review Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Raw Metadata (collapsed/available) */}
          {Object.keys(meta).length > 0 && (
            <details className="border border-slate-200 rounded-md p-3 bg-white text-xs">
              <summary className="font-semibold text-slate-600 cursor-pointer select-none">
                Technical Metadata ({Object.keys(meta).length} fields)
              </summary>
              <pre className="mt-2 p-2 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-slate-200 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            Factual audit entry recorded by CodeMonitor
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
