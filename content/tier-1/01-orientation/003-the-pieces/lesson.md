---
id: 3
title: "The pieces: servers, databases, and APIs"
section: Orientation
sources: ["BOS 3", "BOS 4", "BOS 5"]
concepts_introduced: [client, server, database, api, cache, http-request, http-response, status-code, json]
concepts_used: [client, server, database, api, cache, http-request, http-response, status-code, json, backend, never-trust-the-client, python-function, python-dict, python-tuple, python-if, python-f-string]
explain_back: "Why does the browser ask PokeTeam's server for a team, instead of reading it straight from the database?"
unverified_claims: []
---
## Why this matters

Every backend you'll work on has the same pieces: clients, a server, and a database, talking
through an API. Most tasks on the job are "change what one of these pieces does". This lesson
names each piece and what passes between them.

## The concept

### The pieces

- **Client:** anything that sends a request: a browser, a phone app, a script, or another
  server. *Restaurant: the customer.*
- **Server:** a program that waits for requests and answers each one. It checks the order,
  gets what it needs, and sends back an answer. The computer it runs on is also called a
  server. *Restaurant: the server, the one who takes your order.*
- **Database:** where data is stored so it survives restarts and can be searched. Only the
  server talks to it. *Restaurant: the kitchen. Customers never walk in.*
- **API:** the list of requests a server accepts, and how to make them. On a web API, each
  item is a method and a path (both explained below), like `GET /pokemon/pikachu`.
  *Restaurant: the menu.*

In PokeTeam, the client is the browser, the server is the FastAPI app you'll write (FastAPI is
a Python library for building servers), and the database is Postgres (a popular database).

Why can't the client talk to the database directly?

1. **Never trust the client.** The server checks every order before the kitchen sees it.
2. **The database needs a password,** and anything on the user's device can be read.

Where the restaurant stops matching: a real server often gets things from several places at
once. Besides the database, it may use a **cache**, saved copies of recent answers it can hand
out without asking the database (like food made ahead and kept warm under a heat lamp). It may
also call other APIs: when PokeTeam's server asks PokeAPI for Pokémon data, PokeTeam's server
is the client.

### Check yourself

- [In PokeTeam, which piece is the client, the server, and the database?](#the-pieces)
- [What does an API list?](#the-pieces)

### Requests and responses

An **HTTP request** is the order ticket. It has:

1. a **method**, the kind of action. `GET` means "read" (lesson 4 has more).
2. a **path**, what it's about.
3. **headers**, extra details like which format it wants back (lesson 27).
4. sometimes a **body**, the data being sent, like a new team.

```text
GET /api/v2/pokemon/pikachu HTTP/1.1
Host: pokeapi.co
```

An **HTTP response** is the plate: a status code, headers, and usually a body. Here's a trimmed
one (the real body has many more fields):

```text
HTTP/1.1 200 OK
Content-Type: application/json

{"name": "pikachu", "base_experience": 112}
```

`HTTP/1.1` is the version of HTTP. Newer versions send the same parts in a more compact form,
so your browser's tools may show `h2` or `h3` instead.

That body is **JSON**: text that any language can read and write, so a browser and a Python
server understand each other. *Restaurant: a standard order form any restaurant can read.*
Unlike a paper form, though, it's just a string until you parse it, even though it looks like a
Python dict.

### Check yourself

- [What are the four parts of an HTTP request?](#requests-and-responses)

### Status codes

A **status code** is a three-digit number that says how it went, before anyone reads the body:

- `200`: here you go. `201`: created.
- `400` or `422`: the order was filled in wrong. FastAPI uses `422` when data fails its checks.
- `404`: we're out of that. The one thing you asked for doesn't exist.
- `500`: something went wrong on the restaurant's side. The server broke, not the order.

The first digit is the rule of thumb: `2xx` went well, `4xx` is the client's mistake, `5xx` is
the server's. Lesson 27 covers the rest.

Where the restaurant stops matching: "we're out of that" sounds like "try again tomorrow". A
`404` doesn't mean that: there's nothing at that path.

### Check yourself

- [Which status code means the thing you asked for doesn't exist, and which means the server broke?](#status-codes)

## Worked example

A handler is the server code for one item on the menu. This one handles "create a team". It
returns two things: the status code and the body.

```python run
def create_team(body):
    members = body["members"]
    if len(members) > 6:
        return 422, {"error": "A team has at most 6 members."}
    return 201, {"name": body["name"], "members": members}

small = {"name": "Rain Dance", "members": ["pelipper", "barraskewda"]}
huge = {"name": "Too Many", "members": ["pikachu"] * 7}

print(create_team(small))
print(create_team(huge))
```

The client reads the status first: `201` means the team was created, `422` means "fix your
order". Then it reads the body for the details.

JSON arrives as text. Python's `json` module turns it into a dict you can use:

```python run
import json

body = '{"name": "pikachu", "base_experience": 112}'
pokemon = json.loads(body)
print(pokemon["name"], pokemon["base_experience"])
```

## What breaks

**The wrong status code.** A handler that answers `200` when the thing asked for doesn't exist
tells the client everything went fine. The client shows an empty page, and nobody knows why.
The status code is the first thing a client checks, so it has to be true.

**Treating JSON text as a dict.** Until it's parsed, JSON is only a string:

```python broken TypeError
body = '{"name": "pikachu"}'
print(body["name"])
```

You can't look up `"name"` in a string, so Python raises `TypeError`. Parse it with
`json.loads` first.

**Saying too much.** Ask of every error: **What does my response or error reveal?** A `500`
that sends back the full error text can show your file names, your code, and sometimes secrets.
Say what went wrong in plain words. Keep the details in your server's **logs**, the notes it
writes about each request, which only your team can read.

## Check yourself

- [Name the four pieces, and what each one does.](#the-pieces)
- [What's the difference between JSON text and a Python dict?](#requests-and-responses)
- [Why is answering `200` wrong when the Pokémon asked for doesn't exist?](#what-breaks)
- [What should a `500` tell the client, and what should it keep to itself?](#what-breaks)
