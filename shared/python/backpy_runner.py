"""Runs the learner's code as main.py, the way `python main.py` would.

Loaded into Pyodide by shared/pyodide-core.ts, in the browser worker and in the Node
validator alike. Tracebacks start at the learner's code: backpy's own frames are dropped.
"""

import builtins
import linecache
import sys
import traceback

FILENAME = "main.py"


def no_input(prompt=""):
    raise RuntimeError(
        "input() isn't available here: browser Python has no keyboard. "
        "Put the value in a variable instead."
    )


def user_traceback(exc, filenames=(FILENAME,)):
    """Format exc, skipping leading frames that aren't in the learner's files."""
    tb = exc.__traceback__
    while tb is not None and tb.tb_frame.f_code.co_filename not in filenames:
        tb = tb.tb_next
    return "".join(traceback.format_exception(type(exc), exc, tb))


def run(source):
    """Run source as a fresh main.py. Returns True if it finished without an exception."""
    linecache.cache[FILENAME] = (len(source), None, source.splitlines(True), FILENAME)
    namespace = {"__name__": "__main__", "__builtins__": builtins, "input": no_input}
    try:
        exec(compile(source, FILENAME, "exec"), namespace)
        return True
    except SystemExit as exc:
        # exit() and sys.exit() end the program; only a non-zero code counts as a failure.
        if exc.code in (None, 0):
            return True
        sys.stderr.write(f"Exited with code {exc.code}\n")
        return False
    except BaseException as exc:
        sys.stderr.write(user_traceback(exc))
        return False
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
