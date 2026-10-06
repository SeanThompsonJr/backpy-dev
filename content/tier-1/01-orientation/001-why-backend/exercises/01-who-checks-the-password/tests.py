from main import *

PROTECTS = ["check the password is correct", "block deleting others' teams", "save a team"]
LOOKS = ["lay out the team page", "show a loading spinner", "hide the Delete button"]


def test_jobs_that_protect_accounts_or_store_data_run_on_the_backend():
    wrong = [job for job in PROTECTS if where_it_runs(job) != "backend"]
    assert not wrong, \
        "A job that protects an account or stores a player's data still runs in the browser. Who controls the code that runs in the browser?"


def test_jobs_that_only_change_what_players_see_stay_on_the_frontend():
    wrong = [job for job in LOOKS if where_it_runs(job) != "frontend"]
    assert not wrong, \
        "A job that only changes what the player sees was moved to the backend. Does showing or hiding something on the page protect anything?"
