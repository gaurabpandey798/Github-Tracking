'use client';

import Modal from '@/components/common/Modal';
import { TeamWithRepository } from '@/types/api';
import { GitFork, ExternalLink, ShieldCheck, ShieldAlert, PlusCircle, CheckCircle2, Clock } from 'lucide-react';

interface TeamDetailModalProps {
  team: TeamWithRepository | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterRepo: (team: TeamWithRepository) => void;
}

export default function TeamDetailModal({
  team,
  isOpen,
  onClose,
  onRegisterRepo,
}: TeamDetailModalProps) {
  if (!team) return null;

  const repo = team.repository;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Team ${team.teamNumber}: ${team.teamName}`}
      subtitle="IdeaX Team Registration & Repository Details"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Team Overview Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Team Number</span>
            <p className="font-mono font-bold text-sm text-[#1B2560] mt-0.5">#{team.teamNumber}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
            <div className="mt-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                {team.status || 'ACTIVE'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Database ID</span>
            <p className="font-mono font-medium text-slate-700 mt-0.5">{team.id}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Registered At</span>
            <p className="font-mono text-[11px] text-slate-600 mt-0.5">
              {team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Repository Mapping Section */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <GitFork className="h-3.5 w-3.5 text-[#1B2560]" />
            <span>Mapped GitHub Repository</span>
          </h4>

          {repo ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{repo.name}</span>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-[#1B2560] hover:text-[#2E45A2] hover:underline"
                  >
                    <span>{repo.fullName}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  {repo.archived ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <ShieldAlert className="h-3 w-3" />
                      Archived
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      Active / Monitored
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">GitHub Repo ID</span>
                  <p className="font-mono text-slate-800 mt-0.5">{repo.githubRepositoryId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Default Branch</span>
                  <p className="font-mono font-medium text-slate-800 mt-0.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{repo.defaultBranch || 'main'}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Visibility</span>
                  <p className="font-medium text-slate-800 mt-0.5">{repo.private ? 'Private' : 'Public'}</p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Last metadata sync: {repo.updatedAt ? new Date(repo.updatedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-5 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <GitFork className="h-5 w-5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 text-xs">No Repository Registered</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  This team does not currently have a GitHub repository connected for CodeMonitor audit tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegisterRepo(team);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] transition-colors shadow-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Register Repository</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
