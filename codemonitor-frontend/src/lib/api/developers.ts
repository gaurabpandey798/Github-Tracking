import { getTeams } from './teams';
import { getRepositories, syncRepository } from './repositories';
import { getGlobalCommits } from './commits';
import { getReviewFlags } from './reviewFlags';
import { getParticipants } from './participants';
import {
  DeveloperContributor,
  RepositorySyncResponse,
} from '@/types/api';

/**
 * Aggregates developer/contributor statistics from real backend data:
 * - Commits across sprints (GET /api/admin/sprints/{id})
 * - Official participants (GET /api/admin/participants)
 * - Review flags identifying unknown contributors (GET /api/admin/review-flags)
 * - Mapped teams and repositories (GET /api/admin/teams, GET /api/admin/repositories)
 *
 * Distinguishes:
 * - REGISTERED: Officially registered participant
 * - DETECTED: Observed GitHub contributor who is not in roster
 * - UNKNOWN: Contributor flagged for review
 */
export async function getDevelopers(): Promise<DeveloperContributor[]> {
  const [teams, repos, commits, reviewFlags, participants] = await Promise.all([
    getTeams(),
    getRepositories(),
    getGlobalCommits(),
    getReviewFlags().catch(() => []),
    getParticipants().catch(() => []),
  ]);

  const developersMap = new Map<string, DeveloperContributor>();

  // 1. Process all synchronized commits
  for (const c of commits) {
    if (!c.authorUsername) continue;
    const cleanUsername = c.authorUsername.trim();
    const teamNum = c.teamNumber;
    const key = `${teamNum}-${cleanUsername.toLowerCase()}`;

    // Lookup matching team and repo
    const team = teams.find((t) => t.teamNumber === teamNum);
    const repo = repos.find(
      (r) =>
        r.teamNumber === teamNum ||
        (team && (r.teamId === team.id || r.id === team.repositoryId))
    );

    if (!developersMap.has(key)) {
      developersMap.set(key, {
        id: key,
        username: cleanUsername,
        displayName: null,
        teamId: team?.id,
        teamNumber: teamNum,
        teamName: team?.teamName || `Team ${teamNum}`,
        repositoryName: repo?.name,
        repositoryFullName: repo?.fullName,
        repositoryUrl: repo?.url,
        commitsCount: 0,
        additions: 0,
        deletions: 0,
        firstActivityAt: c.committedAt,
        lastActivityAt: c.committedAt,
        status: 'DETECTED',
        role: null,
        reviewFlagsCount: 0,
        recentCommits: [],
      });
    }

    const dev = developersMap.get(key)!;
    dev.commitsCount += 1;
    dev.additions += c.additions || 0;
    dev.deletions += c.deletions || 0;
    dev.recentCommits.push(c);

    // Update timestamps
    if (c.committedAt) {
      if (!dev.firstActivityAt || new Date(c.committedAt) < new Date(dev.firstActivityAt)) {
        dev.firstActivityAt = c.committedAt;
      }
      if (!dev.lastActivityAt || new Date(c.committedAt) > new Date(dev.lastActivityAt)) {
        dev.lastActivityAt = c.committedAt;
      }
    }
  }

  // 2. Incorporate registered participants from official roster
  for (const p of participants) {
    if (!p.githubUsername) continue;
    const cleanUsername = p.githubUsername.trim();
    const teamNum = p.teamNumber;
    const key = `${teamNum}-${cleanUsername.toLowerCase()}`;
    const team = teams.find((t) => t.teamNumber === teamNum || t.id === p.teamId);
    const repo = repos.find(
      (r) =>
        r.teamNumber === teamNum ||
        (team && (r.teamId === team.id || r.id === team.repositoryId))
    );

    if (developersMap.has(key)) {
      const existing = developersMap.get(key)!;
      existing.status = 'REGISTERED';
      existing.displayName = p.displayName || existing.displayName;
      existing.role = p.role || existing.role;
    } else {
      // Registered participant who hasn't committed yet
      developersMap.set(key, {
        id: key,
        username: cleanUsername,
        displayName: p.displayName || null,
        teamId: team?.id || p.teamId,
        teamNumber: teamNum,
        teamName: team?.teamName || p.teamName || `Team ${teamNum}`,
        repositoryName: repo?.name,
        repositoryFullName: repo?.fullName,
        repositoryUrl: repo?.url,
        commitsCount: 0,
        additions: 0,
        deletions: 0,
        firstActivityAt: null,
        lastActivityAt: null,
        status: 'REGISTERED',
        role: p.role || 'MEMBER',
        reviewFlagsCount: 0,
        recentCommits: [],
      });
    }
  }

  // 3. Correlate with review flags (e.g. UNKNOWN_CONTRIBUTOR)
  for (const dev of developersMap.values()) {
    const devFlags = reviewFlags.filter((f) => {
      const matchTeam = f.team?.teamNumber === dev.teamNumber;
      const matchDesc =
        f.description?.toLowerCase().includes(dev.username.toLowerCase()) ||
        f.title?.toLowerCase().includes(dev.username.toLowerCase());
      return matchTeam && matchDesc;
    });

    dev.reviewFlagsCount = devFlags.length;

    // If flagged as unknown contributor and not registered, mark as UNKNOWN
    if (dev.status === 'DETECTED') {
      const isFlaggedUnknown = devFlags.some((f) => f.type === 'UNKNOWN_CONTRIBUTOR');
      if (isFlaggedUnknown) {
        dev.status = 'UNKNOWN';
      }
    }
  }

  // Convert to array and sort descending by commits count, then username
  const developers = Array.from(developersMap.values());
  developers.sort((a, b) => {
    if (b.commitsCount !== a.commitsCount) {
      return b.commitsCount - a.commitsCount;
    }
    return a.username.localeCompare(b.username);
  });

  return developers;
}

/**
 * Synchronize contributor commits across all registered IdeaX repositories.
 * Triggers POST /api/admin/repositories/{repositoryId}/sync for all monitored repos.
 */
export async function syncAllContributors(): Promise<{
  successCount: number;
  failureCount: number;
  results: RepositorySyncResponse[];
}> {
  const repos = await getRepositories();
  const results: RepositorySyncResponse[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const repo of repos) {
    try {
      const res = await syncRepository(repo.id);
      results.push(res);
      successCount++;
    } catch {
      failureCount++;
    }
  }

  return { successCount, failureCount, results };
}
