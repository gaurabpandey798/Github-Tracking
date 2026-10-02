-- V4: Allow manual registration of participants without pre-knowing numeric github_user_id
ALTER TABLE participants MODIFY COLUMN github_user_id BIGINT NULL;
