CREATE TABLE teams (
    id integer PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE team_members (
    team_id integer NOT NULL REFERENCES teams (id),
    pokemon text NOT NULL
);

INSERT INTO teams (id, name) VALUES
    (1, 'Rain Dance'),
    (2, 'Sun Room'),
    (3, 'Volt Turn');

INSERT INTO team_members (team_id, pokemon) VALUES
    (1, 'pelipper'), (1, 'barraskewda'), (1, 'ferrothorn'),
    (2, 'torkoal'), (2, 'venusaur'), (2, 'ferrothorn'),
    (3, 'rotom'), (3, 'ferrothorn'), (3, 'pelipper');
