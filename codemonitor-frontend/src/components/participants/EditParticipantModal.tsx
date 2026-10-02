'use client';

import { useState } from 'react';
import { ParticipantResponse, TeamEntity, UpdateParticipantPayload } from '@/types/api';
import { X, Edit2, AlertCircle, Loader2, Lock } from 'lucide-react';

interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantResponse | null;
  teams: TeamEntity[];
  onSubmit: (id: number, payload: UpdateParticipantPayload) => Promise<void>;
}

export default function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  teams,
  onSubmit,
}: EditParticipantModalProps) {
  if (!isOpen || !participant) return null;

  return (
    <EditParticipantForm
      key={participant.id}
      participant={participant}
      teams={teams}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

interface EditParticipantFormProps {
  participant: ParticipantResponse;
  teams: TeamEntity[];
  onClose: () => void;
  onSubmit: (id: number, payload: UpdateParticipantPayload) => Promise<void>;
}

function EditParticipantForm({
  participant,
  teams,
  onClose,
  onSubmit,
}: EditParticipantFormProps) {
  const [displayName, setDisplayName] = useState(participant.displayName || '');
  const [githubUsername, setGithubUsername] = useState(participant.githubUsername || '');
  const [role, setRole] = useState(participant.role || 'DEVELOPER');
  const [teamId, setTeamId] = useState<number | ''>(participant.teamId || '');
  const [status, setStatus] = useState(participant.status || 'REGISTERED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasHistoricalCommits = participant.commitCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!githubUsername.trim()) {
      setError('GitHub username cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateParticipantPayload = {
        displayName: displayName.trim() || undefined,
        githubUsername: githubUsername.trim(),
        role: role.trim(),
        status: status.trim(),
      };

      // Only pass teamId if allowed and modified
      if (!hasHistoricalCommits && teamId && teamId !== participant.teamId) {
        payload.teamId = Number(teamId);
      }

      await onSubmit(participant.id, payload);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update participant.';
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
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Participant
              </h3>
              <p className="text-xs text-slate-500">
                Update roster metadata for #{participant.id} — @{participant.githubUsername}
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

          {/* Participant Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
            />
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
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 pl-8 pr-3.5 py-2 text-sm font-mono text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Team Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Team
            </label>
            {hasHistoricalCommits ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800">
                  Team {String(participant.teamNumber).padStart(2, '0')} — {participant.teamName}
                </span>
                <span className="ml-auto text-[11px] text-amber-700 font-medium">
                  Locked ({participant.commitCount} commits recorded)
                </span>
              </div>
            ) : (
              <select
                value={teamId}
                onChange={(e) => setTeamId(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Team {String(t.teamNumber).padStart(2, '0')} — {t.teamName}
                  </option>
                ))}
              </select>
            )}
            {hasHistoricalCommits && (
              <p className="mt-1 text-[11px] text-slate-400">
                Team reassignment is locked to preserve historical audit trail integrity.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
              >
                <option value="DEVELOPER">Developer</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="FRONTEND_DEV">Frontend Dev</option>
                <option value="BACKEND_DEV">Backend Dev</option>
                <option value="FULLSTACK_DEV">Fullstack Dev</option>
                <option value="DESIGNER">Designer</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Roster Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
              >
                <option value="REGISTERED">REGISTERED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2E45A2] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
