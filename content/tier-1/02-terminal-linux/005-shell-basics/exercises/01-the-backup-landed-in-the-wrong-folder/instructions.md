## The situation

PokeTeam's backup script saves to whatever folder you give it. A
teammate sent this:

> I told it to save to /var/backups. The backups ended up in
> /home/sean/poketeam/var/backups instead.

The script should save exactly where it's told.

## Your task

1. Press **Run** and compare the two paths `full_path` prints.
2. Work out which kind of path it gets wrong.
3. Fix `full_path` so every kind of path points where it should.

## Example

```python
print(full_path("/home/sean/poketeam", "app"))
# /home/sean/poketeam/app

print(full_path("/home/sean/poketeam", ".."))
# /home/sean

print(full_path("/home/sean/poketeam", "./tests"))
# /home/sean/poketeam/tests
```

## Done when

- A relative path starts from the working directory.
- `..` goes up one folder.
- `.` stays in the same folder.
- An absolute path means the same place from anywhere.
