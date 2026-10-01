# Teaching style: how every backpy lesson teaches

## The learner
- Sean: self-taught Python backend developer. Prior Java/Spring Boot background
  (use Java comparisons when they genuinely help; treat Python as a context switch, not a restart).
- Learns best by example and by doing: show the real thing, then make him do it.
- Running project: PokeTeam Builder (a FastAPI app for building Pokémon teams).
  Use Pokémon/PokeTeam examples in worked examples and exercises where natural. Don't force it.
- Goal: junior backend job and freelance work. Every lesson says why this matters on the job.

## The learning method (non-negotiable)
Lessons follow Sean's tutoring loop. The site enforces it; lessons must be written for it:
1. **Direction**: the lesson teaches the concept and shows a worked example. It does not give
   away the exercise answer.
2. **Attempt**: Sean writes code in the editor.
3. **Correct the thinking**: when a test fails, the hint explains which idea is wrong,
   not what code to type. Hint 1 points at the concept; hint 2 names the likely mistake
   in his reasoning.
4. **Try again**.
5. **Answer**: the solution unlocks only after 2 failed runs, with an explanation of why it works.
6. **Explain back**: each lesson ends with one question he answers in his own words.

Research basis: in Anthropic's 2026 randomized study, learners who used AI for conceptual
questions kept their understanding; learners who delegated code writing scored far lower.
backpy uses AI to explain, never to do the exercise for him.

## Lesson voice
- Plain language. Define a term the first time it appears.
- Concept first, then a worked example, then "what breaks": the common mistakes and what
  they look like when they happen.
- Every lesson answers: what is it, why does it exist, when would I use it on the job,
  what goes wrong.
- Short sections. No filler, no motivational padding.
- Modern practice only (2026). Library and version rules live in content/_registry/conventions.json.

## Five questions (reuse them everywhere)
When a lesson discusses failure modes, frame them with these:
1. I opened something. Who closes it, even when something goes wrong?
2. Who can send this, and what's the worst thing they could send?
3. What if two of these happen at once, or it's old, or it takes forever?
4. What does my response or error reveal?
5. If this fails halfway, what state is left behind?
