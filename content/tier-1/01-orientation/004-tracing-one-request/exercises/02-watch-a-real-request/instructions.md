## The situation

PokeTeam will ask PokeAPI for Pokémon data, one request at a time.
Your browser can show you every request it sends.
Here you watch one, from the order to the plate.

## Your task

1. Open Chrome or Edge, and open a new tab.
2. Press **F12** (or **Ctrl+Shift+I**) to open the developer tools.
3. Click the **Network** tab.
4. Paste `https://pokeapi.co/api/v2/pokemon/pikachu` into the
   address bar and press Enter.
5. Click the request named `pikachu` in the list.
6. In **Headers**, find the request method and the status code.
   Do this before you reload the page.
7. In **Timing**, find how long the request took.
8. In **Preview** (or **Response**), find `base_experience`.
9. Tick each item in the checklist when it's true.

## Example

On a fresh connection, the Timing tab also shows **DNS Lookup** and
**Initial connection**. Initial connection covers TCP, and the TLS
time is counted inside it (look for a row named **SSL**, the old
name for TLS). Those are hops 2 to 4 of the journey.

Reload the page, and those rows usually disappear: the browser kept
the connection open. The status may also change to `304` or say
"from disk cache": the browser reused its saved copy. That's why
you read the status first.
