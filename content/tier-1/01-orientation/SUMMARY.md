# Summary: 01 Orientation (lessons 1–4)

What this section actually taught, for the sections that come after it. concepts.json holds
each concept's definition and analogy. This file records the terms, conventions and pictures
later lessons should know about.

## Lessons

| # | Lesson | Exercises |
|---|---|---|
| 1 | Why backend, and what backend engineers actually do | Bug hunt "Who checks the password?" (2 tests) |
| 2 | How the internet works: DNS, TCP/IP, TLS, the request journey | Bug hunt "The login page isn't private" (3 tests); local "Look up a real address" |
| 3 | The pieces: servers, databases, and APIs | Bug hunt "We're out of that" (3 tests) |
| 4 | Tracing one request end to end | Bug hunt "The debugging guide is out of order" (3 tests); local "Watch a real request" |

Checkpoint: draw "show my teams" from the browser to Postgres and back, and explain each hop
out loud in your own words (checkpoint.md).

Every lesson has subheadings in The concept, a short `### Check yourself` after each main idea,
and a final Check yourself. Every question links to the heading its answer is under.

## Concepts introduced

- Lesson 1: `backend`, `frontend`, `never-trust-the-client`
- Lesson 2: `ip-address`, `dns`, `tcp`, `tls`, `https`
- Lesson 3: `client`, `server`, `database`, `api`, `cache`, `http-request`, `http-response`,
  `status-code`, `json`
- Lesson 4: `http-method`, `latency`, `sql-query`, `request-journey`

Prerequisites in concepts.json (`introduced_in: 0`, "lesson 12 reviews it"): `python-function`
(lesson 13), `python-dict`, `python-list`, `python-tuple`, `python-if`, `python-string-methods`,
`python-for-loop`, `python-f-string`.

## Analogies used

Orientation pictures the request–response cycle as a restaurant. That picture came from Sean as
an example. Later sections pick the best everyday situation for each concept, and can reuse the
restaurant only where it genuinely fits. Analogies are for thinking: no explain-back, checkpoint
or quiz requires one.

What each picture meant here (concepts.json has the exact wording):

| Picture | Concept |
|---|---|
| Customer | Client (whatever sends the request) |
| Dining room | Frontend |
| The staff: the server (waiter) and the kitchen | Backend |
| Kitchen | Database |
| Menu | API |
| Order ticket | HTTP request |
| The plate | HTTP response |
| A standard order form | JSON |
| "We're out of that" / "filled in wrong" / "went wrong on the restaurant's side" | 404 / 400 or 422 / 500 |
| Looking up a street address by name | DNS |
| Greeting at the door (You / Staff) | TCP handshake |
| Private booth + licence on the wall | TLS; ordering from that booth = HTTPS |
| "Can I see the specials?" / "I'd like the pasta" | GET / POST |
| The server's note to the kitchen, in its own shorthand | SQL query |
| Food kept warm under a heat lamp | Cache |
| From walking in until the plate lands | Latency |
| Phone's contacts | Python dict (used in lesson 2 to play a tiny DNS) |

Where these stop working, as already stated in the lessons:
- A backend serves thousands of customers at once.
- A big site can have several addresses.
- Real networks lose packets, and TCP re-sends them.
- A certificate can be copied, but only the real server has its private key.
- A `404` isn't "try later".
- Each request has exactly one method.
- A SQL typo fails the query.
- A server checks who you are on every request, not once at the door.

## Terms and conventions used

**The request journey** has 9 hops:
1. The browser builds the request.
2. DNS lookup.
3. TCP connection.
4. TLS handshake.
5. HTTP request sent.
6. The server checks the request.
7. Database query.
8. The server builds the response.
9. The response travels back.

The bug hunt uses these hop names: "DNS lookup", "TCP connection", "TLS handshake", "HTTP
request", "server checks the request", "database query", "response".

**Status codes**
- Taught: 200, 201, 400, 401 (in lesson 4's table), 404, 422 ("FastAPI uses 422 when data fails
  its checks") and 500, plus the classes 2xx, 4xx and 5xx.
- `404` means the one thing asked for doesn't exist. An empty list is `200` with `[]`.

**HTTP requests and responses**
- HTTP is "the set of rules a browser and a server use to ask for something and answer it".
- A request has a method, a path, headers (lesson 27) and sometimes a body.
- A response has a status code, headers and usually a body.
- HTTP methods: GET reads and POST creates. PUT, PATCH and DELETE are only named; lesson 27
  teaches them.
- JSON is text until it's parsed. `json.loads` was shown once; JSON in depth is lesson 19.

**Exercises**
- Handlers return `(status, body)` tuples, where the body is a dict. Errors use
  `{"error": "..."}`, e.g. `{"error": "pikachuu not found"}`.
- An exercise's Example shows the output format with inputs the task isn't about, and Done when
  states behaviour, not answers.

**Examples and SQL**
- Example addresses use only the reserved ranges `203.0.113.x` and `2001:db8::x`. Example
  domains use `.example` (`poketeam.example`).
- SQL appeared once, read-only: lesson 4's `teams (id, owner, name)` table and
  `SELECT name FROM teams WHERE owner = 'sean';`.

**Writing**
- The Five Questions are quoted word for word (Q2 in lessons 1 and 2, Q4 in lesson 3, Q3 in
  lesson 4).
- Terms already explained in plain words: SQL, database, logs, deploy, domain name, URL, DNS
  resolver, packets, certificate authority, encrypt, firewall, cache, rows, trace, developer
  tools. Later lessons can use them freely.

## Mentioned, not taught (owed later)

| Topic | Where it's taught |
|---|---|
| Ports and `localhost` | 6 |
| Headers and the other methods | 27 |
| JSON and httpx | 19 |
| SQL | 21–26 |
| Authentication | 53–57 |
| CDNs and proxies | 70–76, 88–94 |
| Redirects and HSTS | 27, 82–87 |
| The FastAPI app versus the server program that runs it | FastAPI Core |
