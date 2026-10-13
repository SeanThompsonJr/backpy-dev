from main import *


def test_a_higher_minor_version_is_newer_even_with_more_digits():
    assert is_newer("2.10.0", "2.9.3") is True, \
        "2.10.0 didn't count as newer than 2.9.3. Is 10 bigger than 9? Is the text \"10\" bigger than the text \"9\"?"


def test_an_older_version_isnt_newer():
    assert is_newer("2.9.3", "2.10.0") is False, \
        "2.9.3 counted as newer than 2.10.0. How is each part of a version being compared: as a number, or as text?"


def test_a_higher_major_version_is_newer_whatever_follows_it():
    assert is_newer("10.0.0", "9.9.9") is True, \
        "Version 10 didn't beat version 9. Which part of a version decides first?"


def test_the_same_version_isnt_newer():
    assert is_newer("2.10.0", "2.10.0") is False, \
        "A version can't be newer than itself."
