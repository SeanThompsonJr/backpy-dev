# Checkpoint: Orientation

Draw the path of one PokeTeam request from the browser to Postgres and back, and explain each
hop out loud.

Use "show my teams" (`GET /teams`). Draw it on paper or in any drawing app. Boxes and arrows
are enough.

Done when:
- [ ] Your drawing starts at the browser and ends back at the browser.
- [ ] It shows each hop: DNS lookup, TCP connection, TLS handshake, HTTP request, the server
      checking the request, the database query, and the response.
- [ ] Each hop has one sentence: what happens there, and one thing that can go wrong.
- [ ] You can explain it out loud, in your own words, in under two minutes.
- [ ] You can say which status code the browser gets when you ask for one team
      (`GET /teams/7`) that doesn't exist, and why.
