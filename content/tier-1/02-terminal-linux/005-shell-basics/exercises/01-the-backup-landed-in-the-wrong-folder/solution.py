def full_path(cwd, path):
    # Where a path typed in the working directory cwd really points.
    folders = []
    for part in cwd.split("/"):
        if part:
            folders.append(part)
    if path.startswith("/"):
        folders = []
    for part in path.split("/"):
        if part == "" or part == ".":
            continue
        if part == "..":
            if folders:
                folders.pop()
        else:
            folders.append(part)
    return "/" + "/".join(folders)


print(full_path("/home/sean/poketeam", "app/main.py"))
print(full_path("/home/sean/poketeam", "/var/backups"))
