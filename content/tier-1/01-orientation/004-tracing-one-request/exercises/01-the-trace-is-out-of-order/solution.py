# PokeTeam's debugging guide: the hops of one "show my teams" request.
REQUEST_JOURNEY = [
    "DNS lookup",
    "TCP connection",
    "TLS handshake",
    "HTTP request",
    "server checks the request",
    "database query",
    "response",
]

for hop in REQUEST_JOURNEY:
    print(hop)
