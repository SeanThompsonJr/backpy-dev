PokeTeam is adding public teams that anyone can browse. The rule from the product owner:
**every team is private unless its owner makes it public**, and that includes the teams
that already exist.

The script in the editor adds an `is_public` column to `teams`, creates a new team without
saying whether it's public, and lists every team.

Change the script so every team, old and new, comes out with `is_public` set to `false`,
and the database stops anyone saving a team with no answer at all.
