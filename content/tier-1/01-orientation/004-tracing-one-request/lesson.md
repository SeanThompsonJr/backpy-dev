---
id: 4
title: "Tracing one request end to end"
section: Orientation
sources: ["BOS 6", "BOS 7"]
concepts_introduced: [http-method, latency, sql-query, request-journey]
concepts_used: [http-method, latency, sql-query, request-journey, client, server, database, api, cache, http-request, http-response, status-code, json, ip-address, dns, tcp, tls, https, never-trust-the-client, python-dict, python-list, python-if, python-for-loop]
explain_back: "Walk one \"show my teams\" request from the browser to the database and back. For each hop, say what happens and one thing that can go wrong."
unverified_claims: []
---
## Why this matters

Most debugging is following one request and finding where it went wrong. "My teams is slow"
or "saving a team fails" usually comes down to one hop on this path. If you know the path, you
know where to look. This lesson puts lessons 1–3 together.

## The concept

### The whole journey

You click **My teams**. This whole path, from the click to the screen, is the **request
journey**:

1. **The browser builds the request:** `GET /teams`.
2. **DNS lookup:** the name becomes an IP address.
3. **TCP connection:** a reliable conversation opens.
4. **TLS handshake:** it becomes private, and the server proves who it is.
5. **HTTP request sent:** the order ticket reaches the server.
6. **The server checks the request:** is this on the menu, and who's asking? Are you logged
   in? Never trust the client: the checks that protect anything happen here.
7. **Database query:** the server asks Postgres for your teams.
8. **The server builds the response:** status `200` and the teams as JSON.
9. **The response travels back,** and the browser shows your teams.

> Restaurant: the whole visit. Look up the address, get greeted at the door, sit in the
> private booth, hand over your order, the server checks it, the kitchen cooks, the plate
> comes back.

Where the restaurant stops matching: a restaurant checks your reservation once, at the door. A
server checks who you are on every single request, because each request arrives on its own.

### Check yourself

- [Which hop comes right after the TLS handshake?](#the-whole-journey)
- [Where in the journey does the server check who you are?](#the-whole-journey)

### HTTP methods

The **HTTP method** is the part of a request that says what kind of action it is. In lesson 3's
example request, it's the first word, `GET`.

- `GET`: read something. "Show me my teams."
- `POST`: create something. "Save this new team."
- Others (`PUT`, `PATCH`, `DELETE`) change or remove things. Lesson 27 covers them.

> Restaurant: "Can I see the specials?" is a `GET`: you only want to look. "I'd like the
> pasta" is a `POST`: it creates something new, an order.

Where the restaurant stops matching: at a table you can look and order in one sentence. In
HTTP, each request has exactly one method.

### Check yourself

- [Which HTTP method reads, and which one creates?](#http-methods)

### SQL queries

A **SQL query** is a request written in SQL, the database's own language. The server writes it,
the database runs it, and rows (one per item, like one per team) come back. *Restaurant: the
server's note to the kitchen, in the kitchen's own shorthand.* This block makes a tiny version
of PokeTeam's teams table and adds three rows:

```sql run
CREATE TABLE teams (id integer, owner text, name text);
INSERT INTO teams VALUES
    (1, 'sean', 'Rain Dance'),
    (2, 'misty', 'Water Only'),
    (3, 'sean', 'Sun Room');
```

And this is the query the server sends for "show my teams":

```sql run
SELECT name FROM teams WHERE owner = 'sean';
```

Read it like a sentence: give me the `name` from `teams` where the `owner` is `sean`. You'll
write SQL yourself in the SQL section. For now, recognise it as hop 7.

Where the restaurant stops matching: a cook can make sense of a messy note. A database can't:
one typo in a query, and it fails with an error.

### Check yourself

- [Who writes the SQL query: the browser, the server, or the database?](#sql-queries)

### Latency and shortcuts

**Latency** is the time from starting a request (the click) until the response arrives. Every
hop adds some. *Restaurant: the time from walking in until the plate lands.* You'll also hear
"latency" for just the network part: the time for data to travel there and back.

Two shortcuts often make a request faster:

- The server may answer from its cache, without asking the database at all.
- Browsers keep a connection open for a while, so the next request to the same site skips
  hops 2 to 4.

### Check yourself

- [Why does a second request to the same site often skip hops 2 to 4?](#latency-and-shortcuts)

## Worked example

Here are made-up timings for one "show my teams" request, in milliseconds. Latency is the
total, and the slowest hop is where to look first:

```python run
timings = {
    "DNS lookup": 0,  # saved from an earlier visit
    "TCP connection": 20,
    "TLS handshake": 20,
    "request there and back": 20,
    "server checks": 2,
    "database query": 45,
}

print("Latency:", sum(timings.values()), "ms")

for hop, ms in timings.items():
    if ms >= 40:
        print("Look here first:", hop)
```

Network time usually changes little from one request to the next. A database query that has to
search a whole table gets slower as the table grows, so the query is often the first suspect.

## What breaks

Every hop has its own failure. When something's wrong, find the hop:

| Hop | One thing that goes wrong | What you see |
|---|---|---|
| DNS | A name that doesn't exist | An error page instead of the site |
| TCP | The server isn't running | Connection refused, or a long wait |
| TLS | The certificate expired | A full-page "not private" warning |
| Server checks | Not logged in | `401`: "who are you?" |
| Server checks | A bad order | `400` or `422` |
| Database query | You ask for team 7 (`GET /teams/7`) and there's no such row | `404` from the server |
| Database query | The query is slow | Everything works, but slowly |
| Server code | A bug crashes the handler | `500` |

An empty list is different. If you have no teams yet, `GET /teams` still answers `200` with an
empty list. Asking for one thing that doesn't exist is a `404`; a list that happens to be empty
isn't.

Ask: **What if two of these happen at once, or it's old, or it takes forever?** For a slow page,
the last part matters: if one hop is slow, everything behind it waits. A **trace**, the record
of which hops one request took and how long each one took, shows you which one. Your browser's
developer tools (F12, then the Network tab) show this for every request; exercise 2 walks you
through it.

## Check yourself

- [List the hops of one request, in order.](#the-whole-journey)
- ["My teams" takes three seconds. Which hop do you check first, and why?](#worked-example)
- [You ask for team 7, and it doesn't exist. Which status code comes back?](#what-breaks)
- [You have no teams yet. What does `GET /teams` answer?](#what-breaks)
