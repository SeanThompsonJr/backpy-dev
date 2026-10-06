# Build plan

## v1 scope (build this, nothing more)
Each milestone ends with something visible in the browser and a test that proves it works.

1. **Scaffold + curriculum map**: Vite/React/TS app; home page renders all tiers, sections,
   and lessons from curriculum/curriculum.json, with coverage and optional tags.
2. **Fixture lesson**: create one complete example lesson in content/_fixtures/ that uses every
   feature of LESSON_FORMAT.md (run blocks, broken blocks, quiz, code exercise, bug hunt,
   sql exercise, hints). It's used to build and test the UI before real content exists.
3. **Lesson page layout**: lesson text on the left, editor and output on the right
   (like Boot.dev). Opening an exercise switches the left side to that exercise's scenario
   (instructions.md), with a way back to the lesson. Unverified claims are underlined in place
   and listed in a "verify this" note. Responsive: stacked on narrow screens. On wide screens
   the editor side can be hidden to a slim rail (Show editor, Run, Submit, last result) so the
   lesson gets the full width while Sean codes in VS Code; the choice is remembered.
   Each Check yourself question jumps to the part of the lesson its answer is in (added
   during milestone 11 at Sean's request); long lessons have checks partway through.
4. **Python runtime**: Pyodide in a Web Worker. Run button (and Ctrl+Enter / Cmd+Enter in the
   editor), stdout/stderr output, timeout that kills a runaway loop, reset-to-starter button.
5. **Exercise grading + learning loop**: hidden tests run in the worker. A failed test shows
   its concept message. Hint 1, then hint 2. Solution unlocks after 2 failed runs, with its
   explanation. Bug hunts reveal `bug_description` after solving. Explain-back box at the end.
5b. **VS Code folder sync**: an "Edit in VS Code" button on browser exercises (Chrome/Edge,
    File System Access API, no backend). The first time, Sean picks a local folder; the site
    writes the starter there as `<lesson>/<exercise>/main.py` (never the hidden tests), watches
    the file, and mirrors his edits into the browser editor within about a second. Submit,
    hints, and the solution unlock work exactly as in the browser. Grading stays in Pyodide.
    After Sean pastes the folder's full path once, the button also opens VS Code at the file
    (vscode:// link; the browser asks permission). The folder can be changed at any time.
6. **Quizzes**: one question at a time; an explanation for whichever option was picked.
7. **SQL runtime**: PGlite with seed.sql; query results shown as a table; SQL exercises graded.
8. **Progress**: localStorage (lessons completed, exercise attempts, quiz scores, explain-back
   answers). Export/import JSON. All sections unlocked.
9. **Copy to Claude**: one button copies the lesson title, the concept, Sean's code, the last
   error, and his explain-back answer, plus these rules, into one prompt:
   "Tutor me. Give direction and the concept, not the answer. Let me attempt. Correct my
   thinking, not my code. Only give the answer after I've tried twice."
10. **Validation pipeline**: `npm run validate` implementing every check in
    GENERATION_PIPELINE.md, running in Node with the same Pyodide and PGlite versions as the site.
    Runs in GitHub Actions on every push.
11. **Generation tooling**: the `/generate-section` command and the `lesson-reviewer` subagent
    work end to end. Then generate Section 1 (Orientation) for real.

## Phase 2 (later, not v1)
- **backpy CLI (IDE sync)**: `backpy pull <lesson>` copies an exercise into a local folder for
  your own IDE; `backpy check <lesson>` runs its tests with pytest and writes the result to
  a file the locally served site reads, so local passes show up as progress. Needed from
  Tier 2 (FastAPI, Docker, Git checkpoints).
- Deploy as a static site if studying on other devices.
