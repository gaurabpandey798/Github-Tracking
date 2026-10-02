'use client';

import Modal from '@/components/common/Modal';
import { DeveloperContributor } from '@/types/api';
import {
  GitCommit,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Code2,
} from 'lucide-react';

interface DeveloperDetailModalProps {
  developer: DeveloperContributor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeveloperDetailModal({
  developer,
  isOpen,
  onClose,
}: DeveloperDetailModalProps) {
  if (!developer) return null;

  const netDelta = developer.additions - developer.deletions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Developer: @${developer.username}`}
      subtitle="GitHub Contributor & Participant Audit Profile"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Profile Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B2560] text-white font-bold text-base uppercase shadow-xs">
              {developer.username.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900">
                  {developer.displayName || `@${developer.username}`}
                </span>
                <a
                  href={`https://github.com/${developer.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-[#1B2560] hover:underline"
                >
                  <span>@{developer.username}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {developer.role ? `Role: ${developer.role}` : 'Participant Account'}
              </p>
            </div>
          </div>

          <div>
            {developer.status === 'REGISTERED' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Registered Roster Member
              </span>
            )}
            {developer.status === 'DETECTED' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <UserCheck className="h-3.5 w-3.5" />
                Detected Contributor
              </span>
            )}
            {developer.status === 'UNKNOWN' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Review Recommended: Unknown Author
              </span>
            )}
          </div>
        </div>

        {/* Review Flag Notice if any */}
        {developer.reviewFlagsCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Active Audit Review Flag Detected</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                This contributor has {developer.reviewFlagsCount} activity flag(s) flagged for organizer review in the Review Center.
              </p>
            </div>
          </div>
        )}

        {/* Association & Activity Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Team</span>
            <p className="font-bold text-slate-800 mt-0.5">#{developer.teamNumber} {developer.teamName}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Repository</span>
            <p className="font-mono text-slate-800 mt-0.5 truncate">{developer.repositoryName || 'None'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Commits</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">{developer.commitsCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Net Code Delta</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">
              <span className={netDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {netDelta >= 0 ? `+${netDelta}` : netDelta}
              </span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-[#1B2560]" />
            <span>Contribution Statistics</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Lines Added</span>
              <p className="font-mono font-bold text-emerald-700 mt-0.5">+{developer.additions}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Lines Deleted</span>
              <p className="font-mono font-bold text-rose-700 mt-0.5">-{developer.deletions}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">First Recorded Activity</span>
              <p className="font-mono text-[11px] text-slate-700 mt-0.5">
                {developer.firstActivityAt ? new Date(developer.firstActivityAt).toLocaleString() : 'No activity yet'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Last Recorded Activity</span>
              <p className="font-mono text-[11px] text-slate-700 mt-0.5">
                {developer.lastActivityAt ? new Date(developer.lastActivityAt).toLocaleString() : 'No activity yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Commits List */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <GitCommit className="h-3.5 w-3.5 text-[#1B2560]" />
            <span>Synchronized Commits ({developer.recentCommits.length})</span>
          </h4>

          {developer.recentCommits.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-3 py-2 w-24">SHA</th>
                    <th scope="col" className="px-3 py-2">Message</th>
                    <th scope="col" className="px-3 py-2 w-28">Sprint</th>
                    <th scope="col" className="px-3 py-2 text-right w-24">Lines</th>
                    <th scope="col" className="px-3 py-2 w-32">Committed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {developer.recentCommits.map((c) => (
                    <tr key={c.commitSha} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#1B2560]">
                        {c.commitSha.slice(0, 7)}
                      </td>
                      <td className="px-3 py-2 truncate max-w-xs text-slate-800">
                        {c.message || 'No commit message'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        Sprint {c.sprintNumber}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">
                        <span className="text-emerald-700">+{c.additions}</span>{' '}
                        <span className="text-rose-700">-{c.deletions}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                        {c.committedAt ? new Date(c.committedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              No commit records currently synchronized for this contributor.
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
