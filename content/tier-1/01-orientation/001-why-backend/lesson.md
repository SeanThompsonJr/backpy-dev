---
id: 1
title: "Why backend, and what backend engineers actually do"
section: Orientation
sources: ["BOS 0", "BOS 1"]
concepts_introduced: [backend, frontend, never-trust-the-client]
concepts_used: [backend, frontend, never-trust-the-client, python-function, python-list, python-if, python-dict, python-for-loop, python-f-string]
explain_back: "Why does the backend have to check every request, even when the page already checked it?"
unverified_claims: []
---
## Why this matters

Every app has two halves. One is what you see and tap. The other does the work you never see:
it stores your data, checks who you are, and answers every click. That hidden half is the
**backend**, and it's the job you're training for.

A junior backend job expects you to build APIs, write SQL (the language for asking a database
for data), test your code, work in Git with a team, and ship to a real server. Don't worry about
these names yet: each one gets its own lessons. backpy follows that route in four tiers:

1. **Foundations:** the terminal, Git, Python and SQL.
2. **Core backend:** HTTP, FastAPI, testing, data, and logins.
3. **Production:** Docker, deploying, security, speed, and monitoring.
4. **Professional:** real codebases, system design, interviews, and getting hired.

PokeTeam, the app you build along the way, is your proof that you can do the job.

## The concept

### Frontend and backend

Picture a restaurant.

- The **frontend** is the dining room: the tables, the decor, everything the customer sees.
  In an app, it's the pages and buttons. It runs on the user's own device, in their browser
  or phone.
- The **backend** is the staff: the server (the waiter) who takes and checks your order, and
  the kitchen behind the swinging doors. In an app, it's code running on computers the company
  controls. It takes requests, checks them, stores and fetches data, and sends back answers.

Where the restaurant stops matching: a real backend serves thousands of customers at the same
moment.

### What backend engineers do

Most weeks, a backend engineer:

1. **Builds APIs:** decides what the frontend can ask for, and how (lesson 3).
2. **Stores and fetches data** in a database, an organized store of data that survives
   restarts.
3. **Keeps it safe:** checks who's asking, and refuses what they're not allowed to do.
4. **Keeps it fast and up,** even when many people use the app at once.
5. **Finds and fixes bugs:** reads the logs (the notes a server writes as it works), follows a
   request, changes the code, and proves the fix.

### Check yourself

- [Which half of an app runs on the user's device?](#frontend-and-backend)
- [Name three things a backend engineer does in a normal week.](#what-backend-engineers-do)

### Never trust the client

The **client** is whatever sends the request. For your users, that's the browser or app on
their own device, and they control it. They can change or skip anything that runs there.

So one rule sits under all backend work: **never trust the client.** A customer can ask for
anything. The server still checks the order before the kitchen cooks.

## Worked example

PokeTeam's "New team" form only lets you pick six Pokémon. That's helpful, but it isn't the
real check. A request can reach the backend without going through the form, so the backend
checks again:

```python run
MAX_TEAM_SIZE = 6

def save_team(name, members):
    if len(members) > MAX_TEAM_SIZE:
        return "Rejected: a team has at most 6 Pokémon."
    return f"Saved {name} with {len(members)} Pokémon."

print(save_team("Rain Dance", ["pelipper", "barraskewda"]))
print(save_team("Too Many", ["pikachu"] * 7))
```

The form's check gives the user quick feedback. The backend's check is the one that protects
the data.

## What breaks

The classic mistake is a backend that trusts the page to have checked already:

```python run
def save_team_trusting(name, members):
    # "The form already limits teams to six, so no check here."
    return f"Saved {name} with {len(members)} Pokémon."

print(save_team_trusting("Cheater", ["mewtwo"] * 50))
```

Nothing crashed, and that's the danger. The bad data is saved quietly, and every page that
shows this team now shows 50 Mewtwo.

Every time something arrives from a client, ask: **Who can send this, and what's the worst
thing they could send?** The same mistake comes in other forms:

- Trusting a price or a discount the page sends back.
- Putting a secret key (a password your app uses to call a paid service) in frontend code,
  where anyone can read it.

## Check yourself

- [For your users, what is the client, and who controls it?](#never-trust-the-client)
- [What does `save_team_trusting` get wrong, and what does it cost?](#what-breaks)
- [Name two other forms of the same mistake.](#what-breaks)
