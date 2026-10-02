'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import EventReportView from '@/components/reports/EventReportView';
import SprintReportView from '@/components/reports/SprintReportView';
import TeamReportView from '@/components/reports/TeamReportView';
import { Activity, Timer, Users } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'event' | 'sprint' | 'team'>('event');

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Audit & Judging Reports"
        subtitle="Comprehensive event metrics, sprint evaluations, and team checkpoint summaries"
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('event')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'event'
                ? 'bg-[#1B2560] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Global Event Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sprint')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'sprint'
                ? 'bg-[#1B2560] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Timer className="h-4 w-4" />
            <span>Sprint Audit Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'team'
                ? 'bg-[#1B2560] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Team Contribution Reports</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'event' && <EventReportView />}
        {activeTab === 'sprint' && <SprintReportView />}
        {activeTab === 'team' && <TeamReportView />}
      </div>
    </div>
  );
}
