"""The reported version matches the published one in pyproject.toml.

1.4.0 shipped to PyPI reporting __version__ = "1.0.0". This keeps them together.
"""

import re
from pathlib import Path

import safeprompt
from safeprompt import SafePrompt, AsyncSafePrompt

PYPROJECT = Path(__file__).resolve().parent.parent / "pyproject.toml"


def _pyproject_version():
    match = re.search(r"^version\s*=\s*\"([^\"]+)\"", PYPROJECT.read_text(), re.MULTILINE)
    assert match, "no version in pyproject.toml"
    return match.group(1)


def test_dunder_version_matches_pyproject():
    assert safeprompt.__version__ == _pyproject_version()


def test_user_agents_match_pyproject():
    expected = "safeprompt-python/" + _pyproject_version()
    assert SafePrompt.USER_AGENT == expected
    assert AsyncSafePrompt.USER_AGENT == expected
