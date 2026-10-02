'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ExternalLink, Eye, Clock } from 'lucide-react';
import { ActivityItem } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';

interface ActivityTableProps {
  activities: ActivityItem[];
  onSelectActivity: (activity: ActivityItem) => void;
  isLoading: boolean;
}

export default function ActivityTable({
  activities,
  onSelectActivity,
  isLoading,
}: ActivityTableProps) {
  if (isLoading && activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#1B2560] mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading activity table...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">No activity matches the selected filters</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Adjust the filters above to inspect different activity streams.
        </p>
      </div>
    );
  }

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
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-3.5 whitespace-nowrap">Time</th>
              <th className="py-3 px-3 whitespace-nowrap">Type</th>
              <th className="py-3 px-3 whitespace-nowrap">Team</th>
              <th className="py-3 px-3 whitespace-nowrap">Repository</th>
              <th className="py-3 px-3 whitespace-nowrap">Actor</th>
              <th className="py-3 px-3 min-w-[200px]">Description</th>
              <th className="py-3 px-3 whitespace-nowrap">Severity</th>
              <th className="py-3 px-3 whitespace-nowrap">Status</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectActivity(item)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors"
              >
                {/* Time */}
                <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                  {formatDate(item.timestamp)}
                </td>

                {/* Type */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider font-mono ${getTypeBadge(
                      item.type
                    )}`}
                  >
                    {item.type}
                  </span>
                </td>

                {/* Team */}
                <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                  {item.teamNumber !== null && item.teamNumber !== undefined ? (
                    <span className="text-[#1B2560] font-semibold">
                      Team {item.teamNumber.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Repository */}
                <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                  {item.repositoryName || '—'}
                </td>

                {/* Actor */}
                <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700 text-[11px]">
                  {item.actor || item.githubUsername || 'System'}
                </td>

                {/* Description */}
                <td className="py-2.5 px-3 text-slate-800 max-w-xs truncate">
                  <span className="font-semibold text-slate-900 block truncate">
                    {item.title}
                  </span>
                  <span className="text-slate-500 text-[11px] block truncate">
                    {item.description}
                  </span>
                </td>

                {/* Severity */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.severity}
                  </span>
                </td>

                {/* Status / Review Flag */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  {item.requiresReview ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                        <ShieldAlert className="w-3 h-3" />
                        Review
                      </span>
                      <Link
                        href="/review-center"
                        onClick={(e) => e.stopPropagation()}
                        className="text-rose-600 hover:text-rose-800 p-0.5"
                        title="Open Review Center"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px] font-mono">
                      {item.status}
                    </span>
                  )}
                </td>

                {/* Action */}
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectActivity(item);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#1B2560] bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
