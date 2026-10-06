## The situation

PokeTeam's debugging guide lists the hops of one request, in order.
A new teammate sent this:

> The guide had me check things in the wrong order.
> I wasted an hour looking in the wrong place.

The guide should list every hop in the order it really happens.

## Your task

1. Press **Run** and read the guide.
2. For each hop, work out what has to happen before it.
3. Put the hops in `REQUEST_JOURNEY` in the order they really happen.
4. Keep all seven hops, spelled exactly as they are.

## Example

```python
print(REQUEST_JOURNEY[0])
# DNS lookup

print(len(REQUEST_JOURNEY))
# 7
```

## Done when

- All seven hops are still there, spelled the same.
- The connection steps are in the order they really happen.
- The server-side steps are in the order they really happen.
