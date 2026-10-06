from main import *


def test_a_pokemon_that_exists_comes_back_with_200_and_its_data():
    assert get_pokemon("eevee") == (200, {"name": "eevee", "type": "normal"}), \
        "A Pokémon that exists should still come back with 200 and its data. Did the fix change the found case too?"


def test_a_missing_pokemon_gets_the_not_found_status():
    status, body = get_pokemon("pikachuu")
    assert status == 404, \
        "A missing Pokémon didn't get the \"not found\" status. What does the status code tell the client before it reads the body?"


def test_the_not_found_body_names_the_missing_pokemon():
    status, body = get_pokemon("pikachuu")
    assert isinstance(body, dict) and "pikachuu" in str(body.get("error", "")), \
        "The \"not found\" body should be a dict whose \"error\" names what wasn't found. How else would the client know what to tell the player?"
