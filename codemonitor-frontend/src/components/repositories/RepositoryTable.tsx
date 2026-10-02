'use client';

import { GitRepositoryEntity } from '@/types/api';
import { GitFork, RefreshCw, ExternalLink, ShieldCheck, Eye } from 'lucide-react';

interface RepositoryTableProps {
  repositories: GitRepositoryEntity[];
  syncingId: number | null;
  onSync: (repo: GitRepositoryEntity) => void;
  onViewDetails: (repo: GitRepositoryEntity) => void;
}

export default function RepositoryTable({
  repositories,
  syncingId,
  onSync,
  onViewDetails,
}: RepositoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5">Repository</th>
              <th scope="col" className="px-4 py-3.5">Full GitHub Name</th>
              <th scope="col" className="px-4 py-3.5">Associated Team</th>
              <th scope="col" className="px-4 py-3.5">Default Branch</th>
              <th scope="col" className="px-4 py-3.5">Archive Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {repositories.map((repo) => {
              const isSyncing = syncingId === repo.id;
              // Extract team info from backend teamNumber or fallback to name convention
              const teamDisplayName = repo.teamNumber ? `Team ${repo.teamNumber}` : repo.name.replace(/-/g, ' ');

              return (
                <tr key={repo.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Repository Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F6FF] text-[#1B2560]">
                        <GitFork className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          {repo.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>ID: {repo.githubRepositoryId}</span>
                          <span>•</span>
                          <span>{repo.private ? 'Private' : 'Public'}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Full Name */}
                  <td className="px-4 py-4">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono font-medium text-[#1B2560] hover:text-[#2E45A2] hover:underline"
                    >
                      <span>{repo.fullName}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </td>

                  {/* Associated Team */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#1B2560] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        {teamDisplayName}
                      </span>
                    </div>
                  </td>

                  {/* Default Branch */}
                  <td className="px-4 py-4 font-mono text-[11px] text-slate-700">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                      {repo.defaultBranch || 'main'}
                    </span>
                  </td>

                  {/* Archive Status */}
                  <td className="px-4 py-4">
                    {repo.archived ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        Active / Monitored
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(repo)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>

                      <button
                        type="button"
                        onClick={() => onSync(repo)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#1B2560] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Repository'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
