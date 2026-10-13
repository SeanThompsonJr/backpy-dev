## The situation

Soon you'll run PokeTeam's server every day. Here you practise the
moves for when it won't start, using Python's tiny built-in server
instead.

## Your task

Use two Ubuntu tabs in Windows Terminal:

1. **Tab 1:** `mkdir -p ~/site && cd ~/site`, then
   `python3 -m http.server 8000 --bind 127.0.0.1`.
   Open `http://localhost:8000` in your browser.
2. **Tab 2:** `cd ~/site`, run the same `python3 -m http.server ...`
   line, and read the error.
3. **Tab 2:** `ss -ltnp | grep 8000` and find the first server's PID.
4. **Tab 1:** press Ctrl+C. Then run `ss -ltnp | grep 8000` again.
5. **Tab 1:** `export POKETEAM_MODE=dev`, then
   `python3 -c 'import os; print(os.environ["POKETEAM_MODE"])'`.
   Open a brand-new Ubuntu tab and run the same `python3 -c ...` line.
6. **Tab 1:** `echo "PORT=8000" > demo.env`, then
   `echo "DEBUG=false" >> demo.env`, then `cat demo.env`.
7. **Tab 1:** `ls ~ | wc -l`, then `rm demo.env`.
8. Tick each item in the checklist when it's true.

## Example

In step 2, the error ends with this line:

```text
OSError: [Errno 98] Address already in use
```

In step 3, the PID is the number after `pid=`, at the end of a line
like this one:

```text
LISTEN 0  5  127.0.0.1:8000  0.0.0.0:*  users:(("python3",pid=2417,fd=3))
```
