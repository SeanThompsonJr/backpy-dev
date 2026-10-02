PokeTeam's "New team" button only asks for a name. Everything else has to be filled in for
the user, and the team list page needs a one-line summary of each team.

Write two functions:

- `make_team(name, ...)` returns a dict with `"name"`, `"members"` and `"public"`.
  Callers can pass a list of members and whether the team is public, but they don't have to.
  A team made without members starts with an empty list of its own, and a team starts
  private unless the caller says otherwise.
- `describe_team(team)` prints one line, like `Rain Dance (private): 2 members`.

Done when two teams made without members never share a roster, members passed in end up on
the team, and the summary line matches the example exactly.
