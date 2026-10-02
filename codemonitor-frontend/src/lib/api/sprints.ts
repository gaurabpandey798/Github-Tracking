import { apiClient } from './client';
import {
  SprintSummary,
  SprintDetail,
  ReleaseSprintRequest,
  ReleaseSprintResponse,
  FreezeSprintRequest,
  FreezeSprintResponse,
} from '@/types/api';

/**
 * Fetch all sprints overview.
 * Uses GET /api/admin/sprints
 */
export async function getSprints(): Promise<SprintSummary[]> {
  return apiClient<SprintSummary[]>('/api/admin/sprints');
}

/**
 * Fetch detailed sprint information including checkpoints, recent commits, and review flags.
 * Uses GET /api/admin/sprints/{id}
 */
export async function getSprintById(id: number | string): Promise<SprintDetail> {
  return apiClient<SprintDetail>(`/api/admin/sprints/${id}`);
}

/**
 * Release next sprint.
 * Uses POST /api/admin/sprints/{id}/release
 * Note is required.
 */
export async function releaseSprint(
  sprintId: number | string,
  data: ReleaseSprintRequest
): Promise<ReleaseSprintResponse> {
  if (!data.note || data.note.trim().length === 0) {
    throw new Error('A release note is required to release a sprint.');
  }
  return apiClient<ReleaseSprintResponse>(`/api/admin/sprints/${sprintId}/release`, {
    method: 'POST',
    body: JSON.stringify({ note: data.note.trim() }),
  });
}

/**
 * Freeze current sprint. Creates an immutable audit checkpoint.
 * Does not lock GitHub repository.
 * Uses POST /api/admin/sprints/{id}/freeze
 * Note is required.
 */
export async function freezeSprint(
  sprintId: number | string,
  data: FreezeSprintRequest
): Promise<FreezeSprintResponse> {
  if (!data.note || data.note.trim().length === 0) {
    throw new Error('A freeze note is required to freeze a sprint.');
  }
  return apiClient<FreezeSprintResponse>(`/api/admin/sprints/${sprintId}/freeze`, {
    method: 'POST',
    body: JSON.stringify({ note: data.note.trim() }),
  });
}
