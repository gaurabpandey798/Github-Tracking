import { apiClient } from './client';
import {
  ReviewFlag,
  ReviewFlagStatus,
  ReviewFlagResolutionRequest,
} from '@/types/api';

/**
 * Fetch review flags, optionally filtered by status (OPEN, REVIEWED, DISMISSED).
 * Uses GET /api/admin/review-flags
 */
export async function getReviewFlags(status?: ReviewFlagStatus): Promise<ReviewFlag[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient<ReviewFlag[]>(`/api/admin/review-flags${query}`);
}

/**
 * Resolve or dismiss a review flag.
 * Uses POST /api/admin/review-flags/{id}/resolve
 */
export async function resolveReviewFlag(
  id: number | string,
  data: ReviewFlagResolutionRequest
): Promise<ReviewFlag> {
  return apiClient<ReviewFlag>(`/api/admin/review-flags/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
