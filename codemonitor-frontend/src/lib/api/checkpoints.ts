import { getSprints, getSprintById } from './sprints';
import { EnrichedCheckpoint } from '@/types/api';

/**
 * Aggregates all checkpoints globally across active and frozen sprints.
 * Does not invent an endpoint; calls GET /api/admin/sprints then GET /api/admin/sprints/{id}.
 */
export async function getGlobalCheckpoints(): Promise<EnrichedCheckpoint[]> {
  const allSprints = await getSprints();

  // Find sprints that have recorded checkpoints or are active/frozen
  const relevantSprints = allSprints.filter(
    (s) => s.checkpointsCount > 0 || s.status === 'FROZEN' || s.status === 'ACTIVE'
  );

  if (relevantSprints.length === 0) {
    return [];
  }

  // Fetch sprint details in parallel
  const sprintDetails = await Promise.all(
    relevantSprints.map((s) => getSprintById(s.id).catch(() => null))
  );

  const checkpoints: EnrichedCheckpoint[] = [];

  for (const detail of sprintDetails) {
    if (!detail || !detail.checkpoints) continue;
    for (const cp of detail.checkpoints) {
      checkpoints.push({
        ...cp,
        sprintId: detail.id,
        sprintNumber: detail.sprintNumber,
        sprintName: detail.name,
        sprintStatus: detail.status,
      });
    }
  }

  // Sort descending by sprintNumber, then checkpointId
  checkpoints.sort((a, b) => {
    if (b.sprintNumber !== a.sprintNumber) {
      return b.sprintNumber - a.sprintNumber;
    }
    return b.checkpointId - a.checkpointId;
  });

  return checkpoints;
}
