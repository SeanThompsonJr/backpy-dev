---
id: 7
title: "Python environments: venv, pip, pyproject, uv"
section: "Terminal & Linux"
sources: ["UD FastAPI Setup"]
concepts_introduced: [virtual-environment, package-manager, dependency, pyproject-toml, lock-file, semantic-versioning, uv]
concepts_used: [virtual-environment, package-manager, dependency, pyproject-toml, lock-file, semantic-versioning, uv, shell, path-variable, python-function, python-string-methods, python-list, python-types, python-for-loop]
explain_back: "Why does every Python project get its own environment and its own lock file?"
unverified_claims: []
---
## Why this matters

Every Python project at work starts the same way: set up its environment. Done right, a
teammate clones the project (downloads their own copy of it), runs one command, and has exactly
the same packages you have. Done wrong, you get "it works on my machine" and an afternoon lost.
This lesson is the setup you'll do for PokeTeam and for every project after it, with uv, the tool
backpy uses.

## The concept

### Why each project needs its own environment

A **dependency** is a package your project needs: code someone else wrote, like httpx for making
HTTP requests. Packages come from **PyPI** (the Python Package Index, pypi.org). A **package
manager** downloads and installs them: `pip` is the classic one, and uv does the same job much
faster.

If every project installed its packages into one shared Python, they'd clash: one project needs
pydantic 1, another needs pydantic 2, and only one version can be installed in one place. So
each project gets a **virtual environment**: a folder, usually `.venv`, holding the project's own
packages and a link to the Python it uses.

Each project has its own pantry, so two recipes never fight over ingredients. Where that stops
matching: a `.venv` is cheap to throw away. Delete it, and one command rebuilds it.

Ubuntu protects its own Python. Even once pip is installed, a plain `pip install httpx` there
refuses with "externally-managed-environment": it's telling you to use a virtual environment.

### Check yourself

- [Why can't two projects share one set of packages?](#why-each-project-needs-its-own-environment)
- [What's inside `.venv`?](#why-each-project-needs-its-own-environment)

### pyproject.toml and the lock file

**`pyproject.toml`** describes the project. This is the one uv writes for PokeTeam:

```toml
[project]
name = "poketeam"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.14"
dependencies = [
    "httpx>=0.28.1",
]
```

- `name` and `version`: what the project is called, and which release this is.
- `description` and `readme`: a one-line summary, and the file that explains the project.
- `requires-python`: the Python versions it runs on.
- `dependencies`: the packages it needs.

`"httpx>=0.28.1"` is a rule, not an exact version: "0.28.1 or anything newer". Packages have
dependencies of their own: adding httpx also installs httpcore, anyio, certifi, h11, idna and
typing-extensions.

So which exact versions did you get? That's the **lock file**, `uv.lock`. It records the exact
version of every package, dependencies of dependencies included, plus a fingerprint (a hash) of
each download. uv writes it; you never edit it by hand.

`pyproject.toml` is the recipe's ingredient list ("flour, at least 500 g"). `uv.lock` is the
receipt: the exact brand and size you bought, so the next cook buys exactly the same. Where that
stops matching: this receipt also lists what every ingredient was made from (dependencies of
dependencies), which no shop receipt does.

Most packages number their versions with **semantic versioning**: `MAJOR.MINOR.PATCH`, like
`2.10.1`.

- **Major** (`2`): changes that can break your code.
- **Minor** (`10`): new features that don't break anything.
- **Patch** (`1`): bug fixes only.

So `>=2.10,<3` means "2.10 or newer, but not version 3". It works like your phone's software
updates: going from 18 to 19 is a big update that can move things around, 18.1 adds features,
and 18.1.1 only fixes bugs. Where that stops matching: packages don't always keep the promise.
Before 1.0 (like httpx 0.28), even a minor update can break things, and some packages, like
certifi, use dates instead. That's one more reason the lock file exists.

Commit `pyproject.toml` and `uv.lock`, meaning save them into Git, the project's shared history
(section 3). Never commit `.venv`: it's big, it only works on the machine that made it, and
`uv.lock` rebuilds it in seconds.

### Check yourself

- [What does `"httpx>=0.28.1"` allow?](#pyprojecttoml-and-the-lock-file)
- [Which do you commit, `uv.lock` or `.venv`, and why?](#pyprojecttoml-and-the-lock-file)

### The uv workflow

**uv** manages Pythons, environments and packages with one tool. Install it in Ubuntu with its
official installer:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

That downloads a script and runs it straight away. Ask: **Who can send this, and what's the worst
thing they could send?** Only do it for a source you trust, over `https`.

It installs into `~/.local/bin`, so open a new tab for your `PATH` (lesson 6) to include it, then
check with `uv --version`.

| Command | What it does |
|---|---|
| `uv python install 3.14` | downloads Python 3.14 for uv to use |
| `uv init --no-package --python 3.14 poketeam` | makes a project folder: `pyproject.toml`, `.python-version`, `main.py`, `README.md` and, if Git is installed, a Git repository with a `.gitignore` |
| `uv init --no-package --python 3.14` | the same, in the folder you're already in |
| `uv add httpx` | adds a dependency: updates `pyproject.toml` and `uv.lock`, and installs it into `.venv` |
| `uv add --dev pytest` | adds a tool you only need while developing, like a test runner |
| `uv remove httpx` | takes a dependency out again |
| `uv run main.py` | runs a file with the project's Python and packages |
| `uv sync` | makes `.venv` match `uv.lock` exactly, e.g. after cloning a project |
| `uv python pin 3.13` | changes which Python the project uses (`.python-version`) |

Why `--no-package`? Since uv 0.12, plain `uv init` sets the project up as an installable package,
with its code in a `src/` folder. That's the right shape for a library other people install. For
an app like PokeTeam, `--no-package` gives the simple layout with `main.py`.

`uv run` checks that `.venv` matches the lock file before every run, so you never "activate"
anything. Activating a virtual environment puts `.venv/bin` first on your `PATH`, so plain
`python` finds the project's Python. With plain venv and pip, you'd run `python3 -m venv .venv`,
then `source .venv/bin/activate`, then `pip install httpx`, and keep the versions in sync
yourself. Many existing projects list their packages in a `requirements.txt` file instead of a
lock file; `uv add -r requirements.txt` brings them into a uv project.

### Check yourself

- [What does `uv add httpx` change?](#the-uv-workflow)
- [What do you run after cloning someone else's project?](#the-uv-workflow)

## Worked example

Starting PokeTeam from nothing:

```bash
uv init --no-package --python 3.14 poketeam
cd poketeam
uv add httpx
uv add --dev pytest
uv run main.py
```

After a line naming the Python it's using, `uv add httpx` prints what it installed (your versions
may be newer):

```text
Creating virtual environment at: .venv
Resolved 8 packages in 172ms
Installed 7 packages in 57ms
 + anyio==4.15.1
 + certifi==2026.7.22
 + h11==0.16.0
 + httpcore==1.0.9
 + httpx==0.28.1
 + idna==3.20
 + typing-extensions==4.16.0
```

`uv add --dev pytest` puts pytest in its own group in `pyproject.toml`, apart from what the app
needs to run:

```toml
[dependency-groups]
dev = [
    "pytest>=9.1.1",
]
```

And `uv run main.py` prints `Hello from poketeam!`, using the project's own Python and packages.

## What breaks

**Running without uv.** Once `main.py` has `import httpx`, `python3 main.py` fails with
`ModuleNotFoundError: No module named 'httpx'`. It uses Ubuntu's Python, which doesn't have the
project's packages. Use `uv run`.

**Forcing pip.** `pip install --break-system-packages` makes the "externally-managed" error go
away by changing the Python that Ubuntu's own tools rely on. Don't.

**A missing lock file.** Without `uv.lock` in the repository, every machine resolves the rules in
`pyproject.toml` on its own day, and can end up with different versions: "works on my machine".

**Old packages.** Ask: **What if two of these happen at once, or it's old, or it takes forever?**
A lock file keeps the same versions, even after a newer one fixes a security hole, until you
upgrade on purpose: `uv lock --upgrade-package httpx`, then run your tests.

**Editing `uv.lock` by hand.** Change `pyproject.toml` with `uv add` and `uv remove`, and let uv
rewrite the lock.

## Check yourself

- [Once `main.py` imports httpx, why does `python3 main.py` fail when `uv run main.py` works?](#what-breaks)
- [What are the three parts of `2.10.1`?](#pyprojecttoml-and-the-lock-file)
- [Why is pytest a dev dependency?](#worked-example)
- [How do you get a security fix for a package that's locked to an old version?](#what-breaks)
