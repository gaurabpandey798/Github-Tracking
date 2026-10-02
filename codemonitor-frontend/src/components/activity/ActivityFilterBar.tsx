'use client';

import React from 'react';
import { Search, RotateCw, Filter, List, Rows3 } from 'lucide-react';
import { TeamEntity } from '@/types/api';

export interface FilterState {
  teamId?: number;
  type: string;
  severity: string;
  search: string;
  pageSize: number;
}

interface ActivityFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  teams: TeamEntity[];
  viewMode: 'timeline' | 'table';
  onViewModeChange: (mode: 'timeline' | 'table') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onAutoRefreshToggle: (enabled: boolean) => void;
  totalCount: number;
}

export default function ActivityFilterBar({
  filters,
  onFilterChange,
  teams,
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing,
  autoRefresh,
  onAutoRefreshToggle,
  totalCount,
}: ActivityFilterBarProps) {
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      teamId: val === 'ALL' ? undefined : parseInt(val, 10),
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, type: e.target.value });
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, severity: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, pageSize: parseInt(e.target.value, 10) });
  };

  const clearFilters = () => {
    onFilterChange({
      teamId: undefined,
      type: 'ALL',
      severity: 'ALL',
      search: '',
      pageSize: filters.pageSize,
    });
  };

  const hasActiveFilters =
    filters.teamId !== undefined ||
    filters.type !== 'ALL' ||
    filters.severity !== 'ALL' ||
    filters.search.trim() !== '';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-6 space-y-3">
      {/* Top row: Search, View Mode, Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities, actors, teams..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1B2560] focus:border-[#1B2560] transition-colors"
          />
        </div>

        {/* Right tools: View mode, Auto-refresh, Manual refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#1B2560] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Timeline View"
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#1B2560] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Auto refresh checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshToggle(e.target.checked)}
              className="rounded border-slate-300 text-[#1B2560] focus:ring-[#1B2560] w-3.5 h-3.5"
            />
            <span>Auto (30s)</span>
          </label>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors disabled:opacity-60"
            title="Refresh feed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1B2560]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter selectors */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Team filter */}
        <select
          value={filters.teamId !== undefined ? filters.teamId.toString() : 'ALL'}
          onChange={handleTeamChange}
          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
        >
          <option value="ALL">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id.toString()}>
              Team {t.teamNumber ? t.teamNumber.toString().padStart(2, '0') : ''} ({t.teamName})
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filters.type}
          onChange={handleTypeChange}
          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
        >
          <option value="ALL">All Types</option>
          <option value="COMMIT">Commits</option>
          <option value="SPRINT">Sprint Events</option>
          <option value="CHECKPOINT">Checkpoints</option>
          <option value="PARTICIPANT">Participants</option>
          <option value="REPOSITORY">Repositories</option>
          <option value="REVIEW">Review Flags</option>
          <option value="WEBHOOK">Webhooks</option>
          <option value="AUDIT">Administrative Audits</option>
        </select>

        {/* Severity filter */}
        <select
          value={filters.severity}
          onChange={handleSeverityChange}
          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
        >
          <option value="ALL">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        {/* Page size */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-slate-400">Show:</span>
          <select
            value={filters.pageSize.toString()}
            onChange={handlePageSizeChange}
            className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B2560]"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-slate-400">of {totalCount} activities</span>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#2E45A2] hover:underline font-medium ml-2"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
