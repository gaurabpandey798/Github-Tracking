'use client';

import { Menu, RefreshCw, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  eventStatus?: string | null;
}

export default function Header({
  title,
  subtitle,
  onMenuClick,
  onRefresh,
  isRefreshing = false,
  eventStatus = 'ACTIVE',
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-base font-bold text-[#1F2937] leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Event Status Pill */}
        {eventStatus && (
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Event: {eventStatus}</span>
          </div>
        )}

        {/* Refresh Action */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors shadow-xs"
            title="Refresh data from backend"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#2E45A2]' : 'text-slate-500'}`}
            />
            <span className="hidden md:inline">Refresh</span>
          </button>
        )}

        {/* Organizer Badge */}
        <div className="flex items-center gap-2 rounded-md bg-[#F2F6FF] px-3 py-1.5 text-xs font-medium text-[#1B2560] border border-blue-100">
          <Shield className="h-3.5 w-3.5 text-[#2E45A2]" />
          <span className="font-semibold">Organizer</span>
        </div>
      </div>
    </header>
  );
}
