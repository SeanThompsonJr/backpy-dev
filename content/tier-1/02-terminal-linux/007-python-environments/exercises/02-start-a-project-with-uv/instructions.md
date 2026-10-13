## The situation

PokeTeam will be a uv project. Before you start it for real, you'll
set up a practice project to see every file uv makes, then delete it.

## Your task

In Ubuntu:

1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
   Open a new tab, then run `uv --version`.
2. `uv python install 3.14`.
3. `cd ~`, then `uv init --no-package --python 3.14 uv-practice`,
   then `cd uv-practice` and `ls -a`.
4. `uv add httpx`, then `cat pyproject.toml` and `head -n 20 uv.lock`.
5. `uv run main.py`.
6. `uv add --dev pytest`, then `uv run pytest`.
7. `cd ~`, then `rm -r uv-practice`.
8. Tick each item in the checklist when it's true.

## Example

With no tests written yet, step 6 ends like this. That's expected:

```text
collected 0 items

============================ no tests ran in 0.05s ============================
```
