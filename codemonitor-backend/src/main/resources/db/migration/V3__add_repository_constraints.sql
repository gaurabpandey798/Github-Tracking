-- V3: Add unique constraint on repository full_name
ALTER TABLE repositories
    ADD CONSTRAINT uq_repositories_full_name UNIQUE (full_name);
