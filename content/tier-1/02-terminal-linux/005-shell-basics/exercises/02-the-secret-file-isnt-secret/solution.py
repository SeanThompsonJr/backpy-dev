def is_private(mode):
    # mode is the first column of ls -l, e.g. "-rw-r--r--".
    # Private means nobody but the owner can read, change or run the file.
    group_and_everyone_else = mode[4:10]
    return group_and_everyone_else == "------"


print(is_private("-rw-------"))
print(is_private("-rw-r-----"))
