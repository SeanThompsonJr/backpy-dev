def add_member(name, team=None):
    if team is None:
        team = []
    team.append(name)
    return team
