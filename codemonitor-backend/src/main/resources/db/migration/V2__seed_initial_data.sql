-- Initialize Event State
INSERT INTO event_state (id, status, current_sprint_number)
VALUES (1, 'NOT_STARTED', NULL)
ON DUPLICATE KEY UPDATE id = id;

-- Initialize 8 Sprints
INSERT INTO sprints (sprint_number, name, status)
VALUES
    (1, 'Development Sprint 1', 'NOT_STARTED'),
    (2, 'Development Sprint 2', 'NOT_STARTED'),
    (3, 'Development Sprint 3', 'NOT_STARTED'),
    (4, 'Development Sprint 4', 'NOT_STARTED'),
    (5, 'Development Sprint 5', 'NOT_STARTED'),
    (6, 'Development Sprint 6', 'NOT_STARTED'),
    (7, 'Development Sprint 7', 'NOT_STARTED'),
    (8, 'Development Sprint 8', 'NOT_STARTED')
ON DUPLICATE KEY UPDATE sprint_number = sprint_number;

-- Initialize Team 01 (Team-4NF)
INSERT INTO teams (id, team_number, team_name, status)
VALUES (1, 1, 'Team 4NF', 'ACTIVE')
ON DUPLICATE KEY UPDATE id = id;
