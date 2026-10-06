from main import *

CONNECTION = ["DNS lookup", "TCP connection", "TLS handshake", "HTTP request"]
SERVER_SIDE = ["server checks the request", "database query", "response"]


def test_every_hop_is_still_there():
    assert sorted(REQUEST_JOURNEY) == sorted(CONNECTION + SERVER_SIDE), \
        "A hop is missing, added or renamed. Keep all seven hops, spelled exactly as in the starter."


def test_the_connection_steps_are_in_the_order_they_happen():
    assert REQUEST_JOURNEY[:4] == CONNECTION, \
        "The connection steps are out of order. For each one, ask: what has to exist before it can start?"


def test_the_server_side_steps_are_in_the_order_they_happen():
    assert REQUEST_JOURNEY[4:] == SERVER_SIDE, \
        "The server-side steps are out of order. What does the server do with a request before anything reaches the database?"
