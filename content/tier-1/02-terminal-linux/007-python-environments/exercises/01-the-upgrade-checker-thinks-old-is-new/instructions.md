## The situation

PokeTeam's dashboard tells you when a package has a newer version. A
teammate sent this:

> We're on pydantic 2.10.0, and the dashboard keeps telling us to
> "upgrade" to 2.9.3.

The dashboard should only call a version newer when it really is.

## Your task

1. Press **Run** and read the two answers `is_newer` gives.
2. Work out how it's comparing the versions.
3. Fix `is_newer` so it compares versions the way semantic
   versioning reads them.

## Example

```python
print(is_newer("2.1.0", "2.0.0"))
# True

print(is_newer("1.4.2", "1.4.2"))
# False
```

## Done when

- A higher minor version is newer, even when it has more digits.
- An older version isn't newer.
- A higher major version is newer, whatever comes after it.
- The same version isn't newer.
