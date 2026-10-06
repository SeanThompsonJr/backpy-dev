# Teaching style: how every backpy lesson teaches

## The learner
- Sean: self-taught Python backend developer.
- Never compare to Java or any other language Sean isn't using now. He used Java long ago
  and doesn't remember its concepts, so a comparison adds a second thing to decode.
  Teach every concept on its own terms, in Python (and SQL where SQL is the topic).
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
- Condensed, but never at the cost of understanding. Cut repetition and restatement, not
  ideas or examples. If cutting something would leave Sean understanding the topic less,
  keep it: actually learning beats a short lesson.
- Readable at a glance: short sentences, one idea each, plain words. Prefer a numbered list
  or a small example over a long paragraph. If a sentence needs rereading, split it.
- Word level grows with the course. Early lessons use everyday words and explain every
  technical term in plain words the first time. Once a term has been taught and used, later
  lessons use it freely, and the writing gets more technical as Sean does.
- No long stretch without interaction. A lesson that covers several main ideas gets a short
  Check yourself after each one, not just at the end (LESSON_FORMAT.md).
- Modern practice only (2026). Library and version rules live in content/_registry/conventions.json.
- Stay on topic. Every code block and exercise serves this lesson's concept. Use SQL only in
  lessons where SQL is the subject or genuinely part of the concept (e.g. a data-layer lesson),
  never as a side preview in a Python lesson. The same goes for any other tool or language.

## Make it memorable
Every concept is tied to an everyday situation Sean can replay in his head.
- **Only situations nearly everyone has lived through** qualify: ordering food, a phone's
  contact list, waiting in line, a coat check, mailing a package, a library. If many people
  have never experienced it, don't use it. Prefer everyday life over computer-science metaphors.
- **Pick the best picture for each concept.** Don't force one analogy onto everything.
- **Orientation (lessons 1–4) uses ordering at a restaurant** for the request–response cycle.
  It came from Sean as an example of how he already thinks about it. Later lessons may come
  back to it when it genuinely fits, but they don't have to, and they shouldn't strain to.
  What it established:
  | Restaurant | Backend |
  |---|---|
  | Customer | Client (whatever sends the request) |
  | Server (the waiter) | The backend server: takes the order, checks it, carries it to the kitchen, brings the plate back |
  | Kitchen | Database: where the food is stored and prepared; customers never walk in |
  | Menu | The API: the things you're allowed to order, and how to ask |
  | Order ticket | The request (what you want and the details) |
  | The plate brought back | The response |
  | "We're out of that" / "Your order's filled in wrong" | 404 / 400 or 422 |
  When a later lesson does reuse it, each piece keeps the meaning above.
- **Analogies are for thinking, not for answering.** Explain-back questions, checkpoints and
  quizzes never ask Sean to use an analogy. He explains in his own words, his own way.
- **Say where the analogy stops working**, in one sentence, so it never misleads (e.g. a real
  server handles thousands of customers at once).
- **One concept, one picture.** If concepts.json already gives a concept an analogy, reuse it
  for that concept. Record the analogy for every new concept in concepts.json.

## Exercises
- **Bug hunts wherever possible.** If the concept has a common mistake, at least one exercise
  is a bug hunt that plants that mistake. Real jobs are mostly reading and fixing code.
- **Every exercise is a scenario.** Its instructions.md (shown on the left when Sean opens the
  exercise) sets up a realistic PokeTeam situation: what's being built, or what a user
  reported and what should happen instead. A bug hunt describes the symptom, never the cause.
- Plain `code` exercises are for when there's nothing natural to break: building something new.
- **Instructions must be obvious.** Sean should know exactly what to do after 20 seconds of
  reading. Use the fixed shape in LESSON_FORMAT.md (The situation, Your task, Example,
  Done when): numbered steps, exact names, a concrete example, and a done-when list that
  matches the tests one to one.
- **Never hide an expected output.** If something should happen when a value is False (or
  empty, or missing), the example shows that output too, not just the True case.
- **The Example never answers the exercise.** It shows what every kind of output looks like,
  so Sean knows the format. But when the answer itself is a value (which side, which order,
  which status), demonstrate each kind of output with inputs the task isn't about. Write
  Done when as the behaviour ("jobs that protect players run on the backend"), not the answer
  for each input.

## Five questions (reuse them everywhere)
When a lesson discusses failure modes, frame them with these:
1. I opened something. Who closes it, even when something goes wrong?
2. Who can send this, and what's the worst thing they could send?
3. What if two of these happen at once, or it's old, or it takes forever?
4. What does my response or error reveal?
5. If this fails halfway, what state is left behind?
