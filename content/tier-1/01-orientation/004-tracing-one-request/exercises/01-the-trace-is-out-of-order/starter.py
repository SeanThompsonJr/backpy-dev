# PokeTeam's debugging guide: the hops of one "show my teams" request.
REQUEST_JOURNEY = [
    "DNS lookup",
    "TLS handshake",
    "TCP connection",
    "HTTP request",
    "database query",
    "server checks the request",
    "response",
]

for hop in REQUEST_JOURNEY:
    print(hop)
