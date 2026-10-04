Generate backpy section: $ARGUMENTS

Follow docs/GENERATION_PIPELINE.md exactly.

1. Read ONLY the fixed inputs listed in that file, plus this section's reference/ material
   if it exists.
2. Write BRIEF.md for this section. Then STOP and show it to me. Do not write lessons until I
   approve the brief.
3. After approval, write lessons one at a time. Run `npm run validate -- <section>` after each
   lesson and fix every error before starting the next one.
4. When all lessons pass, run `npm run validate -- <section> --complete` (missing lessons and
   checkpoint.md become errors) and fix everything. Then run the lesson-reviewer subagent on the whole section. Put its
   findings in REVIEW.md, fix every must-fix item, and re-validate.
5. Update concepts.json, write SUMMARY.md, and show me: the lessons created, the validator
   output, the review findings and how each was resolved, and any unverified claims.
6. Commit only after I confirm.
