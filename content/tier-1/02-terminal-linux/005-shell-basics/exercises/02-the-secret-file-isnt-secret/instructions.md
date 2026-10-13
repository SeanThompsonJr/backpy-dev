## The situation

PokeTeam's security check reports which files are private. A
teammate sent this:

> The check says .env is private, but I'm not its owner and I could
> still read the database password in it.

Only the owner should be able to use a private file.

## Your task

1. Press **Run** and read what `is_private` says for each mode.
2. Work out why a file other people can read still counts as private.
3. Fix `is_private` so a file is private only when nobody but the
   owner can read, change or run it.

## Example

```python
print(is_private("-rw-------"))
# True

print(is_private("-rw-rw-rw-"))
# False
```

## Done when

- A file only the owner can use is private.
- A file anyone besides the owner can read, change or run isn't private.
