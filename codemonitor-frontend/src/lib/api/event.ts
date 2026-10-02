import { apiClient } from './client';
import { EventStatusResponse } from '@/types/api';

/**
 * Fetch overall IdeaX event status, current sprint, and aggregate counts.
 * Uses GET /api/admin/event
 */
export async function getEventStatus(): Promise<EventStatusResponse> {
  return apiClient<EventStatusResponse>('/api/admin/event');
}
