# Generation pipeline: one section at a time, verified before Sean sees it

Content is generated per section (one checkpoint at a time), never all at once.
Every section is generated from the SAME fixed set of inputs, so the generator never
depends on a long, drifting context window.

## Fixed inputs for every section
1. docs/TEACHING_STYLE.md
2. docs/LESSON_FORMAT.md
3. curriculum/curriculum.json (this section's entry and the full plan for context)
4. content/_registry/concepts.json (everything already taught, with definitions)
5. content/_registry/conventions.json (libraries, versions, banned patterns)
6. The previous section's SUMMARY.md
7. reference/ material for this section, if Sean provided any (see rules below)

Nothing else. If something important isn't in these files, it gets added to them,
not remembered from a previous chat.

## Steps
1. **Brief**: write the section's BRIEF.md. It covers lesson objectives; concepts introduced
   vs. assumed (every assumed concept must already exist in concepts.json, or it's flagged
   as a gap); exercises planned per lesson; the checkpoint checklist. STOP and wait for
   Sean to approve.
2. **Write lessons one at a time.** Each lesson is written with only the fixed inputs, the
   approved BRIEF.md, and the previous lesson in this section.
3. **Validate**: `npm run validate -- <section>`. Must pass with zero errors. See checks below.
4. **Independent review**: run the `lesson-reviewer` subagent with fresh context. It fact-checks
   claims against official docs, checks consistency with concepts.json and conventions.json,
   and checks the teaching style. Findings go in REVIEW.md. Fix every must-fix item, then
   re-validate.
5. **Unverifiable claims**: any claim the reviewer can't confirm against an official source is
   either removed or listed in the lesson's `unverified_claims`, as the exact quote from the
   lesson plus what to check and where (format in LESSON_FORMAT.md). The site underlines each
   quote in place and lists them in a "verify this" note. Nothing uncertain is presented as fact.
6. **Close the section**: add new concepts to concepts.json, write SUMMARY.md (what was
   taught, exact terms and conventions used), then commit.

## What the validator checks
- Front matter and JSON files match LESSON_FORMAT.md.
- Every lesson in the section exists, with ids and titles matching curriculum.json.
- Every ```python run / ```sql run block executes without error. Python runs in Pyodide
  (Node), the same runtime as the browser. SQL runs in PGlite.
- Every ```python broken block fails.
- For each exercise: starter FAILS the tests, solution PASSES, in Pyodide. Tests also pass
  against the solution under real pytest in CPython.
- Bug hunts: the buggy starter fails, the fix passes.
- Every quiz answer index is valid, and every option has an explanation.
- `packages` only lists packages that load in Pyodide.
- Concept order: every concept in `concepts_used` is introduced in an earlier lesson or
  in this one. A concept used before it's taught is an error.
- Conventions: no banned imports or patterns (e.g. python-jose, passlib, requests in
  async lessons, SQLAlchemy 1.x query style).
- Every `unverified_claims` quote appears word for word in the lesson's prose.
- No comparisons to Java: the word "Java" doesn't appear in lesson text (TEACHING_STYLE.md).

## reference/ rules
reference/ holds material Sean already has access to (course notes, outlines, examples).
It is gitignored and never published.
- Use it only to check COVERAGE and the QUALITY BAR: did backpy's lesson cover what a good
  course covers, at least as well?
- Never copy, paraphrase, or retell it. Sean already has it. backpy lessons are original,
  written for him, with his examples and his learning method.
- If a reference covers something the lesson missed, add it to the lesson in original words.
