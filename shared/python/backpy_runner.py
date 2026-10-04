"""Runs the learner's code as main.py, the way `python main.py` would.

Loaded into Pyodide by shared/pyodide-core.ts, in the browser worker and in the Node
validator alike. Tracebacks start at the learner's code: backpy's own frames are dropped.
"""

import builtins
import json
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
    except KeyboardInterrupt:
        # A time limit stopped the code (the Node validator); let the caller report it.
        raise
    except BaseException as exc:
        sys.stderr.write(user_traceback(exc))
        return False
    finally:
        sys.stdout.flush()
        sys.stderr.flush()


def run_lesson_blocks(blocks_json):
    """Runs a lesson's code blocks the way LESSON_FORMAT.md describes ("How code blocks run").

    `run` blocks share one namespace, in order, like notebook cells. A `broken` block runs on a
    copy of the namespace at that point. Returns, per block, whether it raised and what.
    """
    namespace = {"__name__": "__main__", "__builtins__": builtins, "input": no_input}
    results = []
    for i, block in enumerate(json.loads(blocks_json)):
        filename = f"<block {i + 1}>"
        source = block["code"]
        linecache.cache[filename] = (len(source), None, source.splitlines(True), filename)
        target = dict(namespace) if block["mode"] == "broken" else namespace
        try:
            exec(compile(source, filename, "exec"), target)
            results.append({"raised": None})
        except KeyboardInterrupt:
            raise
        except BaseException as exc:
            results.append({
                "raised": type(exc).__name__,
                "message": str(exc),
                "traceback": user_traceback(exc, filenames=(filename,)),
            })
    sys.stdout.flush()
    return json.dumps(results)
