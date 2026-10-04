"""A small pytest-compatible test runner for exercises.

Runs a tests.py (plain `test_*` functions using assert, plus the `capsys` fixture) against
the learner's main.py, and reports each test as pytest would: passed, failed, or error.
tests/unit/test-runner.test.ts checks that its outcomes match real pytest in CPython.
"""

import ast
import importlib
import inspect
import io
import json
import linecache
import os
import sys
import types
from collections import namedtuple

from backpy_runner import user_traceback

WORKDIR = "/tmp/backpy-tests"
MAIN = os.path.join(WORKDIR, "main.py")
TESTS = "tests.py"

CaptureResult = namedtuple("CaptureResult", ["out", "err"])


class CaptureFixture:
    """The part of pytest's capsys fixture that exercises use."""

    def __init__(self, out, err):
        self._out = out
        self._err = err

    def readouterr(self):
        result = CaptureResult(self._out.getvalue(), self._err.getvalue())
        for buffer in (self._out, self._err):
            buffer.seek(0)
            buffer.truncate()
        return result


FIXTURES = {"capsys"}


def _clean(text):
    """Show the learner's file as main.py, not its path inside Pyodide."""
    return text.replace(MAIN, "main.py")


def _describe(exc):
    return _clean(user_traceback(exc, filenames=(MAIN, TESTS)))


def run_tests(main_source, tests_source):
    os.makedirs(WORKDIR, exist_ok=True)
    with open(MAIN, "w") as f:
        f.write(main_source)
    for name in ("main", "tests"):
        sys.modules.pop(name, None)
    importlib.invalidate_caches()
    linecache.clearcache()
    linecache.cache[TESTS] = (len(tests_source), None, tests_source.splitlines(True), TESTS)
    if sys.path[0] != WORKDIR:
        sys.path.insert(0, WORKDIR)

    module = types.ModuleType("tests")
    module.__file__ = TESTS
    collected_out, collected_err = io.StringIO(), io.StringIO()
    saved = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = collected_out, collected_err
    try:
        # Importing tests.py imports main.py; a failure here means nothing could be collected.
        try:
            exec(compile(tests_source, TESTS, "exec"), module.__dict__)
        except KeyboardInterrupt:
            raise
        except BaseException as exc:
            return {"collection_error": _describe(exc), "tests": [], "output": collected_out.getvalue()}

        results = []
        for name, fn in list(module.__dict__.items()):
            if not (name.startswith("test") and isinstance(fn, types.FunctionType)):
                continue
            params = list(inspect.signature(fn).parameters)
            missing = [p for p in params if p not in FIXTURES]
            if missing:
                results.append({"name": name, "outcome": "error", "message": f"fixture '{missing[0]}' not found"})
                continue

            out, err = io.StringIO(), io.StringIO()
            sys.stdout, sys.stderr = out, err
            kwargs = {"capsys": CaptureFixture(out, err)} if "capsys" in params else {}
            try:
                fn(**kwargs)
                results.append({"name": name, "outcome": "passed"})
            except AssertionError as exc:
                results.append({
                    "name": name,
                    "outcome": "failed",
                    "kind": "assertion",
                    "message": str(exc) or None,
                    "traceback": _describe(exc),
                })
            except KeyboardInterrupt:
                # A time limit stopped the tests (the Node validator); stop them all.
                raise
            except BaseException as exc:
                results.append({
                    "name": name,
                    "outcome": "failed",
                    "kind": "exception",
                    "message": f"{type(exc).__name__}: {exc}",
                    "traceback": _describe(exc),
                })
            finally:
                sys.stdout, sys.stderr = collected_out, collected_err
        return {"collection_error": None, "tests": results, "output": collected_out.getvalue()}
    finally:
        sys.stdout, sys.stderr = saved


def run_tests_json(main_source, tests_source):
    return json.dumps(run_tests(main_source, tests_source))


def asserts_without_message_json(tests_source):
    """Line numbers of asserts in tests.py that have no message. The message is Sean's hint."""
    tree = ast.parse(tests_source, filename=TESTS)
    lines = [node.lineno for node in ast.walk(tree) if isinstance(node, ast.Assert) and node.msg is None]
    return json.dumps(sorted(lines))
