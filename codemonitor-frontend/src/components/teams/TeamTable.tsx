'use client';

import { TeamWithRepository } from '@/types/api';
import { GitFork, Eye, ExternalLink, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeamTableProps {
  teams: TeamWithRepository[];
  onViewDetails: (team: TeamWithRepository) => void;
  onRegisterRepo: (team: TeamWithRepository) => void;
}

export default function TeamTable({
  teams,
  onViewDetails,
  onRegisterRepo,
}: TeamTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5 w-24"># Number</th>
              <th scope="col" className="px-5 py-3.5">Team Name</th>
              <th scope="col" className="px-5 py-3.5">Repository</th>
              <th scope="col" className="px-4 py-3.5 w-28">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => {
              const hasRepo = !!team.repository;
              const repo = team.repository;

              return (
                <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* # / Team Number */}
                  <td className="px-5 py-4 font-mono font-bold text-slate-800">
                    <span className="inline-flex items-center justify-center rounded-md bg-[#F2F6FF] px-2.5 py-1 text-xs font-bold text-[#1B2560] border border-blue-100">
                      #{team.teamNumber}
                    </span>
                  </td>

                  {/* Team Name */}
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-xs">
                      {team.teamName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      DB ID: {team.id}
                    </div>
                  </td>

                  {/* Repository */}
                  <td className="px-5 py-4">
                    {hasRepo && repo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1B2560]">
                          <GitFork className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono font-semibold text-[#1B2560] hover:text-[#2E45A2] hover:underline"
                          >
                            <span>{repo.name}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                          <div className="text-[10px] text-slate-400">
                            {repo.fullName}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        <span>Not registered</span>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {team.status || 'Active'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(team)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>

                      {!hasRepo && (
                        <button
                          type="button"
                          onClick={() => onRegisterRepo(team)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#1B2560] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-xs"
                          title="Register GitHub repository for this team"
                        >
                          <PlusCircle className="h-3 w-3" />
                          <span>Register</span>
                        </button>
                      )}
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
