## The situation

Before PokeTeam has any code, it needs a home on your machine.
You'll build a practice copy of its folders using nothing but the
terminal, then throw it away.

## Your task

Open **Ubuntu** in Windows Terminal, then run each step:

1. `cd ~` and `pwd`, to start from your home folder.
2. `mkdir -p practice/poketeam/app`. Then type `cd prac`, press Tab
   to finish the name, and add `/poketeam` before pressing Enter.
3. `touch app/main.py .env`, then compare `ls` with `ls -a`.
4. `chmod 600 .env`, then `ls -l .env`.
5. `cd app` and `pwd`. Then `cd ../..` and `pwd` again.
6. Still in `practice`, list the app folder by its absolute path, the
   first one `pwd` printed in step 5: `ls -la /home/<you>/practice/poketeam/app`.
7. `cd ~`, then `rm -r practice`, then `ls`.
8. Tick each item in the checklist when it's true.

## Example

After step 5, your two `pwd` lines look like this, with your own
username:

```text
/home/sean/practice/poketeam/app
/home/sean/practice
```
