# Where each PokeTeam job runs.
# "frontend": in the user's browser. "backend": on PokeTeam's server.
JOBS = {
    "lay out the team page": "frontend",
    "show a loading spinner": "frontend",
    "hide the Delete button": "frontend",
    "check the password is correct": "backend",
    "block deleting others' teams": "backend",
    "save a team": "backend",
}


def where_it_runs(job):
    return JOBS[job]


for job in JOBS:
    print(f"{job}: {where_it_runs(job)}")
