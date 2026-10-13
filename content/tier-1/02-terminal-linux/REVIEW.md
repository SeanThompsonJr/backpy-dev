# Review: 02 Terminal & Linux

The lesson-reviewer subagent reviewed the whole section after
`npm run validate -- 02-terminal-linux --complete` passed. It checked claims against official
docs (Ubuntu man pages, bash, uv, Python, Microsoft WSL, PEP 668) without running code. It found
4 must-fix and 31 should-fix items.

All 4 must-fix items are fixed. Of the 31 should-fix items, 30 are fixed as suggested and one was
corrected rather than applied (see the `python` note under lesson 6, below). Afterwards,
`npm run validate -- 02-terminal-linux --complete` reports 0 errors and 0 warnings.

## Must fix

| # | Finding | Resolution |
|---|---|---|
| M1 | uv 0.12 (2026-07-28) made plain `uv init` create a packaged `src/` layout with no `main.py`. The brief's facts came from uv 0.11.31, so lesson 7, its exercise, quiz and the checkpoint would break on the uv Sean installs (0.12.23). | Confirmed in uv's 0.12.0 release notes, and by running uv 0.12.23 once with `uvx`, without changing the installed uv. Everything now uses `uv init --no-package --python 3.14`. Lesson 7 explains what plain `uv init` does now, and why PokeTeam uses `--no-package`. The `uv add httpx` output in the lesson is the real 0.12.23 output. |
| M2 | An `ls -l` listing showed `.env`, which plain `ls -l` hides; the rows were out of order and the sizes misaligned. | Now `ls -la` (with `.` and `..` left out, and saying so), rows in `ls` order, sizes right-aligned. |
| M3 | The paths bug hunt's Example showed no `.` case, which a test checks. | Added `./tests`. The absolute-path case stays out, because that's the answer. |
| M4 | "Every program you start from this terminal gets a copy of them." Only exported variables do. | Says "the exported ones", shows `export` against `VAR=value command`, adds the mistake to What breaks, and a new quiz question tests it. |

## Should fix

**Lesson 5**

| # | Finding | Resolution |
|---|---|---|
| 1 | A street address already means IP address (lesson 2), and lesson 6 uses it that way. | Paths are now a mall map: directions from the main entrance (absolute) or from the "You are here" dot (relative), and `..` is "back out to the corridor". |
| 2 | Group permissions were explained wrongly, and `sean sean` wasn't explained. | Now the file's group, the second name. Ubuntu gives each user a group with their own name. |
| 3 | There was no check after "Reading a command". | Added. |
| 4 | "Script" and "apt" weren't explained. | Explained. "Root" is also noted as meaning two things. |
| 5 | Quiz Q1 didn't say the folder exists. | "(both folders exist)". |
| 6 | Quiz Q5 said a restart can't fix "Permission denied". | "Usually changes nothing." |
| 7 | Hint 1 said less than the failure message. | Rewritten to go one step further. |
| 8 | The solution broke on `cwd="/"`, and `..` above the top raised an error. | Starter and solution now handle both. |
| 9 | The permissions bug hunt's step 2 named the cause. | Now describes the symptom. |
| 10 | The local exercise never asked for Tab or an absolute path. | Steps added for both. |

**Lesson 6**

| # | Finding | Resolution |
|---|---|---|
| 11 | The pipe analogy's stop line was wrong. | Now: a station can throw cars away (`grep`) or turn them into one number (`wc -l`). |
| 12 | Four analogies had no stop line: recipe, drawers, receipt, shredder. | All four have one. The drawers line also teaches `./deploy.sh`. |
| 13 | Quoting was used but never taught. | Single quotes against double quotes, with a Python one-liner. |
| 14 | The practice server shared the whole home folder on every network interface. | It now runs from `~/site` with `--bind 127.0.0.1`, in the lesson and the exercise. |
| 15 | "Settings that vanish" gave no fix. | `~/.bashrc`, or the project's `.env`. |
| 16 | "FastAPI's server uses it by default" blurred the app and the program that runs it. | "FastAPI's `fastapi dev` command serves on it by default." |
| 17 | `pgrep -a python3` misses Pythons started by `uv run`. | `pgrep -a python`. `ps aux` added too. |
| 18 | Git terms and "production" weren't explained. | Explained where first used (commit, repository, `.gitignore`, clone, production). |
| 19 | "A second tab" didn't say Ubuntu. | "Ubuntu tab" throughout. |
| 20 | The local exercise's Example didn't show where the PID is. | Shows the shape of an `ss` line. |
| 21 | The bug hunt's step 3 said "a real True or False" (it already was one). | Now says what the values should mean. |
| 22 | The `bool("false")` trap was never taught. | Added to What breaks, without the fix. |
| 23 | Quiz Q4 repeated the explain-back. | Replaced with a predict-the-output on `export`. |

**Lesson 7**

| # | Finding | Resolution |
|---|---|---|
| 23 | Quiz Q2 repeated the explain-back. | Replaced with a version-range question. |
| 24 | "Version numbers follow semantic versioning" was too broad. | "Most packages", with the 0.x and date-version exceptions. |
| 25 | "A reprint adds a chapter" doesn't happen. | Now phone software updates: 18 to 19, 18.1, 18.1.1. |
| 26 | The "running without uv" failure wouldn't happen with uv's own `main.py`. | "Once `main.py` has `import httpx`". Same fix in the quiz and Check yourself. |
| 27 | One sentence needed rereading. | Rewritten. |
| 28 | "Activate" wasn't explained. | One sentence: it puts `.venv/bin` first on `PATH`. |
| 29 | The pyproject example left out fields uv writes. | Shows the full `[project]` table, with a line on each field. |
| 30 | The checkpoint needed `uv init` in the current folder, which the lesson never showed. | Added to the table. |
| 31 | Hint 2 told him what code to write. | Rewritten as the concept. |

The lesson 7 rows reuse the number 23 because the reviewer listed both quizzes as a single item.

**Coverage gaps, also added:**
- **Lesson 5:** wildcards (`*`), `cp`/`mv` overwriting without asking (`-i`).
- **Lesson 6:**
  - `2>&1`
  - `VAR=value command`
  - ports below 1024 needing root
  - `python` against `python3`
- **Lesson 7:**
  - `requirements.txt` (`uv add -r`)
  - `uv python pin`
  - a trust note on `curl … | sh`, framed with the Five Questions

**One review suggestion was corrected.** It said WSL's Windows `PATH` lets plain `python` find
Windows' `python.exe`. Bash only finds a command whose file name matches exactly, so `python`
doesn't reach `python.exe`. The lesson says instead that Ubuntu's Python is `python3`, and plain
`python` usually gives "command not found".

## Unverifiable claims

None of the four were left as claims:

| Claim | What happened |
|---|---|
| New files' group permissions under Ubuntu's default umask | Now hedged: the worked example says some setups also give the group write permission (`drwxrwxr-x`), and that's fine when your group is just you. |
| "If it asks for administrator rights…" | Replaced with Microsoft's own instruction: run PowerShell as administrator. |
| `ss -ltnp` showing every process | Now says to add `sudo` to see other users' processes, and that it lists ports being listened on. |
| The `uv add httpx` output | Replaced with real uv 0.12.23 output. The machine-specific first line is described rather than shown. |

So `unverified_claims` stays empty in all three lessons.

**Check by hand,** the first time you do the exercises:
- Your `umask`: are new folders `drwxr-xr-x` or `drwxrwxr-x`? Either is fine.
- Whether Ubuntu came with Git (uv only makes a repository if Git is installed).
