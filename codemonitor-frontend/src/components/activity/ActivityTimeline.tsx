'use client';

import React from 'react';
import Link from 'next/link';
import {
  GitCommit,
  Timer,
  Flag,
  User,
  GitFork,
  ShieldAlert,
  Webhook,
  ScrollText,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ActivityItem } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  onSelectActivity: (activity: ActivityItem) => void;
  isLoading: boolean;
}

export default function ActivityTimeline({
  activities,
  onSelectActivity,
  isLoading,
}: ActivityTimelineProps) {
  if (isLoading && activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#1B2560] mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading activity feed...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching latest event telemetry</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">No activity matches the selected filters</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try resetting the search terms or selecting a different team or activity type.
        </p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMMIT':
        return <GitCommit className="w-3.5 h-3.5 text-slate-600" />;
      case 'SPRINT':
        return <Timer className="w-3.5 h-3.5 text-indigo-600" />;
      case 'CHECKPOINT':
        return <Flag className="w-3.5 h-3.5 text-teal-600" />;
      case 'PARTICIPANT':
        return <User className="w-3.5 h-3.5 text-sky-600" />;
      case 'REPOSITORY':
        return <GitFork className="w-3.5 h-3.5 text-purple-600" />;
      case 'REVIEW':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case 'WEBHOOK':
        return <Webhook className="w-3.5 h-3.5 text-emerald-600" />;
      case 'AUDIT':
      default:
        return <ScrollText className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'WARNING':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'INFO':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-2.5">
      {activities.map((item) => {
        const meta = item.metadata || {};
        return (
          <div
            key={item.id}
            onClick={() => onSelectActivity(item)}
            className="group relative bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-lg p-3.5 transition-all cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Left column: Type Icon, Title, Description, and Badges */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-md bg-slate-50 border border-slate-200 shrink-0 mt-0.5 group-hover:bg-slate-100 transition-colors">
                  {getTypeIcon(item.type)}
                </div>

                <div className="min-w-0 space-y-1">
                  {/* Badges and timestamp header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-700 font-mono">
                      {item.type}
                    </span>

                    {item.teamNumber !== null && item.teamNumber !== undefined && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#1B2560] border border-blue-100">
                        Team {item.teamNumber.toString().padStart(2, '0')}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>

                    {item.requiresReview && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                        <ShieldAlert className="w-3 h-3" />
                        Review Required
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#1B2560] transition-colors leading-tight">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Additional contextual badges: e.g. commit stats, author */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 flex-wrap">
                    {item.actor && (
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.actor}
                      </span>
                    )}

                    {item.repositoryName && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <GitFork className="w-3 h-3 text-slate-400" />
                        {item.repositoryName}
                      </span>
                    )}

                    {item.type === 'COMMIT' && meta.additions !== undefined && (
                      <span className="font-mono text-[11px]">
                        <span className="text-emerald-600 font-semibold">+{String(meta.additions)}</span> /{' '}
                        <span className="text-rose-600 font-semibold">-{String(meta.deletions ?? 0)}</span>
                      </span>
                    )}

                    {item.type === 'COMMIT' && Boolean(meta.commitSha) && (
                      <span className="font-mono text-[11px] text-slate-400">
                        SHA: {String(meta.commitSha).substring(0, 7)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: Action / Review link */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                {item.requiresReview && (
                  <Link
                    href="/review-center"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                  >
                    <span>Review</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                <div className="text-slate-400 group-hover:text-[#1B2560] group-hover:translate-x-0.5 transition-all p-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
