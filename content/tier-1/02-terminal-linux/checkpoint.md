# Checkpoint: Terminal & Linux

Create a new Python project from an empty folder using only the terminal and uv.

Do it in Ubuntu, without looking back at the lessons. Call the project `poketeam-checkpoint`,
and delete it when you're done (PokeTeam itself gets started properly later).

Done when:
- [ ] You started from an empty folder you made with `mkdir`, and moved into it with `cd`.
- [ ] `uv init --no-package --python 3.14` set the project up in that folder, and you can
      say what each part of `pyproject.toml` is for.
- [ ] `uv add httpx` listed httpx in `pyproject.toml` and pinned exact versions in `uv.lock`.
- [ ] You changed `main.py` from the terminal (with `>` or `>>`), and `uv run main.py` prints
      your change.
- [ ] pytest is a dev dependency, and `uv run pytest` runs. No tests yet is fine.
- [ ] You can say why `.venv` isn't committed but `uv.lock` is.
- [ ] Every step was a command: no file manager, no editor.
