Paste this into Claude Code from the repo root, in plan mode (Shift+Tab):

---
Read CLAUDE.md, then every file in docs/, then curriculum/curriculum.json.

We're building backpy v1 as described in docs/BUILD_PLAN.md. Before any code:
1. Ask me about anything in the docs that's ambiguous or contradictory.
2. Propose the project structure, every library with its exact version, and how the browser
   and the Node validator will share the same Pyodide and PGlite versions.
3. Lay out milestones 1-11 with, for each one, what I'll see in the browser and which test
   proves it works.

Don't write code until I approve the plan. Then build one milestone at a time and stop after
each one so I can check it.
---

After v1 is built, generate content one section at a time with:
  /generate-section 01-orientation
