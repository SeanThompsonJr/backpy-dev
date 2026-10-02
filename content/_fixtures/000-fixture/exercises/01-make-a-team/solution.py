def make_team(name, members=None, public=False):
    if members is None:
        members = []
    return {"name": name, "members": members, "public": public}


def describe_team(team):
    visibility = "public" if team["public"] else "private"
    print(f"{team['name']} ({visibility}): {len(team['members'])} members")
