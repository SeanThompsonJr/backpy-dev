## The situation

A PokeTeam player sent this report:

> I typed "pikachuu" into the Pokémon page by mistake and got a
> blank page. No error, no message, nothing.

A Pokémon that doesn't exist should get a clear "not found" answer.

## Your task

1. Press **Run** and compare the two answers `get_pokemon` gives.
2. Fix `get_pokemon` so a missing name gets the status code that
   means "not found".
3. Make that answer's body a dict whose `"error"` names the missing
   Pokémon.
4. Keep Pokémon that exist coming back with `200` and their data.

## Example

```python
print(get_pokemon("eevee"))
# (200, {'name': 'eevee', 'type': 'normal'})

print(get_pokemon("pikachuu"))
# should be (?, {'error': 'pikachuu not found'})
# where ? is the status code for "not found"
```

## Done when

- A Pokémon that exists comes back with `200` and its data.
- A missing Pokémon gets the status code that means "not found".
- The "not found" body's `"error"` names the missing Pokémon.
