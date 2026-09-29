CREATE TABLE IF NOT EXISTS event_state (
    id INT PRIMARY KEY,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    current_sprint_number INT NULL,
    release_note TEXT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_number INT NOT NULL UNIQUE,
    team_name VARCHAR(100) NOT NULL,
    github_team_id BIGINT NULL,
    github_team_slug VARCHAR(100) NULL,
    repository_id BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    github_user_id BIGINT NOT NULL,
    github_username VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_participants_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repositories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    github_repository_id BIGINT NOT NULL UNIQUE,
    owner VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    team_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_repositories_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sprints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sprint_number INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    release_note TEXT NULL,
    freeze_note TEXT NULL,
    released_at TIMESTAMP NULL,
    released_by VARCHAR(100) NULL,
    frozen_at TIMESTAMP NULL,
    frozen_by VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkpoints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    repository_id BIGINT NOT NULL,
    commit_sha VARCHAR(100) NOT NULL,
    commit_count INT NOT NULL DEFAULT 0,
    developer_count INT NOT NULL DEFAULT 0,
    files_changed INT NOT NULL DEFAULT 0,
    additions INT NOT NULL DEFAULT 0,
    deletions INT NOT NULL DEFAULT 0,
    first_activity_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_checkpoints_sprint_team UNIQUE (sprint_id, team_id),
    CONSTRAINT fk_checkpoints_sprint FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE RESTRICT,
    CONSTRAINT fk_checkpoints_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE RESTRICT,
    CONSTRAINT fk_checkpoints_repository FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    github_commit_sha VARCHAR(100) NOT NULL,
    repository_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    participant_id BIGINT NULL,
    author_github_user_id BIGINT NULL,
    author_username VARCHAR(100) NOT NULL,
    message TEXT NULL,
    branch VARCHAR(100) NULL,
    committed_at TIMESTAMP NOT NULL,
    github_created_at TIMESTAMP NULL,
    additions INT NOT NULL DEFAULT 0,
    deletions INT NOT NULL DEFAULT 0,
    changed_files INT NOT NULL DEFAULT 0,
    commit_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_commits_repo_sha UNIQUE (repository_id, github_commit_sha),
    CONSTRAINT fk_commits_repository FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE CASCADE,
    CONSTRAINT fk_commits_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_commits_participant FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS review_flags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    repository_id BIGINT NOT NULL,
    sprint_id BIGINT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    commit_sha VARCHAR(100) NULL,
    evidence_json TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(100) NULL,
    review_note TEXT NULL,
    CONSTRAINT fk_review_flags_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_flags_repository FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_flags_sprint FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100) NULL,
    team_id BIGINT NULL,
    repository_id BIGINT NULL,
    sprint_id BIGINT NULL,
    note TEXT NULL,
    metadata_json TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
