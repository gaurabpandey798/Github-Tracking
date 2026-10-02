import { apiClient } from './client';
import { AuditLogItem, AuditLogFilterParams, PagedResponse } from '@/types/api';

/**
 * Fetch administrative audit log records from the backend.
 * Uses GET /api/admin/audit-logs
 */
export async function getAuditLogs(
  params?: AuditLogFilterParams
): Promise<PagedResponse<AuditLogItem>> {
  const searchParams = new URLSearchParams();

  if (params?.teamId !== undefined && params.teamId !== null) {
    searchParams.set('teamId', params.teamId.toString());
  }
  if (params?.action && params.action !== 'ALL') {
    searchParams.set('action', params.action);
  }
  if (params?.page !== undefined) {
    searchParams.set('page', params.page.toString());
  }
  if (params?.size !== undefined) {
    searchParams.set('size', params.size.toString());
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/admin/audit-logs${queryString ? `?${queryString}` : ''}`;

  return apiClient<PagedResponse<AuditLogItem>>(endpoint);
}
