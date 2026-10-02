export type EventStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';

export type SprintStatus = 'NOT_STARTED' | 'ACTIVE' | 'FROZEN' | 'COMPLETED';

export type ReviewFlagType =
  | 'LARGE_COMMIT'
  | 'BULK_CHANGE'
  | 'UNKNOWN_CONTRIBUTOR'
  | 'FORCE_PUSH'
  | 'HISTORY_CHANGE'
  | 'SUDDEN_ACTIVITY'
  | 'NO_ACTIVITY'
  | 'POST_CHECKPOINT_ACTIVITY';

export type ReviewFlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type ReviewFlagStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED';

export interface EventStatusResponse {
  eventStatus: EventStatus;
  currentSprintNumber: number | null;
  currentSprintName: string | null;
  currentSprintStatus: SprintStatus | null;
  teamCount: number;
  participantCount: number;
  repositoryCount: number;
  openReviewFlags: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface SprintSummary {
  id: number;
  sprintNumber: number;
  name: string;
  status: SprintStatus;
  releaseNote: string | null;
  freezeNote: string | null;
  releasedAt: string | null;
  releasedBy: string | null;
  frozenAt: string | null;
  frozenBy: string | null;
  checkpointsCount: number;
}

export interface CheckpointSummary {
  checkpointId: number;
  teamNumber: number;
  teamName: string;
  repositoryName: string;
  commitSha: string;
  commitCount: number;
  developerCount: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  createdAt: string | null;
}

export interface CommitSummary {
  commitSha: string;
  authorUsername: string;
  message: string;
  committedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  teamNumber: number;
}

export interface ReviewFlagSummary {
  id: number;
  teamNumber: number;
  type: ReviewFlagType;
  severity: ReviewFlagSeverity;
  title: string;
  description: string;
  status: ReviewFlagStatus;
  commitSha?: string | null;
  createdAt: string;
}

export interface SprintDetail {
  id: number;
  sprintNumber: number;
  name: string;
  status: SprintStatus;
  releaseNote: string | null;
  freezeNote: string | null;
  releasedAt: string | null;
  releasedBy: string | null;
  frozenAt: string | null;
  frozenBy: string | null;
  checkpoints: CheckpointSummary[];
  recentCommits: CommitSummary[];
  reviewFlags: ReviewFlagSummary[];
}

export interface ReleaseSprintRequest {
  note: string;
}

export interface ReleaseSprintResponse {
  sprintNumber: number;
  sprintName: string;
  status: string;
  releaseNote: string;
  releasedAt: string;
  unarchivedRepositories?: string[];
  failures?: string[];
}

export interface FreezeSprintRequest {
  note: string;
}

export interface FreezeResultItem {
  teamNumber: number;
  teamName: string;
  repository: string;
  status: string;
  message: string;
  checkpointSha: string;
  commitCount: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  errorMessage?: string | null;
}

export interface FreezeSprintResponse {
  sprint: string;
  sprintNumber: number;
  status: string;
  message: string;
  results: FreezeResultItem[];
  failures?: string[];
}

export interface TeamEntity {
  id: number;
  teamNumber: number;
  teamName: string;
  githubTeamId: string | null;
  githubTeamSlug: string | null;
  repositoryId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  teamNumber: number;
  teamName: string;
}

export interface GitRepositoryEntity {
  id: number;
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  private: boolean;
  archived: boolean;
  teamId?: number | null;
  teamNumber?: number | null;
}

/**
 * Shape for response wrapper if repositories are returned in a paginated or wrapped object.
 */
export interface RepositoriesResponseWrapper {
  value?: GitRepositoryEntity[];
  data?: GitRepositoryEntity[];
  Count?: number;
}

export interface RegisterRepositoryPayload {
  teamId?: number;
  teamNumber?: number;
  owner?: string;
  name: string;
}

export interface TeamWithRepository extends TeamEntity {
  repository?: GitRepositoryEntity | null;
}

export interface ReviewFlag {
  id: number;
  team: TeamEntity | null;
  repository: GitRepositoryEntity | null;
  sprint: {
    id: number;
    sprintNumber: number;
    name: string;
    status: SprintStatus;
    releaseNote: string | null;
    freezeNote: string | null;
    releasedAt: string | null;
    releasedBy: string | null;
    frozenAt: string | null;
    frozenBy: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  type: ReviewFlagType;
  severity: ReviewFlagSeverity;
  title: string;
  description: string;
  commitSha?: string | null;
  evidenceJson?: string | null;
  status: ReviewFlagStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
}

export interface ReviewFlagResolutionRequest {
  status: 'REVIEWED' | 'DISMISSED';
  reviewNote?: string;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}

export interface RepositorySyncResponse {
  repositoryId: number;
  repositoryName: string;
  branch: string;
  newCommitsCount: number;
  totalCommitsCount: number;
  detectedContributors: string[];
  flagsCreated: string[];
}

export interface SprintReportSummaryDto {
  sprintNumber: number;
  name: string;
  status: string;
  checkpointsCount: number;
}

export interface EventReportResponse {
  eventStatus: string;
  currentSprintNumber: number;
  totalTeams: number;
  totalParticipants: number;
  totalRepositories: number;
  totalCommits: number;
  totalContributors: number;
  totalReviewFlags: number;
  openReviewFlags: number;
  totalCheckpointsCreated: number;
  checkpointCompletionPercentage: number;
  sprints: SprintReportSummaryDto[];
}

export interface TeamSprintCheckpointDto {
  teamNumber: number;
  teamName: string;
  repositoryName: string;
  commitSha: string;
  commitCount: number;
  developerCount: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  lastActivityAt: string | null;
  status: string;
}

export interface SprintReportResponse {
  sprintNumber: number;
  sprintName: string;
  status: string;
  releasedAt: string | null;
  frozenAt: string | null;
  teamCompletionCount: number;
  totalTeams: number;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  flagsCount: number;
  checkpoints: TeamSprintCheckpointDto[];
}

export interface RepositorySummaryDto {
  id: number;
  fullName: string;
  url: string;
  defaultBranch: string;
  archived: boolean;
}

export interface ParticipantSummaryDto {
  id: number;
  githubUsername: string;
  githubUserId: number;
  displayName: string | null;
  role: string | null;
  status: string | null;
}

export interface SprintCommitStatDto {
  sprintNumber: number;
  sprintName: string;
  commitCount: number;
  additions: number;
  deletions: number;
}

export interface CheckpointHistoryDto {
  sprintNumber: number;
  commitSha: string;
  commitCount: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  createdAt: string;
}

export interface TeamReportResponse {
  teamId: number;
  teamNumber: number;
  teamName: string;
  teamStatus: string;
  repository: RepositorySummaryDto | null;
  participants: ParticipantSummaryDto[];
  totalCommits: number;
  uniqueContributors: number;
  totalFilesChanged: number;
  totalAdditions: number;
  totalDeletions: number;
  commitsBySprint: SprintCommitStatDto[];
  checkpointHistory: CheckpointHistoryDto[];
  reviewFlags: ReviewFlagSummary[];
}

export interface EnrichedCheckpoint extends CheckpointSummary {
  sprintId: number;
  sprintNumber: number;
  sprintName: string;
  sprintStatus: SprintStatus;
}

export interface EnrichedCommit extends CommitSummary {
  sprintId: number;
  sprintNumber: number;
  sprintName: string;
  sprintStatus: SprintStatus;
}

export type DeveloperStatus = 'REGISTERED' | 'DETECTED' | 'UNKNOWN';

export interface DeveloperContributor {
  id: string;
  username: string;
  displayName?: string | null;
  teamId?: number;
  teamNumber: number;
  teamName: string;
  repositoryName?: string;
  repositoryUrl?: string;
  repositoryFullName?: string;
  commitsCount: number;
  additions: number;
  deletions: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  status: DeveloperStatus;
  role?: string | null;
  reviewFlagsCount: number;
  recentCommits: EnrichedCommit[];
}

export interface ParticipantResponse {
  id: number;
  teamId: number;
  teamNumber: number;
  teamName: string;
  githubUserId: number | null;
  githubUsername: string;
  displayName: string | null;
  role: string;
  status: string;
  commitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantPayload {
  teamId: number;
  githubUsername: string;
  displayName?: string;
  name?: string;
  role?: string;
  githubUserId?: number | null;
}

export interface UpdateParticipantPayload {
  teamId?: number;
  githubUsername?: string;
  displayName?: string;
  name?: string;
  role?: string;
  status?: string;
}

export interface GithubUserDto {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  html_url?: string | null;
}

export interface ParticipantSyncResponse {
  totalTeamsChecked: number;
  teamsMatched: number;
  participantsSynced: number;
  newParticipantsAdded: number;
  participants: ParticipantResponse[];
  unassignedOrgMembers?: GithubUserDto[];
  messages: string[];
}

export type ActivityType =
  | 'COMMIT'
  | 'SPRINT'
  | 'CHECKPOINT'
  | 'REPOSITORY'
  | 'PARTICIPANT'
  | 'REVIEW'
  | 'WEBHOOK'
  | 'AUDIT'
  | 'SYSTEM';

export type ActivitySeverity = 'INFO' | 'WARNING' | 'MEDIUM' | 'HIGH';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: string;
  title: string;
  description: string;
  timestamp: string;
  severity: ActivitySeverity;
  teamId?: number | null;
  teamNumber?: number | null;
  teamName?: string | null;
  repositoryId?: number | null;
  repositoryName?: string | null;
  actor?: string | null;
  githubUsername?: string | null;
  status: string;
  requiresReview: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogItem {
  id: number;
  action: string;
  actor: string;
  actorId?: string | null;
  teamId?: number | null;
  teamNumber?: number | null;
  teamName?: string | null;
  repositoryId?: number | null;
  repositoryName?: string | null;
  sprintId?: number | null;
  note?: string | null;
  metadataJson?: string | null;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ActivityFilterParams {
  teamId?: number;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface AuditLogFilterParams {
  teamId?: number;
  action?: string;
  page?: number;
  size?: number;
}
