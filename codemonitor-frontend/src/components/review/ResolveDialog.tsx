'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { ReviewFlag } from '@/types/api';
import { resolveReviewFlag } from '@/lib/api/reviewFlags';
import { CheckCircle2, AlertCircle, Loader2, GitCommit } from 'lucide-react';
import { truncateSha } from '@/lib/utils/formatters';

interface ResolveDialogProps {
  flag: ReviewFlag | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResolveDialog({
  flag,
  isOpen,
  onClose,
  onSuccess,
}: ResolveDialogProps) {
  const [status, setStatus] = useState<'REVIEWED' | 'DISMISSED'>('REVIEWED');
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!flag) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resolveReviewFlag(flag.id, {
        status,
        reviewNote: reviewNote.trim() || undefined,
      });
      setReviewNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to update review flag.');
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
      title="Resolve Organizer Review Flag"
      subtitle={`Flag #${flag.id} • ${flag.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Context box */}
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">
              {flag.team?.teamName || `Team ${flag.team?.teamNumber || '—'}`}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {flag.sprint?.name || `Sprint ${flag.sprint?.sprintNumber || '—'}`}
            </span>
          </div>
          <p className="text-slate-600">{flag.description}</p>
          {flag.commitSha && (
            <div className="flex items-center gap-1.5 pt-1 font-mono text-[11px] text-[#1B2560]">
              <GitCommit className="h-3.5 w-3.5 text-slate-400" />
              <span>Commit:</span>
              <span className="font-bold">{truncateSha(flag.commitSha, 10)}</span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Resolution Status Option */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Resolution Action <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('REVIEWED')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                status === 'REVIEWED'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Mark as Reviewed
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                Activity was inspected and verified by the organizer.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatus('DISMISSED')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                status === 'DISMISSED'
                  ? 'border-slate-600 bg-slate-100 ring-1 ring-slate-600 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-slate-600" />
                Dismiss Flag
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                Flag was deemed non-actionable or false trigger.
              </p>
            </button>
          </div>
        </div>

        {/* Organizer Review Note */}
        <div>
          <label
            htmlFor="organizer-review-note"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Organizer Note / Resolution Reason
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Add context for the audit trail explaining the resolution.
          </p>
          <textarea
            id="organizer-review-note"
            rows={3}
            disabled={isSubmitting}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="e.g. Consulted team mentor; commit was an emergency bugfix before checkpoint..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] focus:outline-hidden disabled:bg-slate-100"
          />
        </div>

        {/* Action Buttons */}
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E45A2] disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Resolution
          </button>
        </div>
      </form>
    </Modal>
  );
}
