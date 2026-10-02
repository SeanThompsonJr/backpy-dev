ALTER TABLE teams ADD COLUMN is_public boolean;

INSERT INTO teams (id, name) VALUES (3, 'Trick Room');

SELECT id, name, is_public FROM teams ORDER BY id;
