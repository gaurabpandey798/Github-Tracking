'use client';

import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RotateCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AuditLogItem, TeamEntity, PagedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils/formatters';

interface AuditLogTableProps {
  auditLogs: PagedResponse<AuditLogItem> | null;
  teams: TeamEntity[];
  isLoading: boolean;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onFilterChange: (teamId?: number, action?: string, search?: string) => void;
  currentTeamId?: number;
  currentAction: string;
  currentSearch: string;
}

export default function AuditLogTable({
  auditLogs,
  teams,
  isLoading,
  onRefresh,
  onPageChange,
  onFilterChange,
  currentTeamId,
  currentAction,
  currentSearch,
}: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const getActionBadge = (action: string) => {
    if (action.includes('SPRINT_RELEASED') || action.includes('EVENT_STARTED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('SPRINT_FROZEN')) {
      return 'bg-sky-50 text-[#1B2560] border-sky-200';
    }
    if (action.includes('REMOVED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('REGISTERED') || action.includes('CREATED')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (action.includes('UPDATED') || action.includes('RESOLVED')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const items = auditLogs?.items || [];
  const totalElements = auditLogs?.totalElements || 0;
  const page = auditLogs?.page || 0;
  const totalPages = auditLogs?.totalPages || 1;

  // Filter items locally by search if provided
  const filteredItems = currentSearch.trim()
    ? items.filter((log) => {
        const query = currentSearch.toLowerCase();
        return (
          log.action.toLowerCase().includes(query) ||
          log.actor.toLowerCase().includes(query) ||
          (log.note && log.note.toLowerCase().includes(query)) ||
          (log.teamName && log.teamName.toLowerCase().includes(query)) ||
          (log.repositoryName && log.repositoryName.toLowerCase().includes(query))
        );
      })
    : items;

  return (
    <div className="space-y-4">
      {/* Immutability Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-3 text-xs text-slate-600">
        <Lock className="w-4 h-4 text-[#1B2560] mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-[#1B2560] uppercase tracking-wider text-[11px] block">
            Immutable Administrative History
          </span>
          <p className="mt-0.5 leading-relaxed">
            Audit logs are append-only and cannot be altered or deleted. Every event lifecycle transition, sprint release, freeze, repository registration, participant update, and review resolution is cryptographically and chronologically sequenced.
          </p>
        </div>
      </div>

      {/* Audit Log Filters & Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit actions, notes, actors..."
              value={currentSearch}
              onChange={(e) =>
                onFilterChange(currentTeamId, currentAction, e.target.value)
              }
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors disabled:opacity-60"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isLoading ? 'animate-spin text-[#1B2560]' : ''
                }`}
              />
              <span>{isLoading ? 'Loading...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Team filter */}
          <select
            value={currentTeamId !== undefined ? currentTeamId.toString() : 'ALL'}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange(
                val === 'ALL' ? undefined : parseInt(val, 10),
                currentAction,
                currentSearch
              );
            }}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
          >
            <option value="ALL">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id.toString()}>
                Team {t.teamNumber ? t.teamNumber.toString().padStart(2, '0') : ''} ({t.teamName})
              </option>
            ))}
          </select>

          {/* Action filter */}
          <select
            value={currentAction}
            onChange={(e) =>
              onFilterChange(currentTeamId, e.target.value, currentSearch)
            }
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
          >
            <option value="ALL">All Actions</option>
            <option value="EVENT_STARTED">EVENT_STARTED</option>
            <option value="SPRINT_RELEASED">SPRINT_RELEASED</option>
            <option value="SPRINT_FROZEN">SPRINT_FROZEN</option>
            <option value="CHECKPOINT_RECORDED">CHECKPOINT_RECORDED</option>
            <option value="REPOSITORY_REGISTERED">REPOSITORY_REGISTERED</option>
            <option value="PARTICIPANT_REGISTERED">PARTICIPANT_REGISTERED</option>
            <option value="PARTICIPANT_UPDATED">PARTICIPANT_UPDATED</option>
            <option value="PARTICIPANT_REMOVED">PARTICIPANT_REMOVED</option>
            <option value="REVIEW_FLAG_CREATED">REVIEW_FLAG_CREATED</option>
            <option value="REVIEW_FLAG_RESOLVED">REVIEW_FLAG_RESOLVED</option>
          </select>

          <span className="text-slate-400 ml-auto">
            Showing {filteredItems.length} of {totalElements} audit entries
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading && filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#1B2560] mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading audit records...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No audit actions recorded yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Administrative events such as sprint state changes and participant registrations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3.5 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-3 whitespace-nowrap">Action</th>
                  <th className="py-3 px-3 whitespace-nowrap">Actor</th>
                  <th className="py-3 px-3 whitespace-nowrap">Team</th>
                  <th className="py-3 px-3 whitespace-nowrap">Repository</th>
                  <th className="py-3 px-3 min-w-[240px]">Audit Note / Description</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDate(log.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider font-mono ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700 text-[11px]">
                      {log.actor}
                    </td>

                    {/* Team */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                      {log.teamNumber !== null && log.teamNumber !== undefined ? (
                        <span className="text-[#1B2560] font-semibold">
                          Team {log.teamNumber.toString().padStart(2, '0')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Repository */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {log.repositoryName || '—'}
                    </td>

                    {/* Note */}
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {log.note || '—'}
                    </td>

                    {/* Details button */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#1B2560] bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50 text-xs">
            <span className="text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 0 || isLoading}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1 || isLoading}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Inspection Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-[#1B2560]" />
                <h3 className="text-sm font-bold text-[#1B2560]">
                  Audit Log #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Action
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLog.action}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Actor
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLog.actor}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Timestamp
                  </span>
                  <span className="font-mono text-slate-700">
                    {formatDate(selectedLog.createdAt)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Team
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.teamName ||
                      (selectedLog.teamNumber
                        ? `Team ${selectedLog.teamNumber}`
                        : 'System / Global')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3">
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">
                  Audit Note
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {selectedLog.note || 'No description recorded'}
                </p>
              </div>

              {selectedLog.metadataJson && (
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">
                    Metadata Payload
                  </span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto font-mono">
                    {(() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(selectedLog.metadataJson),
                          null,
                          2
                        );
                      } catch {
                        return selectedLog.metadataJson;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
