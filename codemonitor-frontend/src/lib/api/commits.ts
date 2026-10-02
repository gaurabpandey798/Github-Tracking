import { getSprints, getSprintById } from './sprints';
import { EnrichedCommit } from '@/types/api';

/**
 * Aggregates all commits globally across active and frozen sprints.
 * Does not invent an endpoint; calls GET /api/admin/sprints then GET /api/admin/sprints/{id}.
 */
export async function getGlobalCommits(): Promise<EnrichedCommit[]> {
  const allSprints = await getSprints();

  // Find sprints that have recorded activity
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

  const commits: EnrichedCommit[] = [];
  const seenKeys = new Set<string>();

  for (const detail of sprintDetails) {
    if (!detail || !detail.recentCommits) continue;
    for (const c of detail.recentCommits) {
      const key = `${c.commitSha}-${detail.sprintNumber}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        commits.push({
          ...c,
          sprintId: detail.id,
          sprintNumber: detail.sprintNumber,
          sprintName: detail.name,
          sprintStatus: detail.status,
        });
      }
    }
  }

  // Sort descending by commit timestamp
  commits.sort((a, b) => {
    const timeA = new Date(a.committedAt).getTime();
    const timeB = new Date(b.committedAt).getTime();
    return timeB - timeA;
  });

  return commits;
}
