from main import *


def test_a_file_only_the_owner_can_use_is_private():
    assert is_private("-rw-------") is True, \
        "Only the owner has any permissions here, so the file is private. Does your check still say so?"


def test_a_file_anyone_besides_the_owner_can_use_isnt_private():
    for mode in ["-rw-r-----", "-rw----r--", "-rw-rw----", "-rwx--x---"]:
        assert is_private(mode) is False, \
            "A file someone besides the owner can read, change or run counted as private. Which sets of three come after the owner's in ls -l?"
