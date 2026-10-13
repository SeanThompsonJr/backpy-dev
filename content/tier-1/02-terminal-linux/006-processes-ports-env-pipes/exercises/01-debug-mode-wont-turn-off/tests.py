from main import *


def test_debug_false_turns_debug_mode_off():
    assert load_settings({"DEBUG": "false"})["debug"] is False, \
        "Setting DEBUG to false still turned debug mode on. What type is every value you get from an environment variable?"


def test_debug_true_turns_debug_mode_on():
    assert load_settings({"DEBUG": "true"})["debug"] is True, \
        "Setting DEBUG to true should turn debug mode on. Did the fix change that case too?"


def test_the_port_is_a_number_when_port_is_set():
    port = load_settings({"PORT": "8080"})["port"]
    assert port == 8080 and isinstance(port, int), \
        "PORT came back as text, not a number. Environment variables only ever hold one type of value: which one?"


def test_missing_values_fall_back_to_debug_off_and_port_8000():
    assert load_settings({}) == {"debug": False, "port": 8000}, \
        "With nothing set, debug should be off and the port should be the number 8000."
