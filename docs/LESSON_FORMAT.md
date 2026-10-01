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
            starter.py      # or starter.sql
            tests.py        # hidden from Sean in the UI
            solution.py     # locked until 2 failed runs
            hints.json
```

Lesson folder numbers use the global lesson id from curriculum.json (001-124).

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
- Code that must run is fenced as ```python run (or ```sql run). The validator executes it.
- Deliberately broken code is fenced as ```python broken. The validator checks that it fails.
- Plain ```python blocks are display-only and are discouraged.

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

## tests.py
Plain `test_*` functions using `assert`. Each failure message explains the CONCEPT, not the code:
```python
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
