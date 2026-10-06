## The situation

A new PokeTeam player sent this report:

> The login link in my welcome email opened an http:// page.
> My browser said "Not secure" next to the address.

PokeTeam should never send a login link that isn't private.

## Your task

1. Press **Run** and read what PokeTeam decides for `LOGIN_LINK`.
2. Find out why `is_secure` accepts that link.
3. Fix `is_secure` so only `https://` addresses count as secure.

## Example

```python
print(is_secure("https://poketeam.example/login"))
# True

print(is_secure("http://poketeam.example/login"))
# should be False

print(is_secure("ftp://poketeam.example/files"))
# False
```

## Done when

- An `https://` address counts as secure.
- An `http://` address doesn't.
- An `ftp://` address doesn't.
