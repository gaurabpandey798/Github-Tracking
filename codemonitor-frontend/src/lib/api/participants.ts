import { apiClient } from './client';
import {
  ParticipantResponse,
  ParticipantSyncResponse,
  GithubUserDto,
  CreateParticipantPayload,
  UpdateParticipantPayload,
} from '@/types/api';

/**
 * Fetch registered participants from the Spring Boot backend.
 * Uses GET /api/admin/participants (with optional teamId filter).
 */
export async function getParticipants(teamId?: number): Promise<ParticipantResponse[]> {
  const query = teamId ? `?teamId=${teamId}` : '';
  const response = await apiClient<
    ParticipantResponse[] | { value?: ParticipantResponse[]; data?: ParticipantResponse[] }
  >(`/api/admin/participants${query}`);

  if (Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray(response.value)) {
    return response.value;
  }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

/**
 * Fetch a single participant by ID.
 * Uses GET /api/admin/participants/{id}
 */
export async function getParticipant(id: number): Promise<ParticipantResponse> {
  return apiClient<ParticipantResponse>(`/api/admin/participants/${id}`);
}

/**
 * Register a new official event participant.
 * Uses POST /api/admin/participants
 */
export async function createParticipant(
  payload: CreateParticipantPayload
): Promise<ParticipantResponse> {
  return apiClient<ParticipantResponse>('/api/admin/participants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing participant's information.
 * Uses PUT /api/admin/participants/{id}
 */
export async function updateParticipant(
  id: number,
  payload: UpdateParticipantPayload
): Promise<ParticipantResponse> {
  return apiClient<ParticipantResponse>(`/api/admin/participants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Remove an official participant from the event roster.
 * Historical commits, checkpoints, and activity are preserved.
 * Uses DELETE /api/admin/participants/{id}
 */
export async function deleteParticipant(id: number): Promise<void> {
  await apiClient<void>(`/api/admin/participants/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Sync participants across teams from GitHub organization teams and repositories.
 * Uses POST /api/admin/participants/sync-from-github
 */
export async function syncParticipantsFromGithub(
  teamId?: number
): Promise<ParticipantSyncResponse> {
  const query = teamId ? `?teamId=${teamId}` : '';
  return apiClient<ParticipantSyncResponse>(
    `/api/admin/participants/sync-from-github${query}`,
    {
      method: 'POST',
    }
  );
}

/**
 * Fetch GitHub members in the organization who are not yet enrolled in any team.
 * Uses GET /api/admin/participants/unassigned-members
 */
export async function getUnassignedOrgMembers(): Promise<GithubUserDto[]> {
  const response = await apiClient<
    GithubUserDto[] | { value?: GithubUserDto[]; data?: GithubUserDto[] }
  >('/api/admin/participants/unassigned-members');

  if (Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray(response.value)) {
    return response.value;
  }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

