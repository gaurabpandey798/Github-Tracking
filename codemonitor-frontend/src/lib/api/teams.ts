import { apiClient } from './client';
import { TeamEntity, CreateTeamPayload } from '@/types/api';

/**
 * Fetch all registered IdeaX teams from backend.
 * Uses GET /api/admin/teams
 */
export async function getTeams(): Promise<TeamEntity[]> {
  const response = await apiClient<TeamEntity[] | { value?: TeamEntity[]; data?: TeamEntity[] }>(
    '/api/admin/teams'
  );

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
 * Register a new IdeaX team in CodeMonitor.
 * Uses POST /api/admin/teams
 */
export async function createTeam(payload: CreateTeamPayload): Promise<TeamEntity> {
  return apiClient<TeamEntity>('/api/admin/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
