def is_private(mode):
    # mode is the first column of ls -l, e.g. "-rw-r--r--".
    # Private means nobody but the owner can read, change or run the file.
    everyone_else = mode[7:10]
    return everyone_else == "---"


print(is_private("-rw-------"))
print(is_private("-rw-r-----"))
