---
id: 5
title: "Shell basics: navigating, files, permissions"
section: "Terminal & Linux"
sources: ["BD 2"]
concepts_introduced: [shell, command-options, working-directory, absolute-path, relative-path, hidden-file, file-permissions, sudo]
concepts_used: [shell, command-options, working-directory, absolute-path, relative-path, hidden-file, file-permissions, sudo, python-function, python-list, python-string-methods, python-if, python-for-loop]
explain_back: "What's the difference between an absolute and a relative path, and when would a relative path send a command to the wrong place?"
unverified_claims: []
---
## Why this matters

Backend work happens in a terminal. The servers PokeTeam will run on are Linux machines with no
mouse and no windows: you start the app, read its logs, and fix problems by typing commands.
Git, uv and Docker are all driven from the terminal too. This lesson covers the moves you'll use
every day: knowing where you are, moving around, handling files, and controlling who can read
them.

## The concept

### Get a Linux terminal

You'll use **Ubuntu**, a popular version of Linux, running inside Windows through WSL (Windows
Subsystem for Linux). It's real Linux, the same as on a server.

1. Right-click PowerShell, choose **Run as administrator**, and run
   `wsl --install -d Ubuntu`.
2. When Ubuntu starts, pick a username and a password. As you type the password, nothing
   appears on screen. That's normal: it's still being typed.
3. From now on, open **Ubuntu** from the dropdown arrow in Windows Terminal.

A **terminal** is the window you type into. The **shell** is the program inside it that reads
your commands and runs them. Ubuntu's shell is called **bash**.

### Reading a command

The shell shows a prompt, then waits:

```text
sean@laptop:~$
```

That's your username, the computer's name, and where you are (`~` means your home folder).
Every command has the same shape:

```bash
ls -l poketeam
```

1. `ls` is the **command**: what to do (list files).
2. `-l` is an **option** (also called a flag): how to do it (the long, detailed list). Options
   start with `-`, and short ones combine: `-la` means `-l` plus `-a`.
3. `poketeam` is the **argument**: what to do it to.

Two keys save hours. **Tab** finishes a file or folder name for you. The **up arrow** brings back
your last commands, and **Ctrl+R** searches them. To learn a command's options, run
`ls --help`.

### Check yourself

- [In `ls -l poketeam`, which part is the option, and which is the argument?](#reading-a-command)

### Where you are: paths

The shell always has a **working directory**: the folder you're standing in. `pwd` (print
working directory) shows it, and `cd` (change directory) moves you:

```bash
pwd              # /home/sean
cd poketeam
pwd              # /home/sean/poketeam
cd ..
pwd              # /home/sean
```

A **path** says where a file or folder is. There are two kinds:

- An **absolute path** starts with `/`, the top of the whole file system. `/home/sean/poketeam`
  means the same place wherever you are.
- A **relative path** starts from your working directory. `poketeam/app` only means
  `/home/sean/poketeam/app` while you're standing in `/home/sean`.

Three shortcuts: `.` is the folder you're in, `..` is the folder above it, and `~` is your home
folder (`/home/sean`). Plain `cd`, with nothing after it, takes you home.

Paths work like directions on a mall map. An absolute path is directions from the main entrance:
they work wherever you are. A relative path is directions from the "You are here" dot, and `..`
is "back out to the corridor". Where that stops matching: the dot only moves when you `cd`.
Looking around with `ls` never moves you.

### Check yourself

- [What does `pwd` tell you?](#where-you-are-paths)
- [Which of `/var/log` and `app/main.py` means the same place wherever you are?](#where-you-are-paths)

### Working with files

| Command | What it does |
|---|---|
| `ls` | list what's here (`-l` for details, `-a` to include hidden files) |
| `mkdir app` | make a folder (`mkdir -p a/b/c` makes the folders in between too) |
| `touch notes.txt` | make an empty file |
| `cp a.txt b.txt` | copy a file (`cp -r` for a folder) |
| `mv old.txt new.txt` | move or rename |
| `cat notes.txt` | print a file |
| `less app.log` | page through a long file (`q` to quit) |
| `rm notes.txt` | delete a file (`rm -r` for a folder) |

`rm` deletes straight away. There's no recycle bin and no undo: it's a shredder. Where that stops
matching: a shredder shows you each page going in, but `rm -r` deletes a whole folder of files
you never see.

`cp` and `mv` don't ask before replacing a file that already has the target name, either. Add
`-i` and they'll ask first.

`*` matches any characters in a name: `ls *.py` lists every Python file here, and `rm *.log`
deletes every log file here.

A **hidden file** is one whose name starts with a dot, like `.env` or `.gitignore`. Settings and
secrets live in files like these, and plain `ls` leaves them out so they don't clutter the list.
`ls -a` shows them, along with `.` and `..`.

Linux names are case-sensitive: `Main.py` and `main.py` are two different files. Names with
spaces need quotes: `cd "My Teams"`.

### Check yourself

- [How do you see `.env` in a folder listing?](#working-with-files)
- [You `rm` a file by mistake. Where do you get it back from?](#working-with-files)

### Permissions

Every file has an owner, and every action needs permission. `ls -la` shows them (the `.` and `..`
rows are left out here):

```text
-rw------- 1 sean sean   31 Oct  6 10:14 .env
drwxr-xr-x 2 sean sean 4096 Oct  6 10:12 app
-rw-r--r-- 1 sean sean   52 Oct  6 10:12 main.py
```

The two names are the file's owner and its group. On Ubuntu each user gets a group with their own
name, which is why you see `sean sean`. Read the first column in four parts:

1. The first character: `-` is a file, `d` is a folder (a directory).
2. The next three are for the **owner**.
3. Then three for anyone in the file's **group**.
4. Then three for **everyone else**.

In each set of three, `r` means read, `w` means write (change it), and `x` means execute: run it
as a program, or, for a folder, go into it. A `-` means no. So `.env` above is `rw-` for its owner
and nothing for anyone else.

`chmod` (change mode) changes them:

- `chmod +x deploy.sh` makes a script (a file of commands) runnable.
- `chmod 600 .env` means only the owner can read and write it. Each digit is one set, adding
  read 4, write 2 and execute 1: `6` is `rw-` (4 + 2) and `0` is `---`. `755` is `rwxr-xr-x`.

`sudo` runs one command as the **superuser**, called root, who can do anything to any file. (Root
also names the top folder, `/`: same word, two meanings.) `sudo` asks for your password. You need
it to install software with apt, Ubuntu's installer (`sudo apt install tree`), not for your own
files.

Permissions are house keys: the owner, the household (group), and visitors (everyone else). Each
can look (read), change things (write), and go into a room or run a program (execute). `sudo` is
the building manager's master key. Where that stops matching: "visitors" includes every program
running as another user, not just people.

### Check yourself

- [What does `-rw-r-----` let the group do?](#permissions)
- [Why `chmod 600` a file of passwords?](#permissions)

## Worked example

Setting up a practice copy of PokeTeam's folders, starting from home:

```bash
cd ~
mkdir -p poketeam/app poketeam/tests
cd poketeam
touch app/main.py .env
chmod 600 .env
ls
ls -la
```

The last two commands print:

```text
app  tests
total 16
drwxr-xr-x 4 sean sean 4096 Oct  6 10:12 .
drwxr-x--- 9 sean sean 4096 Oct  6 10:12 ..
-rw------- 1 sean sean    0 Oct  6 10:12 .env
drwxr-xr-x 2 sean sean 4096 Oct  6 10:12 app
drwxr-xr-x 2 sean sean 4096 Oct  6 10:12 tests
```

Plain `ls` hides `.env`, `ls -la` shows it, and only `sean` can read or change it. Your sizes and
dates will differ, and on some setups new folders also give the group write permission
(`drwxrwxr-x`). Your group is just you, so that's fine.

## What breaks

**Running a command from the wrong folder.** `rm -r app` deletes the `app` folder in your working
directory, whichever one that is, and `rm -r *` deletes everything in it. Before anything that
deletes or overwrites, run `pwd`. When it matters, use an absolute path.

**Reaching for `sudo` when you see "Permission denied".** It usually means you're in the wrong
place or the file belongs to someone else. `sudo` hides the real problem, and can leave files
owned by root that your own programs can't touch.

**`chmod 777`.** It gives everyone every permission, which makes the error go away and the file
unsafe. Give the smallest permission that works.

**Interrupting a big copy or delete.** Ask: **If this fails halfway, what state is left behind?**
A `cp -r` or `rm -r` stopped with Ctrl+C leaves some files done and some not, with no undo.

**Windows files are slower from Linux.** Your Windows drive appears at `/mnt/c`, but keep projects
in your Linux home folder (`~`), where tools run much faster.

## Check yourself

- [You're in `/home/sean/poketeam`. Where does `cd ../backups` take you?](#where-you-are-paths)
- [What do `-l` and `-a` change about `ls`?](#working-with-files)
- [What does `chmod +x deploy.sh` let you do?](#permissions)
- ["Permission denied." Why not just add `sudo`?](#what-breaks)
