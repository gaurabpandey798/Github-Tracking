'use client';

import { ParticipantResponse } from '@/types/api';
import { ExternalLink, Eye, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

interface ParticipantTableProps {
  participants: ParticipantResponse[];
  onViewDetails: (participant: ParticipantResponse) => void;
  onEdit: (participant: ParticipantResponse) => void;
  onDelete: (participant: ParticipantResponse) => void;
}

export default function ParticipantTable({
  participants,
  onViewDetails,
  onEdit,
  onDelete,
}: ParticipantTableProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role: string) => {
    const norm = role.toUpperCase();
    if (norm.includes('LEAD') || norm.includes('CAPTAIN')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (norm.includes('FRONT') || norm.includes('UI')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    if (norm.includes('BACK') || norm.includes('API')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    return 'bg-blue-50 text-[#1B2560] border-blue-200';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <th className="py-3.5 px-4">Participant</th>
            <th className="py-3.5 px-4">GitHub Username</th>
            <th className="py-3.5 px-4">Team</th>
            <th className="py-3.5 px-4">Role</th>
            <th className="py-3.5 px-4 text-center">Commits</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Registered</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {participants.map((p) => {
            const displayName = p.displayName || p.githubUsername;
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <tr
                key={p.id}
                className="hover:bg-slate-50/60 transition-colors duration-150"
              >
                {/* 1. Participant */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-[#1B2560] shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 leading-tight">
                        {displayName}
                      </div>
                      {p.displayName && p.displayName !== p.githubUsername && (
                        <div className="text-xs text-slate-400 font-mono">
                          @{p.githubUsername}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* 2. GitHub Username */}
                <td className="py-3 px-4 font-mono text-xs">
                  <a
                    href={`https://github.com/${p.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 hover:underline font-medium"
                  >
                    <span>{p.githubUsername}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                  </a>
                </td>

                {/* 3. Team */}
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#F2F6FF] text-[#1B2560] border border-blue-200">
                    <span className="font-mono">#{p.teamNumber}</span>
                    <span className="truncate max-w-[130px]">{p.teamName}</span>
                  </span>
                </td>

                {/* 4. Role */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getRoleBadge(
                      p.role
                    )}`}
                  >
                    {p.role}
                  </span>
                </td>

                {/* 5. Commits */}
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                      p.commitCount > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.commitCount}
                  </span>
                </td>

                {/* 6. Status */}
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>REGISTERED</span>
                  </span>
                </td>

                {/* 7. Registered Date */}
                <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                  {formatDate(p.createdAt)}
                </td>

                {/* 8. Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewDetails(p)}
                      title="View Details"
                      className="inline-flex items-center justify-center p-1.5 text-slate-600 hover:text-[#1B2560] hover:bg-slate-100 rounded transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Details</span>
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      title="Edit Participant"
                      className="inline-flex items-center justify-center p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      title="Remove Participant"
                      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
