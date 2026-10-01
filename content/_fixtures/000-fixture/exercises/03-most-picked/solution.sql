SELECT pokemon, count(*) AS picks
FROM team_members
GROUP BY pokemon
ORDER BY picks DESC, pokemon;
