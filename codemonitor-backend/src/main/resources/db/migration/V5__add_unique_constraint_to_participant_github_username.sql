-- V5: Add unique constraint on participant github_username to guarantee concurrency safety
ALTER TABLE participants ADD CONSTRAINT uq_participants_github_username UNIQUE (github_username);
