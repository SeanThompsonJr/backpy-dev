# backpy

A personal, Boot.dev-style learning site that takes Sean from zero to professional
Python backend developer. Single user, personal use only, no backend.

## Read these before any task
- docs/TEACHING_STYLE.md: who the learner is and how every lesson must teach
- docs/LESSON_FORMAT.md: the content format. The site and all lessons depend on it
- docs/GENERATION_PIPELINE.md: how lesson content is generated and verified
- docs/BUILD_PLAN.md: what v1 includes, and in what order
- curriculum/curriculum.json: the 124-lesson plan (source of truth for order and titles)

## Stack (v1)
- React + Vite + TypeScript, static site, no backend
- CodeMirror 6 for the editor
- Pyodide in a Web Worker for Python (so a runaway loop can be killed)
- PGlite (Postgres in WebAssembly) for SQL exercises
- Markdown rendering with syntax highlighting
- Progress in localStorage, with JSON export/import
- Node scripts for content validation, using the SAME Pyodide and PGlite runtimes as the browser

## Rules
- Plan before code. Show the plan and wait for approval.
- One milestone at a time. Each milestone ends with something visible in the browser
  and a test that proves it works. Run the tests and paste the result before saying "done".
- Don't add features that aren't in docs/BUILD_PLAN.md. Suggest them, don't build them.
- Never edit files in reference/. It is read-only example material.
- Never copy or paraphrase text from reference/ into lessons (see GENERATION_PIPELINE.md).
- Lesson content changes must pass `npm run validate` before they're committed.
