def is_newer(a, b):
    # True when version a is newer than version b, e.g. "2.1.0" and "2.0.5".
    return a > b


print(is_newer("2.10.0", "2.9.3"))
print(is_newer("2.9.3", "2.10.0"))
