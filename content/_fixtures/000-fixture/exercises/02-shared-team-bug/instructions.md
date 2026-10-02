## The situation

A PokeTeam user sent this bug report:

> I made a brand-new team, and Pikachu was already on it. I never added Pikachu!

A new team should always start empty.

## Your task

1. Below `add_member`, call it twice without a team, print both results, and press **Run**.
2. Work out why the second team isn't empty.
3. Fix `add_member` so every new team starts empty.
4. Check that adding to an existing team still works.

## Example

```python
print(add_member("pikachu"))
# ['pikachu']

print(add_member("eevee"))
# should be ['eevee'], a brand-new team

print(add_member("lapras", ["snorlax"]))
# ['snorlax', 'lapras']
```

## Done when

- Each new team starts empty.
- Passing in an existing team still adds to that team.
