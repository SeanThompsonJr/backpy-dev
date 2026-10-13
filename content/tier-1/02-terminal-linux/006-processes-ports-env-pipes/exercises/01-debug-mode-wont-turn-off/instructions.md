## The situation

PokeTeam reads its settings from environment variables when it
starts. A teammate sent this:

> We set DEBUG=false on the live server, but players still see full
> error pages. And the port shows up in the logs in quotes.

DEBUG and PORT should mean what they say.

## Your task

1. Press **Run** and read the settings `load_settings` builds.
2. Work out why both values come out wrong.
3. Fix `load_settings` so `debug` is off when DEBUG says false and
   on when it says true, and `port` is a number.

## Example

```python
print(load_settings({}))
# {'debug': False, 'port': 8000}

print(load_settings({"DEBUG": "true"}))
# {'debug': True, 'port': 8000}
```

## Done when

- `DEBUG=false` turns debug mode off.
- `DEBUG=true` turns debug mode on.
- The port is a number when `PORT` is set.
- With nothing set, debug is off and the port is 8000.
