# IDEA-X 2026 CODE MONITOR BACKEND

Backend monitoring, manual sprint phase lifecycle control, immutable checkpoint capture, and heuristic activity auditing system for **MBMC IdeaX 2026 Hackathon**.

---

## 1. System Overview

IdeaX Code Monitor oversees 20 private GitHub repositories for 20 teams during IdeaX 2026.
It is built with two core responsibilities:
1. **GitHub Activity Monitoring**: Continuously synchronizes commits via REST API polling and real-time HMAC-verified Webhooks, detecting unusual activities (large commits, unrecognized contributors, sudden bursts, force pushes) without accusatory bias (flags are marked `Review Recommended`).
2. **Event Phase Control**: The organizer manually controls Sprint development phases (**Sprint 1 through Sprint 8**). Freezing a sprint creates an immutable checkpoint (capturing HEAD commit SHA and commit statistics) as an immutable audit record without archiving or locking the GitHub repository. Any commits occurring after the checkpoint SHA are tracked as post-checkpoint activity. Releasing the next sprint marks it ACTIVE normally.

---

## 2. Requirements & Technology Stack

- **Java**: OpenJDK 21 (LTS)
- **Framework**: Spring Boot 3.3.4
  - Spring Web (REST MVC)
  - Spring Data JPA (Hibernate 6)
  - Spring Validation (Hibernate Validator)
  - Spring Security (HTTP Basic for Admin, HMAC SHA-256 for Webhooks)
- **Database**: MySQL 8.0 (`ideax_codemonitor`)
- **Database Migrations**: Flyway (`V1__initial_schema.sql`, `V2__seed_initial_data.sql`)
- **API Documentation**: SpringDoc OpenAPI 2.6.0 (Swagger UI at `/swagger-ui.html`)
- **Build Tool**: Apache Maven 3.9+
- **Lombok**: Enabled

---

## 3. Database & Flyway Schema

### Database Setup
Create the MySQL database if it does not already exist:
```sql
CREATE DATABASE IF NOT EXISTS ideax_codemonitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Automatic Flyway Migrations
The application runs Flyway on startup (`spring.jpa.hibernate.ddl-auto: validate`):
- `V1__initial_schema.sql`: Creates core tables:
  - `event_state`: Overarching hackathon status (`NOT_STARTED`, `ACTIVE`, `COMPLETED`)
  - `teams`: 20 participating teams
  - `participants`: Team members mapped by `github_user_id` and `github_username`
  - `repositories`: Private team repositories mapped by `github_repository_id`
  - `sprints`: Development Sprints 1 to 8 (`NOT_STARTED`, `ACTIVE`, `FROZEN`, `COMPLETED`)
  - `checkpoints`: Immutable freeze checkpoints (`uq_checkpoints_sprint_team` on `sprint_id` + `team_id`)
  - `commits`: Ingested commit history (`uq_commits_repo_sha` on `repository_id` + `github_commit_sha`)
  - `review_flags`: Heuristic flags (`Review Recommended`)
  - `audit_logs`: Append-only audit record of all administrative and lifecycle actions
  - `webhook_deliveries`: Delivery ID idempotency table (`X-GitHub-Delivery`)
- `V2__seed_initial_data.sql`:
  - Initializes `event_state` (ID: 1, `NOT_STARTED`)
  - Seeds all 8 Development Sprints (`Development Sprint 1` to `Development Sprint 8`)
  - Seeds Team 01 (`Team 4NF`)

---

## 4. Environment Variables & Configuration

Configuration is managed via environment variables (or `.env` locally). A template is provided in [`.env.example`](file:///c:/tracking/.env.example):

| Variable | Description | Default / Example |
|---|---|---|
| `DB_URL` | MySQL JDBC connection string | `jdbc:mysql://localhost:3306/ideax_codemonitor?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USERNAME` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database password | *(secret)* |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_...` / `github_pat_...` |
| `GITHUB_ORGANIZATION` | GitHub Organization name | `MBMC-IdeaX` |
| `GITHUB_API_URL` | GitHub REST API Base URL | `https://api.github.com` |
| `GITHUB_API_VERSION` | GitHub API Version header | `2022-11-28` |
| `GITHUB_WEBHOOK_SECRET` | HMAC SHA-256 Webhook secret | *(secret)* |
| `ADMIN_USERNAME` | Organizer Admin API user | `admin` |
| `ADMIN_PASSWORD` | Organizer Admin API password | `admin123` |
| `PORT` | Server listening port | `8085` (or `8080`) |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `local` |

---

## 5. GitHub Token Permissions

For the initial MVP, generate a **Fine-grained Personal Access Token (PAT)** or classic PAT under an organization administrator account for `MBMC-IdeaX`:
- **Repository Permissions**:
  - `Administration`: **Read and Write** *(Mandatory for Archiving/Unarchiving team repositories upon Freeze/Release)*
  - `Contents`: **Read-only** (or Read and Write) *(Mandatory for reading commit logs, file stats, and HEAD SHAs)*
  - `Metadata`: **Read-only** *(Mandatory for reading repository details and default branches)*
- **Organization Permissions**:
  - `Members`: **Read-only** *(Optional: for mapping team membership)*

> **Security Guarantee**:
> - `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET` are never hardcoded and never logged.
> - Authorization headers are scrubbed from logs.
> - GitHub tokens are never exposed in any REST API response or frontend contract.

---

## 6. How to Build & Run

### 1. Build and Run Tests
```powershell
mvn clean test
```
All 16 unit, integration, and security tests run against an in-memory H2 database in MySQL mode with mock GitHub API clients.

### 2. Run the Application Locally
Create a `.env` file from `.env.example`:
```powershell
cp .env.example .env
```
Populate `.env` with your MySQL credentials, GitHub Token, and Webhook Secret, then run:
```powershell
# In PowerShell:
Get-Content .env | Where-Object { $_ -match '^([^#][^=]+)=(.*)$' } | ForEach-Object {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
}
mvn spring-boot:run
```

---

## 7. How to Test Team-4NF (First Demo Flow)

`Team-4NF` is Team 01's actual repository under `MBMC-IdeaX`.

### Step 1: Automatic Setup & Sync for Team-4NF
Call the setup endpoint to link `MBMC-IdeaX/Team-4NF` to Team 01 and sync its commit history:
```http
POST /api/admin/repositories/setup-team-4nf
Authorization: Basic YWRtaW46YWRtaW4xMjM=
```

### Step 2: Release Event
Release the event and activate Sprint 1 (note is mandatory):
```http
POST /api/admin/event/release
Authorization: Basic YWRtaW46YWRtaW4xMjM=
Content-Type: application/json

{
  "note": "IdeaX 2026 Event officially started"
}
```
*Result: Event status changes to `ACTIVE`, Sprint 1 status changes to `ACTIVE`.*

### Step 3: Freeze Sprint 1
Freeze Sprint 1 when dev time ends (note is mandatory):
```http
POST /api/admin/sprints/1/freeze
Authorization: Basic YWRtaW46YWRtaW4xMjM=
Content-Type: application/json

{
  "note": "Dev Sprint 1 ended"
}
```
*Result: Captures immutable checkpoint with HEAD SHA and commit stats ("Checkpoint Recorded" / "Sprint Frozen (Audit Checkpoint)"), marks Sprint 1 as `FROZEN`, and keeps repository active (no GitHub archiving).*

### Step 4: Release Sprint 2
Release the next sprint (note is mandatory, validates previous sprint is frozen):
```http
POST /api/admin/sprints/2/release
Authorization: Basic YWRtaW46YWRtaW4xMjM=
Content-Type: application/json

{
  "note": "Sprint 2 starts"
}
```
*Result: Activates Sprint 2 normally without needing to unarchive repositories.*

### Step 5: Sync Commits
Synchronize newly pushed commits:
```http
POST /api/admin/repositories/1/sync
Authorization: Basic YWRtaW46YWRtaW4xMjM=
```

---

## 8. REST API Reference

Interactive Swagger documentation is available at `http://localhost:8085/swagger-ui.html` and OpenAPI specification at `/v3/api-docs`.

### Event Control
- `GET /api/admin/event`: Returns overall event status, active sprint, counts for teams, participants, repositories, and open review flags.
- `POST /api/admin/event/release`: Releases event (`NOT_STARTED` -> `ACTIVE`), activates Sprint 1, and records audit logs.

### Sprint Control
- `GET /api/admin/sprints`: Lists all 8 sprints with status and metadata.
- `GET /api/admin/sprints/{id}`: Detailed sprint summary with checkpoints, commits, and review flags.
- `POST /api/admin/sprints/{sprintId}/freeze`: Freezes active sprint, records immutable checkpoints ("Checkpoint Recorded"), keeps repositories active. Returns per-team results.
- `POST /api/admin/sprints/{sprintId}/release`: Releases next sprint normally.

### Repositories & Sync
- `GET /api/admin/repositories`: Lists all monitored repositories.
- `POST /api/admin/repositories/{repositoryId}/sync`: Pulls recent commits from GitHub, checks contributors and heuristics.
- `POST /api/admin/repositories/setup-team-4nf`: Auto-connects `MBMC-IdeaX/Team-4NF` to Team 01.

### Reports
- `GET /api/admin/reports/event`: Overarching event progress, checkpoint completion percentage.
- `GET /api/admin/reports/teams/{teamId}`: Complete team report including commits, sprint stats, checkpoints, and flags.
- `GET /api/admin/reports/sprints/{sprintId}`: Sprint breakdown with team completion and commit additions/deletions.

### Review Flags
- `GET /api/admin/review-flags`: Lists all `Review Recommended` flags (can filter by `?status=OPEN`).
- `POST /api/admin/review-flags/{id}/resolve`: Resolves or dismisses a flag with an organizer review note.

### GitHub Webhooks
- `POST /api/webhooks/github`: Receives push, pull_request, and ping events. Authenticated by `X-Hub-Signature-256`. Deduplicated via `X-GitHub-Delivery`.

---

## 9. Unusual Activity Detection Heuristics

The system implements 6 deterministic rules (no AI). Flagged activities are labeled **"Review Recommended"** and never label teams as cheating:

1. **`LARGE_COMMIT`**: Triggered when a commit modifies more than `monitoring.large-commit.files-threshold` files (default 100) or `monitoring.large-commit.lines-threshold` lines (default 5000). Severity: `MEDIUM`.
2. **`BULK_CHANGE`**: Triggered when a checkpoint records files changed exceeding a configurable factor (default 3.0x) compared to the previous sprint checkpoint. Severity: `LOW`.
3. **`UNKNOWN_CONTRIBUTOR`**: Triggered when a commit author is not mapped to the team's registered participant roster. The commit is still saved; a flag is created for organizer verification. Severity: `HIGH`.
4. **`FORCE_PUSH` / `HISTORY_CHANGE`**: Detected from GitHub webhook payloads (`forced: true`) or branch history discrepancies. Severity: `HIGH`.
5. **`SUDDEN_ACTIVITY`**: Triggered when commit count within a rolling window (`monitoring.sudden-activity.window-minutes`, default 15m) exceeds `monitoring.sudden-activity.commits-threshold` (default 10 commits). Severity: `MEDIUM`.
6. **`NO_ACTIVITY`**: Triggered during checkpoint creation if a team recorded 0 commits during the active sprint. Severity: `LOW`.

---

## 10. Webhook Setup on GitHub

In the GitHub Organization or Repository settings:
1. Go to **Settings > Webhooks > Add webhook**.
2. **Payload URL**: `https://<YOUR-DOMAIN>/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Value of `GITHUB_WEBHOOK_SECRET`
5. **Events**: Select **Pushes** and **Pull requests**.
6. Active: **Checked**.

---

## 11. Security Notes

1. **HMAC SHA-256 Signature Verification**: All webhook payloads are cryptographically validated against `X-Hub-Signature-256` using constant-time comparison (`MessageDigest.isEqual`) to prevent timing attacks.
2. **Webhook Idempotency**: Every `X-GitHub-Delivery` GUID is stored in `webhook_deliveries`. Duplicate requests are recognized and ignored safely.
3. **Destructive Operation Safety**:
   - Checkpoint capture (`freeze`) creates an immutable audit record without locking or archiving the GitHub repository.
   - Freeze requires an explicit, non-empty organizer note.
   - Checkpoints are idempotent: once created, the checkpoint commit SHA is immutable.
   - Partial freeze failures are reported per-team; success is never reported falsely.
4. **Append-Only Audit Logging**: All lifecycle changes (`EVENT_RELEASED`, `SPRINT_RELEASED`, `SPRINT_FROZEN`, `CHECKPOINT_CREATED`, `REPOSITORY_ARCHIVED`, `REPOSITORY_UNARCHIVED`, `COMMIT_RECEIVED`, `REVIEW_FLAG_CREATED`, `REVIEW_FLAG_REVIEWED`) are recorded with timestamps, actor IDs, notes, and metadata payloads.
