UPDATE teams 
SET team_name = '14 Peaks', github_team_slug = '14_peaks', github_team_id = 19844616 
WHERE team_number = 7 OR team_name = 'Team-Jhapali';

UPDATE teams 
SET team_name = 'TechBenders', github_team_slug = 'techbenders', github_team_id = 19844635 
WHERE team_number = 10 OR team_name = 'ThirdEye';

UPDATE repositories 
SET name = '14_Peaks', full_name = 'MBMC-IdeaX/14_Peaks', url = 'https://github.com/MBMC-IdeaX/14_Peaks', github_repository_id = 1397247000 
WHERE team_id = 7 OR name = 'Team-Jhapali';

UPDATE repositories 
SET name = 'TechBenders', full_name = 'MBMC-IdeaX/TechBenders', url = 'https://github.com/MBMC-IdeaX/TechBenders', github_repository_id = 1397249732 
WHERE team_id = 10 OR name = 'ThirdEye';
