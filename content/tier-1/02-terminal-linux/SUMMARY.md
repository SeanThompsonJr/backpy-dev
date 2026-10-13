# Summary: 02 Terminal & Linux (lessons 5–7)

What this section actually taught, for the sections that come after it. concepts.json holds
each concept's definition and analogy. This file records the setup, terms and conventions later
lessons can rely on.

## Lessons

| # | Lesson | Exercises |
|---|---|---|
| 5 | Shell basics: navigating, files, permissions | Bug hunt "The backup landed in the wrong folder" (4 tests); bug hunt "The secret file isn't secret" (2 tests); local "Set up PokeTeam's folders" |
| 6 | Processes, ports, environment variables, pipes | Bug hunt "Debug mode won't turn off" (4 tests); local "Two servers, one door" |
| 7 | Python environments: venv, pip, pyproject, uv | Bug hunt "The upgrade checker thinks old is new" (4 tests); local "Start a project with uv" |

Checkpoint: create a uv project from an empty folder using only commands, including writing to
`main.py` with `>` / `>>` (checkpoint.md).

## Sean's setup, from here on

- **Linux:** Ubuntu in WSL 2, opened from Windows Terminal's dropdown. Projects live in the Linux
  home folder (`~`), not under `/mnt/c`. The shell is bash.
- **Python:** `python3` (Ubuntu's), but projects always run through `uv run`. uv-managed Python
  3.14 is installed with `uv python install 3.14`.
- **uv:** 0.12 or newer, from the official installer, in `~/.local/bin`. New projects use
  `uv init --no-package --python 3.14 <name>`, which gives `main.py`, `pyproject.toml`,
  `.python-version`, `README.md`, and a Git repository with `.gitignore` when Git is installed.
  Plain `uv init` makes a packaged `src/` layout instead; PokeTeam doesn't use it.
- **Dev tools** go in the `dev` group (`uv add --dev pytest`). `uv run pytest` with no tests
  prints "no tests ran", which is expected.
- **Committing:** commit `pyproject.toml` and `uv.lock`, never `.venv`. `.env` is never committed.
  Git itself comes in section 03.
- **Practice servers:** `python3 -m http.server 8000 --bind 127.0.0.1`, run from a dedicated
  folder (`~/site`). Local development uses port 8000.

## Concepts introduced

- Lesson 5: `shell`, `command-options`, `working-directory`, `absolute-path`, `relative-path`,
  `hidden-file`, `file-permissions`, `sudo`
- Lesson 6: `process`, `port`, `localhost`, `environment-variable`, `path-variable`,
  `standard-streams`, `redirection`, `pipe`
- Lesson 7: `virtual-environment`, `package-manager`, `dependency`, `pyproject-toml`,
  `lock-file`, `semantic-versioning`, `uv`

Prerequisites added: `python-import` (lesson 18 reviews it) and `python-types` (lesson 12).

## Analogies used

No restaurant in this section. Each concept got its own everyday picture:

| Picture | Concept | Where it stops matching (stated in the lesson) |
|---|---|---|
| Mall map: main entrance / "You are here" dot / back out to the corridor | Absolute path / working directory and relative path / `..` | The dot only moves when you `cd` |
| A shredder, not the recycle bin | `rm` | `rm -r` shreds a whole folder you never look at |
| House keys: owner, household, visitors | File permissions | "Visitors" includes programs, not just people |
| Building manager's master key | `sudo` | (none stated) |
| Recipe and the meal being cooked | Program and process | A stopped process loses anything it hadn't saved |
| Apartment number, building on lesson 2's street address | Port | One program per port at a time |
| Sticky notes on the fridge | Environment variables | A program gets a copy at start; only exported ones reach it |
| Drawers checked in order for the scissors | `PATH` | Programs in the current folder need `./` |
| A car wash | Pipe | Stations can drop cars or turn them into one number |
| Each project's own pantry | Virtual environment | Cheap to throw away and rebuild |
| Ingredient list / receipt | `pyproject.toml` / `uv.lock` | The receipt also lists dependencies of dependencies |
| Phone software updates (18 → 19, 18.1, 18.1.1) | Semantic versioning | Not every package keeps the promise (0.x, dates) |

## Terms and conventions used

**Commands taught**

| Topic | Commands |
|---|---|
| Moving around | `pwd`, `cd` (`..`, `~`, `-`), `ls` (`-l`, `-a`, `-la`) |
| Files and folders | `mkdir -p`, `touch`, `cp` (`-r`, `-i`), `mv`, `cat`, `less`, `rm` (`-r`) |
| Wildcards | `*` |
| Permissions | `chmod` (`+x`, `600`, `755`), `sudo`, `apt install` |
| Processes | `ps aux`, `pgrep -a python`, `kill`, `kill -9`, Ctrl+C |
| Ports | `ss -ltnp` |
| Environment | `export`, `echo $VAR`, `env`, `VAR=value command`, `which` |
| Streams and pipes | `>`, `>>`, `2>`, `2>&1`, `\|`, `grep`, `wc -l`, `head`, `tail` (`-n`, `-f`) |
| Python one-liners | `python3 -c '…'` |
| uv | `uv python install` / `pin`, `uv init --no-package`, `uv add` (`--dev`, `-r`), `uv remove`, `uv run`, `uv sync`, `uv lock --upgrade-package` |

**Environment variables**
- They're read in Python with `os.environ`, which works like a dict.
- Values are always strings. `bool("false")` is `True`, so compare the text (`== "true"`), and
  convert numbers with `int()`.
- Exercises pass settings as a dict (`load_settings(env)`) so tests can supply their own.

**Ports:** 80 HTTP, 443 HTTPS, 5432 Postgres, 8000 for development (`fastapi dev`'s default). Ports
below 1024 need root.

**Versions:** semantic versioning is `MAJOR.MINOR.PATCH`. Rules look like `>=0.28.1` and
`>=2.10,<3`. Parts compare as numbers, not text.

**Words already explained in plain words** (later lessons can use them freely):
- terminal, shell, bash, prompt, option/flag, argument, working directory
- absolute and relative path, hidden file/dotfile, script, superuser/root, apt
- process, PID, port, localhost
- environment variable, `PATH`, stdin/stdout/stderr, redirection, pipe, quoting
- package, dependency, PyPI, virtual environment, activate
- lock file, hash/fingerprint, semantic versioning
- production
- commit, repository, `.gitignore`, clone (each a one-line explanation only; Git itself is section 03)

**The Five Questions** quoted word for word: Q5 (lesson 5), Q1 (lesson 6), Q2 (lesson 7's
installer note) and Q3 (lesson 7's old packages).

## Mentioned, not taught (owed later)

| Topic | Where it's taught |
|---|---|
| Git: commits, `.gitignore`, cloning | Section 03 |
| pydantic-settings for reading config | FastAPI Core |
| `fastapi dev` and Uvicorn | FastAPI Core |
| Docker | 67–69 |
| SSH and deploying | 70–76 |
| Shell scripting beyond one-liners | not scheduled yet |
| The packaged `src/` layout and `[build-system]` | Only if PokeTeam ever becomes a library |
