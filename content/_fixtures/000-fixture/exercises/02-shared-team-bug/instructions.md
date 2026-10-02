A bug report came in from a PokeTeam user:

> I made a brand-new team and it already had Pikachu in it. I never added Pikachu.
> That's someone else's Pokémon!

`add_member(name, team)` adds a Pokémon to a team and returns the team. When no team is
passed in, it's supposed to start a brand-new, empty one.

Find out why new teams don't start empty, and fix it. Passing in an existing team must still
add to that team.
