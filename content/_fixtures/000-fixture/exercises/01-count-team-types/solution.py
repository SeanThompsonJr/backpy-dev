def count_types(team):
    counts = {}
    for member in team:
        counts[member["type"]] = counts.get(member["type"], 0) + 1
    return counts


def print_roster(team):
    for member in team:
        print(member["name"])
