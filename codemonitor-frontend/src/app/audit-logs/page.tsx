'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import AuditLogTable from '@/components/activity/AuditLogTable';
import { getAuditLogs } from '@/lib/api/auditLogs';
import { getTeams } from '@/lib/api/teams';
import { AuditLogItem, PagedResponse, TeamEntity } from '@/types/api';

export default function AuditLogsPage() {
  const [auditData, setAuditData] = useState<PagedResponse<AuditLogItem> | null>(null);
  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [teamId, setTeamId] = useState<number | undefined>(undefined);
  const [action, setAction] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  // Load teams
  useEffect(() => {
    async function loadTeams() {
      try {
        const teamList = await getTeams();
        setTeams(teamList);
      } catch (err: unknown) {
        console.error('Failed to load teams:', err);
      }
    }
    loadTeams();
  }, []);

  // Fetch audit logs for manual refresh
  const refreshAuditLogs = useCallback(async () => {
    try {
      const res = await getAuditLogs({
        teamId,
        action,
        page,
        size: 50,
      });
      setAuditData(res);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs.';
      setErrorMessage(msg);
    }
  }, [teamId, action, page]);

  useEffect(() => {
    let ignore = false;

    getAuditLogs({
      teamId,
      action,
      page,
      size: 50,
    })
      .then((res) => {
        if (!ignore) {
          setAuditData(res);
          setErrorMessage(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load audit logs.');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [teamId, action, page]);

  const handleFilterChange = (newTeamId?: number, newAction?: string, newSearch?: string) => {
    setTeamId(newTeamId);
    if (newAction !== undefined) setAction(newAction);
    if (newSearch !== undefined) setSearch(newSearch);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-[#F2F6FF]/60 flex flex-col">
      <Header
        title="Audit Logs"
        subtitle="Immutable administrative action history and audit records for IdeaX 2026."
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation link to activity stream */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/activity"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B2560] bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Switch to Activity Stream</span>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3.5 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Audit Log Table */}
        <AuditLogTable
          auditLogs={auditData}
          teams={teams}
          isLoading={isLoading}
          onRefresh={refreshAuditLogs}
          onPageChange={(p) => setPage(p)}
          onFilterChange={handleFilterChange}
          currentTeamId={teamId}
          currentAction={action}
          currentSearch={search}
        />
      </main>
    </div>
  );
}
