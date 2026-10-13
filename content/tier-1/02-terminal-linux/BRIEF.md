# Brief: 02 Terminal & Linux (lessons 5–7)

**Checkpoint (curriculum.json):** Create a new Python project from an empty folder using only
the terminal and uv.

**What this section is for:** getting comfortable in a Linux terminal, the place where backend
work actually happens: servers run Linux, Docker images are Linux, and deploys, logs and Git are
all driven from a shell. Sean leaves able to move around and manage files, read and set
permissions, run and stop programs, use ports and environment variables, chain commands with
pipes, and start a clean Python project with uv.

**Inputs used:** TEACHING_STYLE.md and LESSON_FORMAT.md (both as updated 2026-10-05),
curriculum.json, concepts.json (29 concepts), conventions.json (uv preferred), and
01-orientation/SUMMARY.md. There is no reference/ material for this section, so coverage is
checked against the curriculum titles only. The facts were checked on this machine: uv 0.11.31,
and WSL 2 is on (Docker Desktop uses it), but no Linux distribution is installed.

**Left for later sections (mentioned, not taught):** Git (section 03), Docker (67–69), SSH and
deploying (70–76), shell scripting beyond one-liners, and pydantic-settings for config (FastAPI
Core).

---

## Decision 1: which terminal (needs your answer)

The lessons are written for one shell, so every command and every output in the examples matches
what you see.

- **A. Ubuntu in WSL (recommended).** Real Linux, the same as the servers and Docker images you'll
  use later. Permissions (`chmod`), processes and ports behave exactly as taught. WSL is already
  turned on, so setup is one command, `wsl --install -d Ubuntu`, plus picking a username and
  password. Lesson 5 opens with that step.
- **B. Git Bash.** Already installed with Git, so there's no setup. Most commands match, but
  `chmod` barely works on Windows files, and the process and port tools are different. So lesson 5's
  permissions part and lesson 6's local exercise would teach things you can't see working.

## Decision 2: two more Python prerequisites

The browser exercises below use `import os` and `int("8080")`. Like Option A in Orientation,
add them to concepts.json as prerequisites (`introduced_in: 0`): `python-import` (lesson 18
reviews it) and `python-types` (int, str, bool and converting between them; lesson 12 reviews
it).

---

## Lesson 5: Shell basics: navigating, files, permissions

**Objectives:** Sean can
1. Say what a terminal and a shell are, and read a command: the command, its options (flags),
   and its arguments.
2. Know where he is (`pwd`), move around (`cd`, `..`, `~`), and tell an absolute path from a
   relative one.
3. Create, list, copy, move, read and delete files and folders (`ls -la`, `mkdir -p`, `touch`,
   `cp`, `mv`, `cat`, `less`, `rm -r`), and know that `rm` has no undo.
4. Read permissions in `ls -l` (owner, group and everyone else, each with read, write and
   execute), set them with `chmod` (`+x`, `600`), and know what `sudo` does and when not to use it.
5. Use tab completion and history (up arrow, Ctrl+R).

**Concepts introduced:** `shell`, `command-options`, `working-directory`, `absolute-path`,
`relative-path`, `hidden-file`, `file-permissions`, `sudo`
**Concepts used:** the above, plus `python-function`, `python-list`, `python-string-methods`,
`python-if`, `python-for-loop`.

**Analogies:**
- Paths are directions. An absolute path is a full street address: it works from anywhere. A
  relative path is "two doors down from here": it only works from where you're standing (the
  working directory). `..` is "back out one door". *Where it breaks:* in the shell, "here" only
  changes when you `cd`, never as a side effect of looking around.
- `rm` is a shredder, not the recycle bin.
- Permissions are house keys: the owner, the household (group), and visitors (everyone else).
  Each can look (read), change things (write), and enter a room or run a program (execute).
  `sudo` is the building manager's master key. *Where it breaks:* "visitors" includes every
  program running as another user, not just people.
- Hidden files (dotfiles) hold settings and stay out of a normal `ls`, like a junk drawer that
  isn't on the counter.

**Exercises:**
1. Bug hunt, **"The backup landed in the wrong folder."** `full_path(cwd, path)` turns what
   you typed into a full path. The planted bug: an absolute path gets glued onto the working
   directory (`/home/sean/poketeam` + `/backups` → `/home/sean/poketeam/backups`). 4 tests:
   - a relative path is added to the working directory
   - `..` goes up one folder
   - `.` stays put
   - an absolute path is used as it is

   The Example uses only relative paths and `..`, which already work.
2. Bug hunt, **"The secret file isn't secret."** `is_private(mode)` reads strings like
   `-rw-------`. The planted bug: it only checks "everyone else" and forgets the group. 3 tests:
   - owner-only is private
   - a file the group can read isn't private
   - a file everyone can read isn't private

   The Example uses `-rw-------` and `-rw-rw-rw-`, both of which already work.
3. Local, **"Set up PokeTeam's folders."** In the terminal: make the folders, create a `.env`
   file, compare `ls` with `ls -a`, `chmod 600 .env` and read `ls -l`, use relative and absolute
   paths, then delete a practice folder with `rm -r`. Checklist of 5.

Checks partway through: after paths, after files, after permissions.

---

## Lesson 6: Processes, ports, environment variables, pipes

**Objectives:** Sean can
1. Say what a process is (a running program with a PID), see it (`ps`), stop it (Ctrl+C,
   `kill`), and know why a server left running is a problem.
2. Explain a port and `localhost`, read `localhost:8000`, and recognise "address already in
   use".
3. Set and read environment variables (`export`, `echo $VAR`, `env`), explain why config and
   secrets live there (and in `.env` files that are never committed), and explain `PATH` and
   "command not found".
4. Use stdout and stderr, redirect output (`>`, `>>`, `2>`), and chain commands with pipes
   (`|`, `grep`, `wc -l`, `head`, `tail -f`).
5. Read environment variables in Python with `os.environ`, and know that their values are
   always strings.

**Concepts introduced:** `process`, `port`, `localhost`, `environment-variable`,
`path-variable`, `standard-streams`, `redirection`, `pipe`
**Concepts used:** the above, plus `ip-address`, `server`, `client`, `python-import`,
`python-dict`, `python-types`, `python-if`, `python-function`, `python-string-methods`.

**Analogies:**
- A program and a process: a recipe and the meal actually being cooked. You can cook the same
  recipe twice at once (two processes).
- A port is the apartment number. The IP address (lesson 2's street address) gets you to the
  building, and the port gets you to the right door. `localhost` is "my own building". *Where it
  breaks:* only one program can live behind a door at a time, hence "address already in use".
- Environment variables are sticky notes on the fridge. Every program you start from this
  terminal can read them. *Where it breaks:* a program gets a copy of the notes when it starts,
  so later changes don't reach it.
- `PATH` is the list of drawers you check, in order, when you look for the scissors.
- Pipes are a car wash: each station does one job and passes the car to the next. Redirection
  pours the output into a file instead of onto the screen (`>` replaces it, `>>` adds to it).

**Exercises:**
1. Bug hunt, **"Debug mode won't turn off."** `load_settings(env)` turns a dict of environment
   variables into `{"debug": ..., "port": ...}`. The planted bug: environment values are
   always strings, so `DEBUG=false` counts as on and `PORT=8080` stays text. The report: "We
   set DEBUG=false on the live server, but players still see full error pages." 4 tests:
   - `DEBUG=false` turns debug off
   - `DEBUG=true` turns it on
   - the port is a number when `PORT` is set
   - missing values fall back to debug off and port 8000

   The Example shows `load_settings({})`, which already works.
2. Local, **"Two servers, one door."** Start `python3 -m http.server 8000` and open
   `localhost:8000`. Start a second one on the same port and read the error. Find the process,
   stop it with Ctrl+C, set and read an environment variable from Python, write a `.env` with
   `>`, and count files with a pipe. Checklist of 5.

Checks partway through: after processes, ports, environment variables, and streams and pipes.

---

## Lesson 7: Python environments: venv, pip, pyproject, uv

**Objectives:** Sean can
1. Explain why each project needs its own environment: different projects need different
   versions of the same package.
2. Say what a virtual environment (`.venv`) is, and what `pip` and PyPI are.
3. Read a `pyproject.toml` (name, `requires-python`, dependencies) and say why `uv.lock` exists
   (exact versions, so every machine gets the same thing).
4. Use uv: `uv init`, `uv python install` / `pin`, `uv add`, `uv add --dev`, `uv remove`,
   `uv run`, `uv sync`.
5. Read a version number (`MAJOR.MINOR.PATCH`) and a version rule (`>=2.10,<3`), and know
   why `.venv` is never committed.

**Concepts introduced:** `virtual-environment`, `package-manager`, `dependency`,
`pyproject-toml`, `lock-file`, `semantic-versioning`, `uv`
**Concepts used:** the above, plus `shell`, `path-variable`, `python-function`,
`python-string-methods`, `python-list`, `python-tuple`, `python-types`, `python-if`.

**Analogies:**
- Each project has its own pantry (the virtual environment), so two recipes never fight over
  ingredients.
- `pyproject.toml` is the recipe's ingredient list ("flour, at least 500 g"). `uv.lock` is the
  receipt: the exact brand and size bought, so the next cook buys exactly the same. PyPI is the
  store, and uv does the shopping.
- A version number is like a book's editions: a new edition can change chapters (major), a
  reprint can add a chapter (minor), or a reprint can fix typos (patch). *Where it breaks:*
  packages don't always follow the rule, which is exactly why the lock file exists.

**Exercises:**
1. Bug hunt, **"The upgrade checker thinks old is new."** `is_newer(a, b)` compares two
   versions. The planted bug: it compares them as text, so `"2.10.0"` sorts before `"2.9.3"`.
   4 tests:
   - a two-digit minor version is newer
   - a lower version isn't newer
   - a higher major version beats any minor
   - the same version isn't newer

   The Example uses `"2.1.0"` vs `"2.0.0"` and an equal pair, both of which already work.
2. Local, **"Start a project with uv."** Install uv in Ubuntu with its official installer, then:
   - `uv python install 3.14`
   - `uv init` and `uv python pin 3.14`
   - `uv add httpx`, then read `pyproject.toml` and `uv.lock`
   - `uv run main.py`
   - `uv add --dev pytest`, then `uv run pytest`

   Checklist of 5.

Checks partway through: after why environments exist, after pyproject and the lock file, after
the uv workflow.

---

## Quizzes
Each lesson has 4–5 questions, with an explanation for every option and at least one "Predict
the output". Some are on shell commands, e.g. what `pwd` prints after `cd ../backups`; some are
on Python, e.g. what `bool("false")` gives. No question asks for an analogy.

## Explain-back (own words, no analogy required)
- Lesson 5: "What's the difference between an absolute and a relative path, and when would a
  relative path send a command to the wrong place?"
- Lesson 6: "Why do servers read their settings from environment variables instead of having
  them written in the code?"
- Lesson 7: "Why does every Python project get its own environment and its own lock file?"

## Checkpoint checklist (checkpoint.md)
- [ ] You started from an empty folder you made with `mkdir`, and moved into it with `cd`.
- [ ] `uv init` and `uv python pin 3.14` set the project up, and you can say what each part of
      `pyproject.toml` is for.
- [ ] `uv add httpx` listed httpx in `pyproject.toml` and pinned exact versions in `uv.lock`.
- [ ] You changed `main.py` from the terminal (with `>` or `>>`), and `uv run main.py` prints it.
- [ ] pytest is a dev dependency, and `uv run pytest` runs. No tests yet is fine.
- [ ] You can say why `.venv` isn't committed but `uv.lock` is.
- [ ] Every step was a command: no file manager, no editor.
