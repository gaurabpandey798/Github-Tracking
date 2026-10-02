'use client';

import { useState, useMemo } from 'react';
import { EnrichedCommit } from '@/types/api';
import { formatDate, truncateSha } from '@/lib/utils/formatters';
import { Search, Filter, ArrowUpDown, Copy, Check, Eye } from 'lucide-react';

interface CommitTableProps {
  commits: EnrichedCommit[];
  onSelectCommit: (commit: EnrichedCommit) => void;
}

export default function CommitTable({
  commits,
  onSelectCommit,
}: CommitTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sprintFilter, setSprintFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = (e: React.MouseEvent, sha: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Distinct sprints from commits
  const sprintOptions = useMemo(() => {
    const set = new Set<number>();
    commits.forEach((c) => set.add(c.sprintNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [commits]);

  // Filtered & sorted commits
  const filteredCommits = useMemo(() => {
    return commits
      .filter((c) => {
        // Search term (SHA, author, message)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchSha = c.commitSha.toLowerCase().includes(q);
          const matchAuthor = c.authorUsername.toLowerCase().includes(q);
          const matchMsg = c.message.toLowerCase().includes(q);
          if (!matchSha && !matchAuthor && !matchMsg) return false;
        }

        // Sprint filter
        if (sprintFilter !== 'ALL') {
          if (c.sprintNumber !== parseInt(sprintFilter, 10)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.committedAt).getTime();
        const timeB = new Date(b.committedAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [commits, searchTerm, sprintFilter, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SHA, author handle, or message..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sprint Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#1B2560] focus:outline-hidden"
            >
              <option value="ALL">All Sprints</option>
              {sprintOptions.map((s) => (
                <option key={s} value={s.toString()}>
                  Sprint {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Commit Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3.5">Commit SHA</th>
                <th scope="col" className="px-4 py-3.5">Author</th>
                <th scope="col" className="px-4 py-3.5">Message</th>
                <th scope="col" className="px-4 py-3.5">Sprint</th>
                <th scope="col" className="px-4 py-3.5">Team</th>
                <th scope="col" className="px-4 py-3.5 text-center">Files</th>
                <th scope="col" className="px-4 py-3.5 text-center">Add / Del</th>
                <th scope="col" className="px-4 py-3.5">Date</th>
                <th scope="col" className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCommits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-xs text-slate-500">
                    No commits match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCommits.map((c) => (
                  <tr
                    key={`${c.commitSha}-${c.sprintNumber}`}
                    onClick={() => onSelectCommit(c)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    {/* Commit SHA */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#1B2560]">
                          {truncateSha(c.commitSha, 7)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopySha(e, c.commitSha)}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Copy full SHA"
                        >
                          {copiedSha === c.commitSha ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-800">
                      @{c.authorUsername}
                    </td>

                    {/* Commit Message */}
                    <td className="px-4 py-3.5 max-w-xs sm:max-w-sm truncate text-slate-700 font-medium" title={c.message}>
                      {c.message}
                    </td>

                    {/* Sprint */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1B2560] border border-blue-100">
                        Sprint {c.sprintNumber}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-semibold">
                      Team {c.teamNumber}
                    </td>

                    {/* Files Changed */}
                    <td className="px-4 py-3.5 text-center font-mono text-slate-600">
                      {c.changedFiles}
                    </td>

                    {/* Add / Del */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap font-mono text-[11px]">
                      <span className="font-bold text-emerald-700">+{c.additions}</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="font-bold text-rose-700">-{c.deletions}</span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDate(c.committedAt)}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCommit(c);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
