from main import *

TEAM = [
    {"name": "pikachu", "type": "electric"},
    {"name": "raichu", "type": "electric"},
    {"name": "gyarados", "type": "water"},
]


def test_counts_each_type():
    assert count_types(TEAM) == {"electric": 2, "water": 1}, \
        "The counts don't match. Each type is a key: what should happen the second time you see a type?"


def test_empty_team_has_no_types():
    assert count_types([]) == {}, \
        "An empty team has no types. What does your function return when the loop body never runs?"


def test_roster_prints_one_name_per_line(capsys):
    print_roster(TEAM)
    assert capsys.readouterr().out == "pikachu\nraichu\ngyarados\n", \
        "The printed roster is off. print() ends every call with a newline: how many calls should there be?"
