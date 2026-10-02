'use client';

import { useState } from 'react';
import { EnrichedCheckpoint } from '@/types/api';
import { formatDate, truncateSha, getSprintStatusConfig } from '@/lib/utils/formatters';
import { Copy, Check, Eye } from 'lucide-react';

interface CheckpointTableProps {
  checkpoints: EnrichedCheckpoint[];
  onSelectCheckpoint: (checkpoint: EnrichedCheckpoint) => void;
}

export default function CheckpointTable({
  checkpoints,
  onSelectCheckpoint,
}: CheckpointTableProps) {
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = (e: React.MouseEvent, sha: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-4 py-3.5">Sprint</th>
              <th scope="col" className="px-4 py-3.5">Team</th>
              <th scope="col" className="px-4 py-3.5">Repository</th>
              <th scope="col" className="px-4 py-3.5">Checkpoint SHA</th>
              <th scope="col" className="px-3 py-3.5 text-center">Commits</th>
              <th scope="col" className="px-3 py-3.5 text-center">Devs</th>
              <th scope="col" className="px-3 py-3.5 text-center">Files</th>
              <th scope="col" className="px-4 py-3.5 text-center">Add / Del</th>
              <th scope="col" className="px-4 py-3.5">Recorded Time</th>
              <th scope="col" className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {checkpoints.map((cp) => {
              const sprintConfig = getSprintStatusConfig(cp.sprintStatus);

              return (
                <tr
                  key={`${cp.checkpointId}-${cp.sprintNumber}`}
                  onClick={() => onSelectCheckpoint(cp)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  {/* Sprint */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#1B2560]">
                        #{cp.sprintNumber}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.2 text-[9px] font-bold ${sprintConfig.bg} ${sprintConfig.text} ${sprintConfig.border}`}
                      >
                        {cp.sprintStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[110px]">
                      {cp.sprintName}
                    </p>
                  </td>

                  {/* Team */}
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-800">
                      {cp.teamName}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Team #{cp.teamNumber}
                    </span>
                  </td>

                  {/* Repository */}
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 truncate max-w-[140px]">
                    {cp.repositoryName}
                  </td>

                  {/* Checkpoint SHA */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#1B2560]">
                        {truncateSha(cp.commitSha, 7)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopySha(e, cp.commitSha)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Copy full SHA"
                      >
                        {copiedSha === cp.commitSha ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Commits */}
                  <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700">
                    {cp.commitCount}
                  </td>

                  {/* Developers */}
                  <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700">
                    {cp.developerCount}
                  </td>

                  {/* Files Changed */}
                  <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700">
                    {cp.filesChanged}
                  </td>

                  {/* Additions / Deletions */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="font-mono text-[11px] font-bold text-emerald-700">
                      +{cp.additions}
                    </span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="font-mono text-[11px] font-bold text-rose-700">
                      -{cp.deletions}
                    </span>
                  </td>

                  {/* Recorded Time */}
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                    {formatDate(cp.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCheckpoint(cp);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      <Eye className="h-3 w-3" />
                      Details
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
