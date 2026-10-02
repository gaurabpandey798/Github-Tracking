'use client';

import { useState, useEffect } from 'react';
import { TeamEntity, CreateParticipantPayload } from '@/types/api';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamEntity[];
  onSubmit: (payload: CreateParticipantPayload) => Promise<void>;
  initialUsername?: string;
  initialDisplayName?: string;
  initialUserId?: number | null;
}

export default function AddParticipantModal({
  isOpen,
  onClose,
  teams,
  onSubmit,
  initialUsername,
  initialDisplayName,
  initialUserId,
}: AddParticipantModalProps) {
  const [teamId, setTeamId] = useState<number | ''>(teams[0]?.id || '');
  const [displayName, setDisplayName] = useState(initialDisplayName || '');
  const [githubUsername, setGithubUsername] = useState(initialUsername || '');
  const [role, setRole] = useState('DEVELOPER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialUsername !== undefined) setGithubUsername(initialUsername);
      if (initialDisplayName !== undefined) setDisplayName(initialDisplayName);
      setError(null);
    }
  }, [isOpen, initialUsername, initialDisplayName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamId) {
      setError('Please select a valid IdeaX team.');
      return;
    }

    if (!githubUsername.trim()) {
      setError('GitHub username is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        teamId: Number(teamId),
        displayName: displayName.trim() || undefined,
        githubUsername: githubUsername.trim(),
        githubUserId: initialUserId || undefined,
        role: role.trim() || 'DEVELOPER',
      });
      // Reset form
      setDisplayName('');
      setGithubUsername('');
      setRole('DEVELOPER');
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to register participant.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F2F6FF] text-[#1B2560] border border-blue-200">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Register Official Participant
              </h3>
              <p className="text-xs text-slate-500">
                Add an official member to an IdeaX team roster.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {/* Team Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Team <span className="text-rose-500">*</span>
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(Number(e.target.value))}
              disabled={isSubmitting || teams.length === 0}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
              required
            >
              {teams.length === 0 ? (
                <option value="">No teams available</option>
              ) : (
                teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Team {String(t.teamNumber).padStart(2, '0')} — {t.teamName}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Participant Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Participant Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Gaurab Pandey"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Official participant display name on certificate/event roster.
            </p>
          </div>

          {/* GitHub Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              GitHub Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono">
                @
              </span>
              <input
                type="text"
                placeholder="gaurabpandey798"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 pl-8 pr-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Exact GitHub login handle used for commit authorship tracking.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Roster Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
            >
              <option value="DEVELOPER">Developer</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="FRONTEND_DEV">Frontend Developer</option>
              <option value="BACKEND_DEV">Backend Developer</option>
              <option value="FULLSTACK_DEV">Fullstack Developer</option>
              <option value="DESIGNER">UI/UX Designer</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || teams.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2E45A2] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Register Participant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
