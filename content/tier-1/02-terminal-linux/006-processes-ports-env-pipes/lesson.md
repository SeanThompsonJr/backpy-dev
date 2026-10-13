---
id: 6
title: "Processes, ports, environment variables, pipes"
section: "Terminal & Linux"
sources: ["BD 2"]
concepts_introduced: [process, port, localhost, environment-variable, path-variable, standard-streams, redirection, pipe]
concepts_used: [process, port, localhost, environment-variable, path-variable, standard-streams, redirection, pipe, shell, ip-address, server, status-code, python-import, python-dict, python-types, python-if, python-function, python-string-methods]
explain_back: "Why do servers read their settings from environment variables instead of having them written in the code?"
unverified_claims: []
---
## Why this matters

When PokeTeam runs, it's a process, listening on a port, configured by environment variables,
writing logs you'll search with pipes. Every backend runs this way, on your laptop and on a
server. When something's wrong in production (the live app real players use), these are the
first things you check: is it running, is it on the right port, does it have the right
settings, and what do the logs say?

## The concept

### Processes

A program is a file on disk. A **process** is that program running. Every process gets a number,
its **PID** (process ID). Run the same program twice and you get two processes, each with its
own PID.

A program and a process are a recipe and the meal being cooked. One recipe, cooked twice at the
same time, makes two meals. Where that stops matching: you can stop a process at any moment, and
anything it hadn't saved yet is simply gone.

A server you start in the terminal keeps running, and keeps the terminal busy, until you stop it:

- **Ctrl+C** stops whatever is running in this terminal.
- `ps aux` lists every running process. `pgrep -a python` finds just the Python ones, with their
  PIDs.
- `kill 2417` asks process 2417 to stop. `kill -9 2417` forces it, with no chance to clean up,
  so it's the last resort.

### Check yourself

- [What's the difference between a program and a process?](#processes)
- [How do you stop a server running in your terminal?](#processes)

### Ports

One computer can run many servers at once. The IP address (lesson 2) gets a request to the right
computer. A **port**, a number from 0 to 65535, gets it to the right program on that computer.

- Some are standard: `80` for HTTP, `443` for HTTPS, `5432` for Postgres.
- Ports below 1024 need root to use, so development servers pick higher ones. `8000` is the
  usual choice, and FastAPI's `fastapi dev` command serves on it by default.

**`localhost`** (the address `127.0.0.1`) means "this computer". A request to
`http://localhost:8000` never leaves your machine. It goes to whatever program is listening on
port 8000. With WSL, a browser in Windows can reach a server running in Ubuntu this way.

If the IP address is a building's street address, the port is the apartment number. Where that
stops matching: only one program can listen on a port at a time. Start a second one and it fails
with **"Address already in use"**. `ss -ltnp` lists the ports being listened on, with the process
behind each one (add `sudo` to see other users' processes too).

### Check yourself

- [What does `localhost:8000` point at?](#ports)
- [What does "Address already in use" tell you?](#ports)

### Environment variables

An **environment variable** is a named value a process gets when it starts, like
`HOME=/home/sean`. Every program you start from this terminal gets a copy of the exported ones:

```bash
echo $HOME                         # read one: /home/sean
export POKETEAM_MODE=dev           # set one, and hand it to every program started from here
POKETEAM_MODE=test python3 app.py  # set one for this one program only
env                                # list them all
```

Without `export`, `POKETEAM_MODE=dev` on its own line stays inside the shell, and programs never
see it.

Backends use them for anything that changes between machines, like the port, debug mode or the
database address. They also hold secrets, like passwords and API keys. That way the same code
runs on your laptop and on the server with different settings, and secrets never sit in the code.
While developing, they're often kept in a `.env` file the app reads when it starts.

Environment variables are sticky notes on the fridge: anything started from this terminal can read
the ones you've put up with `export`. Where that stops matching: a program gets a copy of the
notes when it starts, so changing them later doesn't reach a program that's already running.

One of them, **`PATH`**, is the list of folders the shell searches, in order, when you type a
command. `which python3` shows where it found one (`/usr/bin/python3`). If no folder on the list
has it, you get "command not found". It's the list of drawers you check, in order, when you're
looking for the scissors. Where that stops matching: a program in the folder you're in isn't
found by name, even right in front of you. You run it as `./deploy.sh`.

In Python, environment variables are in `os.environ`, which works like a dict:

```python run
import os

os.environ["PORT"] = "8000"   # what `export PORT=8000` does for a program
port = os.environ["PORT"]
print(port, type(port))
print(os.environ.get("POKETEAM_MODE", "development"))
```

Every value is a string, even one that looks like a number.

### Check yourself

- [Why keep a database password in an environment variable instead of the code?](#environment-variables)
- [What does "command not found" usually mean?](#environment-variables)

### Streams, redirection and pipes

Every process has three **standard streams**: **stdin** (what it reads), **stdout** (its normal
output) and **stderr** (its errors and messages). In a terminal, stdout and stderr both show
on screen.

**Redirection** sends a stream somewhere else:

| You type | What happens |
|---|---|
| `echo "PORT=8000" > .env` | stdout goes into `.env`, replacing what was there |
| `echo "DEBUG=false" >> .env` | stdout is added to the end of `.env` |
| `python3 server.py 2> errors.log` | stderr goes into `errors.log` |
| `python3 server.py > all.log 2>&1` | both streams go into `all.log` |

A **pipe**, `|`, sends one command's stdout into the next command's stdin. Small tools chain into
bigger jobs:

- `grep ERROR app.log` keeps only the lines that contain `ERROR`.
- `wc -l` counts lines, and `head -n 5` / `tail -n 5` keep the first or last five.
- `tail -f app.log` keeps printing new lines as they're added (Ctrl+C to stop).

So `grep ERROR app.log | wc -l` counts the error lines in a log.

A pipe is a car wash: each station does one job and passes the car on. Where that stops matching:
a station can throw cars away (`grep` drops lines) or turn them all into a single number
(`wc -l`).

Quotes matter on these command lines. Single quotes keep everything exactly as you typed it.
Double quotes still swap in `$VARIABLES`. Use single quotes around text that has double quotes
inside, like Python code: `python3 -c 'print("PokeTeam")'`.

### Check yourself

- [What's the difference between `>` and `>>`?](#streams-redirection-and-pipes)
- [What does `grep ERROR app.log | wc -l` print?](#streams-redirection-and-pipes)

## Worked example

Running a tiny server and reading its log. In the first Ubuntu tab, make a folder for it so it
only shares what you mean it to:

```bash
mkdir -p ~/site && cd ~/site
echo "<h1>PokeTeam</h1>" > index.html
python3 -m http.server 8000 --bind 127.0.0.1 2> server.log
```

Python's built-in server serves the folder it starts in. `--bind 127.0.0.1` keeps it reachable
only from this computer, and it writes a line to stderr for every request, so `2>` sends its log
to `server.log`. Open `http://localhost:8000` and `http://localhost:8000/missing` in your browser.
Then, in a second Ubuntu tab:

```bash
ss -ltnp | grep 8000
grep '" 404' ~/site/server.log | wc -l
```

The first command shows `python3` listening on port 8000, with its PID. The second counts the
requests that got a `404`: `/missing`, and probably `/favicon.ico` too (the tab icon browsers
ask for on their own). Back in the first tab, Ctrl+C stops the server, and port 8000 is free
again.

## What breaks

**A forgotten server.** Ask: **I opened something. Who closes it, even when something goes
wrong?** A server left running in another tab still holds its port, so the next start fails with
"Address already in use". Find it with `ss -ltnp` and stop it with `kill`.

**Treating a value as a number.** Environment variables are always strings:

```python broken TypeError
import os

os.environ["PORT"] = "8000"
print(os.environ["PORT"] + 1)
```

You can't add a number to text. Convert it first.

**Treating a value as a yes or no.** `bool()` of any non-empty string is `True`, whatever the
string says, so `bool("false")` is `True`. A setting like `DEBUG=false` has to be read as text.

**Forgetting `export`.** `POKETEAM_MODE=dev` on its own line sets it for the shell only. A program
started afterwards doesn't see it.

**`>` when you meant `>>`.** `echo "DEBUG=false" > .env` wipes every other line in `.env`.

**Committing `.env`.** Committing saves files into Git, the project's shared history (section
3). Once `.env` is in there, anyone who can see the repository can read every secret in it. List
`.env` in `.gitignore`, the file that tells Git what to leave out, and if a secret ever does get
committed, change it.

**Settings that vanish.** `export` only lasts until this terminal closes. To keep one, add the
`export` line to `~/.bashrc`, which runs in every new terminal, or put it in the project's `.env`.

**`python` versus `python3`.** Ubuntu's Python is called `python3`. Plain `python` usually
gives "command not found": no folder on `PATH` has a program by exactly that name. Type
`python3`, or use `uv run` (lesson 7).

## Check yourself

- [Port 8000 is already in use. How do you find out which process has it?](#ports)
- [You `export DEBUG=true` after starting the server. Does the server see it?](#environment-variables)
- [Why did the worked example need `2>` to save the server's log?](#worked-example)
- [What goes wrong if `.env` is committed?](#what-breaks)
