'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { SprintSummary } from '@/types/api';
import { releaseSprint } from '@/lib/api/sprints';
import { Play, AlertCircle, Loader2 } from 'lucide-react';

interface ReleaseDialogProps {
  sprint: SprintSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReleaseDialog({
  sprint,
  isOpen,
  onClose,
  onSuccess,
}: ReleaseDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMessage('A release note is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await releaseSprint(sprint.id, { note: note.trim() });
      setNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to release sprint. Ensure previous sprint is frozen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          setErrorMessage(null);
          onClose();
        }
      }}
      title={`Release Sprint ${sprint.sprintNumber}`}
      subtitle={sprint.name}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-blue-50/70 p-3.5 border border-blue-200 text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5 text-[#2E45A2] fill-current" />
            Organizer Sprint Activation
          </p>
          <p className="mt-1 text-slate-600">
            Releasing this sprint will activate event development phase {sprint.sprintNumber}.
            The previous sprint must already be frozen.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <div>
          <label
            htmlFor="release-note"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Release Note <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Enter an official organizer note (e.g. announcement, scope details).
          </p>
          <textarea
            id="release-note"
            rows={3}
            required
            disabled={isSubmitting}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Development Sprint 3 officially released for all teams..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden disabled:bg-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !note.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Release
          </button>
        </div>
      </form>
    </Modal>
  );
}
