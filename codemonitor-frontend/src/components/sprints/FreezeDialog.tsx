'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { SprintSummary } from '@/types/api';
import { freezeSprint } from '@/lib/api/sprints';
import { Lock, AlertCircle, Info, Loader2 } from 'lucide-react';

interface FreezeDialogProps {
  sprint: SprintSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FreezeDialog({
  sprint,
  isOpen,
  onClose,
  onSuccess,
}: FreezeDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMessage('A freeze note is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await freezeSprint(sprint.id, { note: note.trim() });
      setNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to freeze sprint.');
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
      title={`Freeze Sprint ${sprint.sprintNumber}`}
      subtitle={sprint.name}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Audit explanation banner */}
        <div className="rounded-lg bg-sky-50 p-3.5 border border-sky-200 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-[#1B2560]">
            <Info className="h-4 w-4 text-[#2E45A2]" />
            <span>Audit Checkpoint Policy</span>
          </div>
          <p className="mt-1 font-medium text-slate-800">
            Freeze creates an immutable audit checkpoint. It does not lock the GitHub repository.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            The system will record the HEAD commit SHA, commit count, and code statistics for all active teams at this exact moment. Any subsequent activity will be flagged for organizer review.
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
            htmlFor="freeze-note"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Freeze Note <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Enter an official freeze/audit note for this sprint checkpoint.
          </p>
          <textarea
            id="freeze-note"
            rows={3}
            required
            disabled={isSubmitting}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Sprint 2 checkpoint - End of evaluation window 2..."
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
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-800 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-900 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Lock className="h-3.5 w-3.5" />
            Confirm Freeze
          </button>
        </div>
      </form>
    </Modal>
  );
}
