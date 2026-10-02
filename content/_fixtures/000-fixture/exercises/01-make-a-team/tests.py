from main import *


def test_new_teams_get_their_own_roster():
    rain = make_team("Rain Dance")
    sun = make_team("Sun Room")
    rain["members"].append("pelipper")
    assert sun["members"] == [], \
        "Adding to one new team changed another. Where does each team's empty list come from, and when is it made?"


def test_members_passed_in_are_used():
    assert make_team("Volt Turn", ["rotom"])["members"] == ["rotom"], \
        "Members passed in should end up on the team. Is the argument being used when it's given?"


def test_teams_start_private():
    assert make_team("Trick Room")["public"] is False, \
        "A team nobody marked public should be private. What value does public get when the caller leaves it out?"


def test_summary_line(capsys):
    describe_team({"name": "Rain Dance", "members": ["pelipper", "barraskewda"], "public": False})
    assert capsys.readouterr().out == "Rain Dance (private): 2 members\n", \
        "The summary line doesn't match the example. Compare it character by character, including the brackets and colon."
