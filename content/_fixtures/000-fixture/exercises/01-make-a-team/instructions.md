## The situation

PokeTeam's **New team** button only asks for a name. Your code fills in the rest.
The team list also needs a one-line summary of each team.

## Your task

1. Give `make_team` two more parameters: `members` and `public`. Both are optional.
2. Return a dict with the keys `"name"`, `"members"` and `"public"`.
3. Write `describe_team(team)` so it prints one summary line.
   The line says `private` when `public` is `False`, and `public` when it's `True`.

## Example

```python
rain = make_team("Rain Dance")
print(rain)
# {'name': 'Rain Dance', 'members': [], 'public': False}

volt = make_team("Volt Turn", ["rotom"], True)
print(volt)
# {'name': 'Volt Turn', 'members': ['rotom'], 'public': True}

describe_team({"name": "Rain Dance", "members": ["pelipper", "barraskewda"], "public": False})
# Rain Dance (private): 2 members

describe_team({"name": "Volt Turn", "members": ["rotom", "magnezone"], "public": True})
# Volt Turn (public): 2 members
```

## Done when

- Two new teams never share the same members list.
- Members you pass in end up on the team.
- A team is private unless you say otherwise.
- A private team's summary line matches the example exactly.
- A public team's summary line matches the example exactly.
