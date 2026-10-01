from main import *


def test_each_new_team_starts_empty():
    add_member("pikachu")
    assert add_member("eevee") == ["eevee"], \
        "The second new team already had a member. When is a default value created: when def runs, or on each call?"


def test_passing_a_team_still_adds_to_it():
    team = ["snorlax"]
    assert add_member("lapras", team) == ["snorlax", "lapras"], \
        "Passing a team in should still add to that team. Does your fix still use the argument when it's given?"
