## The situation

PokeTeam is adding public teams that anyone can browse.
The rule: **every team is private unless its owner makes it public.**
That includes the teams that already exist.

## Your task

1. Change the `ALTER TABLE` line so `is_public` is `false` whenever nobody gives a value.
2. Leave the `INSERT` and the `SELECT` as they are.

## Example

The `SELECT` at the end should return:

| id | name       | is_public |
|----|------------|-----------|
| 1  | Rain Dance | false     |
| 2  | Sun Room   | false     |
| 3  | Trick Room | false     |

## Done when

- The result has the columns `id`, `name` and `is_public`.
- All three teams are listed.
- Every team's `is_public` is `false`.
