"""The reported version matches the published one in pyproject.toml.

0.2.2 shipped to PyPI reporting __version__ = "0.1.0". This keeps the two together.
"""

import re
from pathlib import Path

import safeprompt_langchain
from safeprompt_langchain import client

PYPROJECT = Path(__file__).resolve().parent.parent / "pyproject.toml"


def _pyproject_version():
    match = re.search(r'^version\s*=\s*"([^"]+)"', PYPROJECT.read_text(), re.MULTILINE)
    assert match, "no version in pyproject.toml"
    return match.group(1)


def test_dunder_version_matches_pyproject():
    assert safeprompt_langchain.__version__ == _pyproject_version()


def test_user_agent_matches_pyproject():
    assert client._USER_AGENT == "safeprompt-langchain/" + _pyproject_version()
