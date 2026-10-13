def as_numbers(version):
    # "2.10.0" -> [2, 10, 0]
    numbers = []
    for part in version.split("."):
        numbers.append(int(part))
    return numbers


def is_newer(a, b):
    # True when version a is newer than version b, e.g. "2.1.0" and "2.0.5".
    return as_numbers(a) > as_numbers(b)


print(is_newer("2.10.0", "2.9.3"))
print(is_newer("2.9.3", "2.10.0"))
