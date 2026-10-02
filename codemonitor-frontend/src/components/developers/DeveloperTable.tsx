'use client';

import { DeveloperContributor } from '@/types/api';
import { UserCheck, GitCommit, GitFork, ExternalLink, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DeveloperTableProps {
  developers: DeveloperContributor[];
  onViewDetails: (developer: DeveloperContributor) => void;
}

export default function DeveloperTable({
  developers,
  onViewDetails,
}: DeveloperTableProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No activity';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5">Developer / Contributor</th>
              <th scope="col" className="px-4 py-3.5">GitHub Username</th>
              <th scope="col" className="px-4 py-3.5">Team</th>
              <th scope="col" className="px-4 py-3.5">Repository</th>
              <th scope="col" className="px-4 py-3.5 text-center">Commits</th>
              <th scope="col" className="px-4 py-3.5 text-right">Lines (+ / -)</th>
              <th scope="col" className="px-4 py-3.5">First Activity</th>
              <th scope="col" className="px-4 py-3.5">Last Activity</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {developers.map((dev) => {
              return (
                <tr key={dev.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Developer Name & Avatar */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B2560] text-white font-bold text-xs uppercase shadow-2xs">
                        {dev.username.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          {dev.displayName || dev.username}
                        </span>
                        {dev.role && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {dev.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* GitHub Handle */}
                  <td className="px-4 py-4 font-mono">
                    <a
                      href={`https://github.com/${dev.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#1B2560] hover:text-[#2E45A2] hover:underline"
                    >
                      <span>@{dev.username}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </td>

                  {/* Team */}
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F2F6FF] px-2 py-0.5 text-xs font-semibold text-[#1B2560] border border-blue-100">
                      <span>#{dev.teamNumber}</span>
                      <span className="text-slate-500 font-normal">|</span>
                      <span>{dev.teamName}</span>
                    </div>
                  </td>

                  {/* Repository */}
                  <td className="px-4 py-4">
                    {dev.repositoryName ? (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                        <GitFork className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {dev.repositoryUrl ? (
                          <a
                            href={dev.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#1B2560] hover:underline"
                          >
                            {dev.repositoryName}
                          </a>
                        ) : (
                          <span>{dev.repositoryName}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Unmapped</span>
                    )}
                  </td>

                  {/* Commits */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-mono font-bold text-slate-800 text-xs">
                      <GitCommit className="h-3 w-3 text-slate-500" />
                      {dev.commitsCount}
                    </span>
                  </td>

                  {/* Lines Added / Deleted */}
                  <td className="px-4 py-4 text-right font-mono text-[11px]">
                    <span className="text-emerald-700 font-semibold">+{dev.additions}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-rose-700 font-semibold">-{dev.deletions}</span>
                  </td>

                  {/* First Activity */}
                  <td className="px-4 py-4 font-mono text-[11px] text-slate-600">
                    {formatDate(dev.firstActivityAt)}
                  </td>

                  {/* Last Activity */}
                  <td className="px-4 py-4 font-mono text-[11px] text-slate-600">
                    {formatDate(dev.lastActivityAt)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    {dev.status === 'REGISTERED' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Registered
                      </span>
                    )}
                    {dev.status === 'DETECTED' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        <UserCheck className="h-3 w-3" />
                        Detected
                      </span>
                    )}
                    {dev.status === 'UNKNOWN' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700" title="Review Recommended: Unknown contributor detected without roster registration">
                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                        Review Needed
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetails(dev)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      <Eye className="h-3 w-3 text-slate-500" />
                      <span>Details</span>
                    </button>
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
