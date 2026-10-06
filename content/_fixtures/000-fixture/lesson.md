---
id: 0
title: "Fixture: default values in Python and in Postgres"
section: Fixtures
sources: []
concepts_introduced: [default-argument, mutable-default-argument, column-default]
concepts_used: [default-argument, mutable-default-argument, column-default]
explain_back: "A Python default argument and a Postgres column default both fill in a value nobody gave. What's the difference in when each one is created? Answer without code."
unverified_claims:
  - quote: "Postgres evaluates a column default for every inserted row"
    check: "PostgreSQL documentation, CREATE TABLE, the DEFAULT clause: confirm the default expression is evaluated each time a row is inserted without a value for that column."
---
## Why this matters

PokeTeam fills in values nobody typed. A new team starts with an empty roster, and a new
row in the database gets its own id and starts private. Those defaults live in two places,
Python and Postgres, and they don't behave the same way. Get it wrong and two users share
one roster. Nothing crashes. The data is just wrong, and in a backend that means one user
sees another user's data.

This lesson is the **fixture**: a complete example lesson used to build and test the site.
It uses every feature in LESSON_FORMAT.md once.

## The concept

### Python defaults

A **default argument** is the value a parameter gets when the caller leaves it out.
Python creates the default **once, when `def` runs**, not each time the function is called.
For numbers and strings that never matters, because they can't change. For a list or a dict
it matters a lot: every call that relies on the default gets the *same* object.

```python run
def log_battle(event, log=[]):
    log.append(event)
    return log

print(log_battle("pikachu used thunderbolt"))
print(log_battle("onix fainted"))
```

The second call printed both events. The default list was created once and kept growing.

### Check yourself

- [When does Python create the value of a default argument?](#python-defaults)

### Postgres column defaults

A **column default** is the value Postgres stores when an `INSERT` leaves a column out.
Postgres evaluates a column default for every inserted row, so a default like
`gen_random_uuid()` gives each new team its own id:

```sql run
CREATE TABLE teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL
);
INSERT INTO teams (name) VALUES ('Rain Dance'), ('Sun Room');
```

```sql run
SELECT count(DISTINCT id) AS different_ids FROM teams;
```

Two rows, two different ids. Same idea as a Python default, opposite timing.

## Worked example

The Python fix is to use `None` as a marker meaning "the caller didn't pass one", then
build a fresh object inside the function body, which runs on every call.

```python run
def log_battle(event, log=None):
    if log is None:
        log = []
    log.append(event)
    return log

print(log_battle("pikachu used thunderbolt"))
print(log_battle("onix fainted"))
```

Each call now prints a log with one event in it.

## What breaks

A default only helps if it's the right *kind* of value. Here the default is a number, but
the function treats it like a list of levels:

```python broken TypeError
def total_level(levels=0):
    return sum(levels)

total_level()
```

`sum()` needs something it can loop over, and `0` isn't one, so Python raises `TypeError`.

Five-questions check: *If this fails halfway, what state is left behind?* With a shared
default list, every failed or half-finished call can leave items in the list for the next caller.

## Check yourself

- [When is a Postgres column default evaluated, compared with a Python default?](#postgres-column-defaults)
- [Which kinds of Python default values are safe, and which aren't?](#python-defaults)
- [Why is `None` a good marker for "not passed"?](#worked-example)
