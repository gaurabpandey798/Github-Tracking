import { SprintStatus, ReviewFlagSeverity, ReviewFlagType } from '@/types/api';

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return dateString;
  }
}

export function truncateSha(sha?: string | null, length = 7): string {
  if (!sha) return '—';
  return sha.length > length ? sha.substring(0, length) : sha;
}

export function getSprintStatusConfig(status?: SprintStatus | string | null): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'ACTIVE',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'FROZEN':
      return {
        label: 'FROZEN',
        bg: 'bg-sky-50',
        text: 'text-[#2E45A2]',
        border: 'border-sky-200',
      };
    case 'COMPLETED':
      return {
        label: 'COMPLETED',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
      };
    case 'NOT_STARTED':
    default:
      return {
        label: 'NOT_STARTED',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
      };
  }
}

export function getSeverityConfig(severity: ReviewFlagSeverity): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (severity) {
    case 'HIGH':
      return {
        label: 'High Priority',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'MEDIUM':
      return {
        label: 'Medium Priority',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'LOW':
    default:
      return {
        label: 'Low Priority',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
  }
}

export function getReviewFlagTypeLabel(type: ReviewFlagType | string): {
  title: string;
  badge: string;
  description: string;
} {
  switch (type) {
    case 'POST_CHECKPOINT_ACTIVITY':
      return {
        title: 'Post-Checkpoint Activity',
        badge: 'Activity Flag',
        description: 'Commit occurred after the recorded checkpoint while the sprint was frozen.',
      };
    case 'LARGE_COMMIT':
      return {
        title: 'Large Commit Size',
        badge: 'Activity Flag',
        description: 'Single commit contains unusually large lines of code or file additions.',
      };
    case 'BULK_CHANGE':
      return {
        title: 'Bulk File Changes',
        badge: 'Activity Flag',
        description: 'Multiple files added or replaced simultaneously.',
      };
    case 'UNKNOWN_CONTRIBUTOR':
      return {
        title: 'Unregistered Contributor',
        badge: 'Requires Organizer Review',
        description: 'Commit author does not match registered team member GitHub handles.',
      };
    case 'FORCE_PUSH':
    case 'HISTORY_CHANGE':
      return {
        title: 'History Rewrite / Force Push',
        badge: 'Review Recommended',
        description: 'Git history modification or non-fast-forward push was detected.',
      };
    case 'SUDDEN_ACTIVITY':
      return {
        title: 'Sudden Influx of Activity',
        badge: 'Activity Flag',
        description: 'Unusual spike of commits or modifications in a short timeframe.',
      };
    case 'NO_ACTIVITY':
      return {
        title: 'No Recent Activity',
        badge: 'Review Recommended',
        description: 'No commits detected during the active sprint window.',
      };
    default:
      return {
        title: type.replace(/_/g, ' '),
        badge: 'Review Recommended',
        description: 'Review recommended by automated tracking heuristics.',
      };
  }
}
