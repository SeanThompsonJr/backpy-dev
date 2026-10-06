# Stands in for the database (the kitchen) while we learn the pieces.
POKEDEX = {
    "pikachu": {"name": "pikachu", "type": "electric"},
    "eevee": {"name": "eevee", "type": "normal"},
}


def get_pokemon(name):
    # Handles GET /pokemon/<name>. Returns (status, body).
    pokemon = POKEDEX.get(name)
    if pokemon is None:
        return 404, {"error": f"{name} not found"}
    return 200, pokemon


print(get_pokemon("pikachu"))
print(get_pokemon("pikachuu"))
