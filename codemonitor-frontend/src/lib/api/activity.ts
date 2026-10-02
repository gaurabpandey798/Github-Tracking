import { apiClient } from './client';
import { ActivityItem, ActivityFilterParams, PagedResponse } from '@/types/api';

/**
 * Fetch unified activity feed from the backend.
 * Uses GET /api/admin/activity
 */
export async function getActivityFeed(
  params?: ActivityFilterParams
): Promise<PagedResponse<ActivityItem>> {
  const searchParams = new URLSearchParams();

  if (params?.teamId !== undefined && params.teamId !== null) {
    searchParams.set('teamId', params.teamId.toString());
  }
  if (params?.type && params.type !== 'ALL') {
    searchParams.set('type', params.type);
  }
  if (params?.severity && params.severity !== 'ALL') {
    searchParams.set('severity', params.severity);
  }
  if (params?.from) {
    searchParams.set('from', params.from);
  }
  if (params?.to) {
    searchParams.set('to', params.to);
  }
  if (params?.search && params.search.trim() !== '') {
    searchParams.set('search', params.search.trim());
  }
  if (params?.page !== undefined) {
    searchParams.set('page', params.page.toString());
  }
  if (params?.size !== undefined) {
    searchParams.set('size', params.size.toString());
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/admin/activity${queryString ? `?${queryString}` : ''}`;

  return apiClient<PagedResponse<ActivityItem>>(endpoint);
}
