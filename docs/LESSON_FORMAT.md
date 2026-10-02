# Lesson format (v1)

One folder per lesson. The site, the validator, and the generator all follow this file.
If the format must change, change this file first, then the validator, then the site.

```
content/
  _registry/
    concepts.json        # every concept: id, name, one-line definition, lesson where introduced
    conventions.json     # library/version rules and banned patterns
  tier-1/
    01-orientation/
      BRIEF.md           # section plan (generated, approved by Sean before lessons are written)
      SUMMARY.md         # what the section actually taught (written after)
      REVIEW.md          # reviewer findings and how each was resolved
      checkpoint.md      # the section checkpoint and its done-when checklist
      001-why-backend/
        lesson.md
        quiz.json
        exercises/
          01-some-name/
            meta.json
            instructions.md # the scenario, shown on the left when Sean opens the exercise
            starter.py      # or starter.sql
            tests.py        # hidden from Sean in the UI
            solution.py     # locked until 2 failed runs
            hints.json
```

Lesson folder numbers use the global lesson id from curriculum.json (001-124).

Folder names:
- Tier folders: `tier-<N>`.
- Section folders: `<NN>-<section name in kebab case>`, numbered 01-27 across the whole
  curriculum in plan order (e.g. `tier-1/05-sql-postgresql`, `tier-3/20-async-performance-caching`).
  This is the name passed to `/generate-section` and `npm run validate -- <section>`.
- Lesson folders: `<NNN>-<short-kebab-slug>`. NNN must equal the lesson id; the slug is free.
- Exercise folders: `<NN>-<short-kebab-slug>`, numbered in the order Sean should do them.

## lesson.md
Front matter, then Markdown:
```
---
id: 13
title: "Functions: arguments, scope, closures, lambdas, comprehensions, functools"
section: Python
sources: ["BD 1", "BD 7"]          # informed-by tags only
concepts_introduced: [closure, mutable-default-argument]
concepts_used: [function, variable-scope]
explain_back: "Why is a mutable default argument dangerous? Answer without code."
unverified_claims: []              # filled by the reviewer if a claim couldn't be confirmed
---
## Why this matters
## The concept
## Worked example
## What breaks
## Check yourself
```
`unverified_claims` lists each claim the reviewer couldn't confirm against an official source.
Each entry quotes the claim exactly as it appears in the lesson text and says what to check:
```yaml
unverified_claims:
  - quote: "Postgres evaluates a column default for every inserted row"
    check: "PostgreSQL docs, CREATE TABLE, DEFAULT clause: confirm the default expression is evaluated per inserted row."
```
- `quote` must appear word for word in one paragraph or list item of the lesson's prose
  (formatting like **bold** or `code` is ignored when matching). The site underlines it in
  place; the validator fails if it can't be found.
- `check` names the official source and exactly what to confirm there.
- Code that must run is fenced as ```python run (or ```sql run). The validator executes it.
- Deliberately broken code is fenced as ```python broken <ExceptionName>, e.g.
  ```python broken TypeError. The validator checks that it raises exactly that exception, so a
  typo can't make a "broken" block pass for the wrong reason.
- Plain ```python blocks are display-only and are discouraged.

How code blocks run (the validator and the site follow the same rules):
- `python run` blocks run in order in one shared namespace per lesson, like notebook cells:
  a later block can use a function an earlier block defined.
- A `python broken` block runs against a copy of the namespace at that point, so it can use
  earlier definitions without changing what later blocks see.
- `sql run` blocks run in order against one fresh PGlite database per lesson: create the
  tables you need in an earlier block, query them in a later one.
- No `input()`. Browser Python has no keyboard input; pass values in as variables instead.

## Exercise types (meta.json `type`)
- `code`: write code until the hidden tests pass. Starter must FAIL; solution must PASS.
- `bug_hunt`: starter has a planted bug. Starter must FAIL; solution (the fix) must PASS.
  meta.json includes `bug_description`, shown after solving.
- `sql`: starter.sql plus `seed.sql`; tests run queries against PGlite and compare results.
- `local`: Terminal, Git, and later tiers. Instructions plus a self-check list; no browser
  runtime. (Phase 2: verified by the backpy CLI.)

meta.json:
```json
{ "type": "code", "title": "Fix the shared-list bug", "runtime": "pyodide",
  "packages": [], "timeout_seconds": 5 }
```
`packages` may only list packages that load in Pyodide. The validator enforces this.

Files per exercise type:
| type | files |
|---|---|
| `code`, `bug_hunt` | meta.json, instructions.md, starter.py, tests.py, solution.py, hints.json |
| `sql` | meta.json, instructions.md, seed.sql, starter.sql, solution.sql, tests.json, hints.json |
| `local` | meta.json (with `checklist`), instructions.md |

## instructions.md
Every exercise has one. It's the scenario, and it replaces the lesson text on the left when
Sean opens the exercise (see TEACHING_STYLE.md, "Exercises"). Short Markdown:
- The situation in PokeTeam: what's being built, or what a user reported.
- What "done" looks like: the behaviour the tests check, in plain words.
- For a bug hunt: the symptom and the expected behaviour. Never the cause or the fix.
- Not the answer, and not a restatement of the lesson.

`sql` meta.json uses `"runtime": "pglite"` and has no `packages`. `local` meta.json uses
`"runtime": "local"` and lists what Sean ticks off when he's done:
```json
{ "type": "local", "title": "Make your first commit", "runtime": "local",
  "checklist": ["git log shows one commit", "The commit message says why, not what"] }
```

## tests.json (sql exercises)
Sean's query and solution.sql each run on their own fresh database loaded from seed.sql.
The result of the last statement in each is compared, check by check, in order. The first
check that fails shows its message.
```json
{ "checks": [
  { "kind": "same_columns", "message": "Concept hint about what the result should contain." },
  { "kind": "row_count", "message": "Concept hint about which rows belong in the result." },
  { "kind": "same_rows", "ordered": true, "message": "Concept hint about values or order." }
] }
```
`same_columns` compares column names in order. `same_rows` compares values; with
`"ordered": false` the row order doesn't matter.

## tests.py
Plain `test_*` functions using `assert`. Each failure message explains the CONCEPT, not the code.
Sean's editor file is `main.py`, so every tests.py starts with `from main import *`
(the validator runs solution.py as `main.py` under pytest). The only fixture available is
`capsys`, for checking what was printed:
```python
from main import *

def test_lists_not_shared():
    assert add_member("pikachu") != add_member("eevee"), \
        "Each call got the same list. When is a default value created: at definition or at call?"
```
Tests must run under real pytest in CPython AND under backpy's small test runner in Pyodide.
The failure message is shown to Sean as the first thinking hint.

## hints.json
```json
{ "hints": [
  "Concept hint: points at the idea, never the code.",
  "Thinking hint: names the likely mistake in his reasoning."
], "solution_explanation": "Why the solution works, in 2-4 sentences." }
```

## quiz.json
```json
{ "questions": [ {
  "q": "...", "options": ["...", "...", "...", "..."], "answer": 1,
  "explanations": ["why A is wrong", "why B is right", "why C is wrong", "why D is wrong"]
} ] }
```
Every option gets an explanation. 3-6 questions per lesson. Include at least one
"predict the output" question when the lesson has code.

## checkpoint.md
The section's checkpoint from curriculum.json, broken into a done-when checklist.
From Tier 2 on, it also lists the pytest file that will verify it (Phase 2 CLI).
