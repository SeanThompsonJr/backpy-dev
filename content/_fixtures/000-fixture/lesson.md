---
id: 0
title: "Fixture: default arguments that remember too much"
section: Fixtures
sources: []
concepts_introduced: [default-argument, mutable-default-argument]
concepts_used: [default-argument, mutable-default-argument]
explain_back: "Why does a function with a list as its default value seem to remember earlier calls? Answer without code."
unverified_claims:
  - "This fixture claim exists so the site has a 'verify this' note to render."
---
## Why this matters

PokeTeam builds teams one Pokémon at a time. If the function that starts a new team quietly
reuses the last team's list, two users end up sharing a roster. Nothing crashes. The data is
just wrong, and in a backend that means one user sees another user's data.

This lesson is the **fixture**: a complete example lesson used to build and test the site.
It uses every feature in LESSON_FORMAT.md once.

## The concept

A **default argument** is the value a parameter gets when the caller leaves it out.
Python evaluates the default **once, when `def` runs**, not each time the function is called.
For numbers and strings that never matters, because they can't change. For a list or a dict
it matters a lot: every call that relies on the default gets the *same* object.

If you know Java: there's no equivalent, because Java has no default arguments at all. The
closest mental model is a `static` field that every call shares.

```python run
def log_battle(event, log=[]):
    log.append(event)
    return log

print(log_battle("pikachu used thunderbolt"))
print(log_battle("onix fainted"))
```

The second call printed both events. The default list was created once and kept growing.

## Worked example

The fix is to use `None` as a marker meaning "the caller didn't pass one", then build a
fresh object inside the function, where it runs on every call.

```python run
def log_battle(event, log=None):
    if log is None:
        log = []
    log.append(event)
    return log

print(log_battle("pikachu used thunderbolt"))
print(log_battle("onix fainted"))
```

Lessons can run SQL too. SQL blocks share one database per lesson, so this block creates a
table and the next one queries it:

```sql run
CREATE TABLE picks (team text NOT NULL, pokemon text NOT NULL);
INSERT INTO picks VALUES ('Rain', 'pelipper'), ('Rain', 'barraskewda'), ('Sun', 'torkoal');
```

```sql run
SELECT team, count(*) AS members FROM picks GROUP BY team ORDER BY team;
```

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

- When is a default value created?
- Which kinds of default values are safe, and which aren't?
- Why is `None` a good marker for "not passed"?
