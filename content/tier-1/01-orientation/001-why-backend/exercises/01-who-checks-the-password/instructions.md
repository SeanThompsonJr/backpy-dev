## The situation

A security tester sent PokeTeam two findings:

> 1. I edited the login page in my browser and got into another
>    player's account without their password.
> 2. I deleted another player's team by sending the request
>    myself. The Delete button was hidden, but that didn't stop me.

Neither of these should be possible.

## Your task

1. Press **Run** and read where each job runs.
2. For each job, decide which side it belongs on.
3. Fix `JOBS` so neither finding can happen again.

## Example

`where_it_runs` gives back one of two answers:

```python
print(where_it_runs("show a loading spinner"))
# frontend

print(where_it_runs("save a team"))
# backend
```

## Done when

- Every job that protects an account or stores a player's data runs on the backend.
- Every job that only changes what the player sees stays on the frontend.
