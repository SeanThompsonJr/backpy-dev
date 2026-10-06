# Brief: 01 Orientation (lessons 1–4)

**Checkpoint (curriculum.json):** Draw the path of one PokeTeam request from the browser to
Postgres and back, and explain each hop out loud.

**What this section is for:** the big picture before any deep dive. Sean leaves able to say what
backend engineers do, how a request crosses the internet, what the main pieces are, and how one
PokeTeam request travels from browser to database and back. The **restaurant** from
TEACHING_STYLE.md is introduced here and every later section builds on it.

**Inputs used:** TEACHING_STYLE.md, LESSON_FORMAT.md, curriculum.json, concepts.json (empty),
conventions.json. No previous SUMMARY.md (first section). No reference/ material for this
section, so coverage is checked against the curriculum titles only.

**Left for later sections (mentioned, not taught):** shell commands (05–07), Python itself
(12–20), JSON in depth and httpx (19), SQL (21–26), HTTP methods, headers and status codes in
depth (27), FastAPI (32+).

---

## Lesson 1: Why backend, and what backend engineers actually do

**Objectives:** Sean can
1. Say what the backend is and how it differs from the frontend, using the restaurant.
2. Name the main jobs a backend engineer does: build APIs, store data, keep it safe, keep it
   fast and up, find and fix bugs.
3. Explain "never trust the client", and why checks like passwords belong on the backend.
4. Say what a junior backend job expects, and how backpy's route and PokeTeam map to it.

**Concepts introduced:** `backend`, `frontend`, `never-trust-the-client`
**Concepts used:** the above only.

**Analogies:** frontend = the dining room; backend = the kitchen and the staff behind the
swinging doors. Never trust the client = a customer can write anything on an order slip, so the
server checks it against the menu before the kitchen cooks. *Where it breaks:* a real backend
serves thousands of "customers" at the same time.

**Exercise:** bug hunt, **"Who checks the password?"** A dict maps PokeTeam jobs to `"frontend"`
or `"backend"`. A user reports they could log in without the right password: the planted bug
sends the password check to the frontend. 3 tests: password check is backend; saving a team is
backend; laying out the team page is frontend.

---

## Lesson 2: How the internet works: DNS, TCP/IP, TLS, the request journey

**Objectives:** Sean can
1. Explain an IP address and what DNS does when he types `pokeapi.co`.
2. Explain what TCP adds (a reliable, ordered conversation) and the three-step handshake.
3. Explain what TLS adds (privacy and proof of identity) and what HTTPS means.
4. List the journey in order: DNS lookup → TCP connection → TLS handshake → HTTP request →
   response. Note that many sites can also use HTTP/3, which runs over QUIC instead of TCP:
   same idea, different road.

**Concepts introduced:** `ip-address`, `dns`, `tcp`, `tls`, `https`
**Concepts used:** the above, plus `backend` (lesson 1).

**Analogies:** IP address = the restaurant's street address; DNS = looking the restaurant up by
name to get its address; TCP handshake = greeting at the door ("Table for one?" / "Yes" /
"Follow me") before any order is taken; TLS = a private booth plus the licence on the wall
proving it's the real restaurant. *Where it breaks:* DNS answers are cached, so most visits
skip the lookup; network messages can arrive out of order and get re-sent, which TCP hides.

**Exercises:**
1. Bug hunt, **"The login page isn't private."** `is_secure(url)` should only accept
   `https://` addresses; the planted bug accepts anything starting with `http`. 3 tests:
   an `https://` URL is secure; an `http://` URL is not; an `ftp://` URL is not.
2. Local, **"Look up a real address."** Run `nslookup pokeapi.co` (one command, typed into the
   Windows Terminal; the steps are spelled out), then open `https://pokeapi.co` and read who
   issued its certificate. Checklist: saw an IP address; saw the certificate issuer; can say
   what DNS and TLS each did in one sentence.

---

## Lesson 3: The pieces: servers, databases, and APIs

**Objectives:** Sean can
1. Name the client, server and database, and what each one is responsible for.
2. Explain an API as the menu: the requests you're allowed to make and how to make them.
3. Read a request and a response, and explain a status code: 200 found, 404 missing,
   400/422 bad order, 500 kitchen problem. (In depth in lesson 27.)
4. Explain why the client never talks to the database directly.

**Concepts introduced:** `client`, `server`, `database`, `api`, `http-request`,
`http-response`, `status-code`, `json`
**Concepts used:** the above, plus `backend`, `never-trust-the-client`.

**Analogies:** the full restaurant table from TEACHING_STYLE.md: customer = client, server =
server, kitchen = database, menu = API, order ticket = request, plate = response, "we're out of
that" = 404. JSON = a standard order form any kitchen can read. *Where it breaks:* one real
server can talk to several "kitchens" (databases, caches, other APIs).

**Exercise:** bug hunt, **"We're out of that."** `get_pokemon(name)` looks a Pokémon up in a dict
standing in for the database and returns `(status, body)`. A user reports that searching for a
typo shows an empty page with no error: the planted bug returns `200` and `None` for a missing
name. 3 tests: a found Pokémon returns `200` and its data; a missing one returns `404`; the
404 body says which name wasn't found.

---

## Lesson 4: Tracing one request end to end

**Objectives:** Sean can
1. Follow one PokeTeam request, "show my teams", through every hop: browser, DNS, TCP, TLS, HTTP
   request, server, database query, response, browser.
2. Say what the HTTP method is (`GET` to read, `POST` to create) and where the time goes
   (latency).
3. See a real request in the browser's developer tools: method, URL, status, time, body.
4. Recognise the SQL query the server sends to the database (read, not write; SQL is taught in
   section 05).

**Concepts introduced:** `http-method`, `latency`, `sql-query`, `request-journey`
**Concepts used:** everything from lessons 1–3.

**Analogies:** the whole visit, start to finish: look up the address, get seated, private
booth, order, the ticket goes to the kitchen, the plate comes back. Latency = how long from
ordering to the plate landing. A SQL query = the ticket the server writes in the kitchen's own
language. *Where it breaks:* a server may answer from a cache without asking the kitchen at all.

**Exercises:**
1. Bug hunt, **"The trace is out of order."** `REQUEST_JOURNEY` lists the hops of one request,
   but a teammate's trace has the TLS handshake before the TCP connection and the database
   query before the server checks the request. 4 tests: DNS comes first; TCP comes before
   TLS; the server checks the request before the database is queried; the response comes last.
2. Local, **"Watch a real request."** Open `https://pokeapi.co/api/v2/pokemon/pikachu` with the
   browser's developer tools open (Network tab). Checklist: found the request; read its method
   and status code; read how long it took; found Pikachu's `base_experience` in the response.

**One `sql run` block** shows the query the server sends for "show my teams" (a tiny `teams`
table and one `SELECT`). Read only: here SQL is genuinely part of the journey, and the SQL
section teaches it properly.

---

## Quizzes
Each lesson has 4–5 questions, one at a time, with an explanation for every option. Every lesson
with code has at least one "Predict the output" question, e.g. what `is_secure("http://...")`
returns, or which status code a missing Pokémon gets.

## Checkpoint checklist (checkpoint.md)
- [ ] Your drawing starts at the browser and ends back at the browser.
- [ ] It shows each hop: DNS lookup, TCP connection, TLS handshake, HTTP request, the server, the
      database query, the response.
- [ ] Each hop has one sentence: what happens there, and one thing that can go wrong.
- [ ] You can explain it out loud in under two minutes using the restaurant: customer, server,
      kitchen.
- [ ] You can say which status code the browser gets when the team doesn't exist, and why.

---

## Gap that needs your decision: Python basics
The three bug hunts use basic Python: functions, `return`, dicts and `in`, lists, tuples,
`str.startswith`, and `if`. backpy formally teaches these in lessons 12–13, so the validator
would flag them as "used before they're taught".

- **Option A (recommended):** add a few **prerequisite** concepts to concepts.json, marked
  `introduced_in: 0`, meaning "Sean already knows this; lesson 12 reviews it":
  `python-function`, `python-dict`, `python-list`, `python-tuple`, `python-if`,
  `python-string-methods`. The bug hunts can then use them honestly, and you get hands-on
  practice from lesson 1.
- **Option B:** keep Orientation code-free: quizzes and the two local exercises only. That's
  less hands-on, and it would drop the bug hunts.
