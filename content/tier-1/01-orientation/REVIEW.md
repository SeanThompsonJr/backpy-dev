# Review: 01 Orientation

The lesson-reviewer subagent reviewed this section twice:

1. **Round 1**, on the first draft: 12 must-fix and 22 should-fix items.
2. **Round 2**, after Sean's feedback (2026-10-05). The section was rewritten: condensed, given
   Check yourself questions that jump to their answers (with checks partway through long
   lessons), explain-backs in his own words, and bug-hunt Examples that don't give the answer.
   Round 2 reviewed that rewrite: 4 must-fix and 24 should-fix items.

Every must-fix item from both rounds is fixed. One should-fix item from round 1 was declined
(reason below). After the last fixes, `npm run validate` reports 0 errors and 0 warnings.

## Round 2 (the rewrite)

### Must fix

| # | Finding | Resolution |
|---|---|---|
| MF1 | HTTPS was defined as "HTTP sent through TLS", but HTTP was never explained. | Lesson 2 now explains HTTP in plain words before TLS ("the set of rules a browser and a server use to ask for something and answer it"). |
| MF2 | Lesson 3 said `404` = "nothing was found", which contradicts lesson 4's rule that an empty list is `200`. | `404` is now "the one thing you asked for doesn't exist" everywhere in lesson 3. The bug report now names one Pokémon page, not a search. |
| MF3 | Lesson 3's bug hunt handed over the answer (`404`) in Your task, the Example and Done when. | All three now say "the status code that means 'not found'". The Example shows the body's format with `?` for the code, and the test is renamed `test_a_missing_pokemon_gets_the_not_found_status`. |
| MF4 | SUMMARY.md was stale and still said "explain using the restaurant". | Rewritten. |

### Should fix

| # | Finding | Resolution |
|---|---|---|
| SF1 | The TCP greeting lost its speaker labels, so the staff seemed to speak first (round 1's S1 had come undone). | You / Staff labels are back, in lesson 2 and concepts.json. |
| SF2 | The concepts.json analogies for `https` and `json` appeared in no lesson (round 1's S8 had come undone). | Lesson 2 adds "HTTPS is placing your order from that booth". Lesson 3 adds the order-form picture, with where it stops matching. |
| SF3 | REVIEW.md no longer matched the files. | Rewritten (this file). |
| SF4 | "Secret key" meant three different things. | Lesson 1: "a password your app uses to call a paid service". Lesson 2: "agree on a secret only they know" for the session secret, and "the private key that matches" the certificate. |
| SF5 | "Ticket" meant three things. | Lesson 3's opening now says "tasks". The SQL query is "the server's note to the kitchen, in the kitchen's own shorthand". Lesson 1 says "a customer can ask for anything". |
| SF6 | "every check happens here" contradicted lesson 1's form check. | Now "the checks that protect anything happen here". |
| SF7 | DNS caching was explained wrongly. | The resolver, the computer and the browser each cache the answer, and the resolver "finds and asks" the name servers in charge. |
| SF8 | The certificate authority was called "a company that vouches for sites". | Now "an organization that checks the site really controls that name". Added: a certificate proves the name, not that the site is honest. Exercise 2.2 says "organization". |
| SF9 | Browsers now warn before opening `http://` sites, which changes what Sean sees. | One sentence added: browsers increasingly warn, but people click past, and code never sees a warning. |
| SF10 | Connection reuse was overstated ("most requests"). | Now "often", and "the next request to the same site". |
| SF11 | "lose packets all the time" | Now "do lose packets". |
| SF12 | Latency has a second, network-only meaning. | One sentence added. |
| SF13 | A lesson 1 question jumped to the wrong idea, and lesson 1 had no check partway through. | Added `### What backend engineers do`, plus a check after it. |
| SF14 | Lessons 2–4 grouped several ideas under one check. | Each main idea now gets its own short check (lesson 2: DNS, TCP, TLS; lesson 3: pieces, requests, status codes; lesson 4: journey, methods, SQL, latency). |
| SF15 | The "reservation" stop line sat under Latency. | Moved under the journey. |
| SF16 | Some analogies never said where they stop working. | Stop lines added for `404` (not "try later"), HTTP methods (one method per request) and SQL (a typo fails the query). |
| SF17 | DNS had two pictures, one borrowed from the Python dict. | DNS keeps the street-address picture. The dict keeps the phone's contacts. |
| SF18 | A check question could only be answered by recalling the analogy. | Reworded to "doesn't exist" / "the server broke". |
| SF19 | The same question showed up as the explain-back, a check and a quiz question. | Duplicate checks dropped. Four quiz questions were rewritten to come at the idea from a new angle (lesson 1 Q3, lesson 2 Q3, lesson 3 Q4, lesson 4 Q1). |
| SF20 | Hint 1 repeated the failure message. | Hint 1 for exercises 1.1, 2.1 and 4.1 now goes one step further. |
| SF21 | "Trace" and "logs" were misused: a trace records what happened, so it can't be out of order. | Exercise 4.1 is now "The debugging guide is out of order". (The folder name is unchanged, to keep any saved progress.) |
| SF22 | Some terms had no plain-words explanation. | Explained where first used: SQL, database (lesson 1); deploy, domain name, URL (lesson 2); method/path, FastAPI, Postgres, `HTTP/1.1` (lesson 3); rows (lesson 4). Lesson 4's table drops `PRIMARY KEY` / `NOT NULL`, and its text now mentions the browser's developer tools. |
| SF23 | "Prep station" isn't something most people have seen. | A cache is now "food made ahead and kept warm under a heat lamp". `cache` is added to concepts.json (introduced in lesson 3). |
| SF24 | "Save a team" was filed under "guards". | Now "protects an account or stores a player's data". |

### Unverifiable claims

- "Many sites, pokeapi.co included, also support HTTP/3": confirmed live. pokeapi.co sends
  `alt-svc: h3=":443"` (checked with curl, 2026-10-05).
- "make most requests faster" and "lose packets all the time": reworded (SF10, SF11).
- So `unverified_claims` is empty in all four lessons.

**Check by hand** (these are in instructions.md, which the claims checker doesn't read):
- Chrome's Timing tab shows a row named **SSL** inside Initial connection (exercise 4.2).
- Chrome's certificate viewer labels the issuer **Issued By** (exercise 2.2).
- After a reload, the DNS Lookup and Initial connection rows usually disappear (exercise 4.2).

### Coverage gaps

All four are handled in the lessons now:
- The padlock proves the name, not honesty (SF8).
- Developer tools in lesson 4's text (SF22).
- Browsers warning on `http://` (SF9).
- Latency's network-only meaning (SF12).

Lesson 3 also notes that newer HTTP versions send the same parts in a compact form (`h2`, `h3`).

## Round 1 (the first draft)

Fixed:
- **M1–M3:** kitchen = database, menu = API, and client = "whatever sends the request".
- **M4:** the 400/422 analogy.
- **M5:** the `"5" + 1` explanation.
- **M7:** the empty list is `200`.
- **M8:** latency starts at the click.
- **M9:** TCP numbers the data.
- **M10:** what TLS hides.
- **M11:** Initial connection includes TLS.
- **M12:** "non-authoritative".
- **Should-fix:** S2–S7, S9, S10, S12–S19, S21 and S22.

Replaced in round 2, by the rule that an exercise's Example never gives away the answer:
- **M6** showed `tcp < tls` in the Example, which named the swapped pairs.
- **S11** listed one test per job, which named the answers.
- Both bug hunts now state behaviour instead.

Regressed in the rewrite and fixed again: S1 and S8 (round 2's SF1 and SF2).

Declined: **S20**, naming Uvicorn as the program that runs a FastAPI app. It would be a new
term in Orientation, and FastAPI Core teaches it.
