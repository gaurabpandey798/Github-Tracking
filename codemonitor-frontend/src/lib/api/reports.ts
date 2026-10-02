import { apiClient } from './client';
import {
  EventReportResponse,
  SprintReportResponse,
  TeamReportResponse,
} from '@/types/api';

/**
 * Fetch global Event audit report.
 * Uses GET /api/admin/reports/event
 */
export async function getEventReport(): Promise<EventReportResponse> {
  return apiClient<EventReportResponse>('/api/admin/reports/event');
}

/**
 * Fetch specific sprint audit report.
 * Uses GET /api/admin/reports/sprints/{sprintId}
 */
export async function getSprintReport(
  sprintId: number | string
): Promise<SprintReportResponse> {
  return apiClient<SprintReportResponse>(`/api/admin/reports/sprints/${sprintId}`);
}

/**
 * Fetch team audit and contribution report.
 * Uses GET /api/admin/reports/teams/{teamId}
 */
export async function getTeamReport(
  teamId: number | string
): Promise<TeamReportResponse> {
  return apiClient<TeamReportResponse>(`/api/admin/reports/teams/${teamId}`);
}
