'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { createTeam } from '@/lib/api/teams';
import { TeamEntity } from '@/types/api';
import { ApiClientError } from '@/lib/api/client';
import { Loader2, AlertCircle, Users } from 'lucide-react';

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdTeam: TeamEntity) => void;
  existingTeamNumbers?: number[];
}

export default function AddTeamModal({
  isOpen,
  onClose,
  onSuccess,
  existingTeamNumbers = [],
}: AddTeamModalProps) {
  const [teamNumber, setTeamNumber] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTeamNumber('');
    setTeamName('');
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedNumber = parseInt(teamNumber.trim(), 10);
    if (isNaN(parsedNumber) || parsedNumber < 1) {
      setError('Team number must be a valid positive number (1 or greater).');
      return;
    }

    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setError('Team name is required.');
      return;
    }

    if (existingTeamNumbers.includes(parsedNumber)) {
      setError(`Team with number ${parsedNumber} already exists in the system.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createTeam({
        teamNumber: parsedNumber,
        teamName: trimmedName,
      });
      resetForm();
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setError(err.message || `Team with number ${parsedNumber} already exists.`);
        } else {
          setError(err.message || 'Failed to create team. Please try again.');
        }
      } else {
        const errorObj = err as Error;
        setError(errorObj.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Team"
      subtitle="Register a new IdeaX hackathon team in CodeMonitor"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Team Number */}
        <div>
          <label
            htmlFor="teamNumber"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Team Number <span className="text-red-500">*</span>
          </label>
          <input
            id="teamNumber"
            type="number"
            min={1}
            step={1}
            required
            value={teamNumber}
            onChange={(e) => setTeamNumber(e.target.value)}
            placeholder="e.g. 3"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden disabled:bg-slate-50 transition-colors"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Unique numerical identifier for the team (e.g. 1, 2, 3).
          </p>
        </div>

        {/* Team Name */}
        <div>
          <label
            htmlFor="teamName"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            id="teamName"
            type="text"
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Team ABC"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden disabled:bg-slate-50 transition-colors"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Official team display name as registered in IdeaX 2026.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Creating team...</span>
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5" />
                <span>Create Team</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
