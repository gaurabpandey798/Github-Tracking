import { apiClient } from './client';
import {
  GitRepositoryEntity,
  RepositorySyncResponse,
  RepositoriesResponseWrapper,
  RegisterRepositoryPayload,
} from '@/types/api';

/**
 * Fetch all registered repositories from backend.
 * Uses GET /api/admin/repositories
 * Safely normalizes direct array responses and wrapped objects ({ value: [...], Count: 1 }).
 */
export async function getRepositories(): Promise<GitRepositoryEntity[]> {
  const response = await apiClient<GitRepositoryEntity[] | RepositoriesResponseWrapper>(
    '/api/admin/repositories'
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
 * Register a new GitHub repository for an IdeaX team.
 * Uses POST /api/admin/repositories
 * The backend validates and verifies the repository against GitHub.
 */
export async function registerRepository(
  payload: RegisterRepositoryPayload
): Promise<GitRepositoryEntity> {
  return apiClient<GitRepositoryEntity>('/api/admin/repositories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Synchronize a repository commits and audit state from GitHub.
 * Uses POST /api/admin/repositories/{repositoryId}/sync
 */
export async function syncRepository(
  repositoryId: number | string
): Promise<RepositorySyncResponse> {
  return apiClient<RepositorySyncResponse>(
    `/api/admin/repositories/${repositoryId}/sync`,
    {
      method: 'POST',
    }
  );
}

/**
 * Setup Team 4NF repository integration (explicitly triggered by user).
 * Uses POST /api/admin/repositories/setup-team-4nf
 */
export async function setupTeam4NF(): Promise<unknown> {
  return apiClient<unknown>('/api/admin/repositories/setup-team-4nf', {
    method: 'POST',
  });
}
