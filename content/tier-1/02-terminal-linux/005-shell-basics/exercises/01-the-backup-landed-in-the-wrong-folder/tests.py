from main import *

HERE = "/home/sean/poketeam"


def test_a_relative_path_starts_from_the_working_directory():
    assert full_path(HERE, "app/main.py") == "/home/sean/poketeam/app/main.py", \
        "A relative path should carry on from the working directory. Where does it start?"


def test_two_dots_go_up_one_folder():
    assert full_path(HERE, "../backups") == "/home/sean/backups", \
        ".. should go up one folder before carrying on. Which folder is above poketeam?"


def test_one_dot_stays_in_the_same_folder():
    assert full_path(HERE, "./app") == "/home/sean/poketeam/app", \
        ". means the folder you're in, so it shouldn't change where the path goes."


def test_an_absolute_path_means_the_same_place_from_anywhere():
    assert full_path(HERE, "/var/backups") == "/var/backups", \
        "An absolute path ended up inside the working directory. What does a leading / say about where a path starts?"
