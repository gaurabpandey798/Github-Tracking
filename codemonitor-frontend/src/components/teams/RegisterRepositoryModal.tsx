'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { registerRepository } from '@/lib/api/repositories';
import { TeamEntity, GitRepositoryEntity } from '@/types/api';
import { ApiClientError } from '@/lib/api/client';
import { Loader2, AlertCircle, GitFork, ShieldCheck } from 'lucide-react';

interface RegisterRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamEntity | null;
  onSuccess: (repo: GitRepositoryEntity) => void;
}

const DEFAULT_ORGANIZATION = 'MBMC-IdeaX';

export default function RegisterRepositoryModal({
  isOpen,
  onClose,
  team,
  onSuccess,
}: RegisterRepositoryModalProps) {
  const [repoName, setRepoName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setRepoName('');
    setError(null);
  };

  const handleClose = () => {
    if (!isVerifying) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setError(null);

    const trimmedName = repoName.trim();
    if (!trimmedName) {
      setError('Repository name is required.');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await registerRepository({
        teamId: team.id,
        owner: DEFAULT_ORGANIZATION,
        name: trimmedName,
      });

      resetForm();
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 404) {
          setError(
            err.message ||
              `GitHub repository ${DEFAULT_ORGANIZATION}/${trimmedName} was not found or is not accessible.`
          );
        } else if (err.status === 409) {
          setError(
            err.message ||
              `Repository ${DEFAULT_ORGANIZATION}/${trimmedName} is already registered or this team already has a repository.`
          );
        } else if (err.status === 400) {
          setError(
            err.message || `Repository must belong to organization '${DEFAULT_ORGANIZATION}'.`
          );
        } else if (err.status === 502) {
          setError('Failed to communicate with GitHub API. Please check network/credentials.');
        } else {
          setError(err.message || 'Verification and registration failed.');
        }
      } else {
        const errorObj = err as Error;
        setError(errorObj.message || 'An unexpected error occurred during repository verification.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (!team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register GitHub Repository"
      subtitle="Connect and verify an official GitHub repository for this team"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selected Team Card */}
        <div className="rounded-lg border border-blue-100 bg-[#F2F6FF] p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1B2560] font-bold text-white text-[11px]">
              {team.teamNumber}
            </span>
            <div>
              <span className="font-bold text-[#1B2560]">{team.teamName}</span>
              <p className="text-[10px] text-slate-500">Target Team for Repository Association</p>
            </div>
          </div>
          <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
            ID: {team.id}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* GitHub Organization (Read Only) */}
        <div>
          <label
            htmlFor="ghOrg"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            GitHub Organization
          </label>
          <div className="relative">
            <input
              id="ghOrg"
              type="text"
              readOnly
              value={DEFAULT_ORGANIZATION}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-600 focus:outline-hidden cursor-not-allowed"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Configured organization for IdeaX 2026. All monitored repositories must belong to this org.
          </p>
        </div>

        {/* Repository Name */}
        <div>
          <label
            htmlFor="repoName"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Repository Name <span className="text-red-500">*</span>
          </label>
          <input
            id="repoName"
            type="text"
            required
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="e.g. Team-ABC"
            disabled={isVerifying}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden disabled:bg-slate-50 transition-colors"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Exact GitHub repository name (e.g. <span className="font-mono">Team-14Peaks</span> or{' '}
            <span className="font-mono">Team-TechBenders</span>).
          </p>
        </div>

        {/* Notice */}
        <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-200 leading-relaxed">
          <p className="font-semibold text-slate-700">Verification Note:</p>
          <p>
            The backend will verify that this repository exists on GitHub, is accessible, and belongs to{' '}
            <strong className="font-mono">{DEFAULT_ORGANIZATION}</strong> before recording it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isVerifying}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isVerifying}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Verifying repository...</span>
              </>
            ) : (
              <>
                <GitFork className="h-3.5 w-3.5" />
                <span>Verify &amp; Register</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
