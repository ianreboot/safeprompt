"""ValidationResult.from_dict: only a real boolean true is safe (SKY-1111)."""

import pytest

from safeprompt_langchain.types import ValidationResult


@pytest.mark.parametrize("value", [False, "false", "False", "true", "True", 1, 0, "1", "yes", None, [], {}, 1.0])
def test_anything_but_boolean_true_is_unsafe(value):
    assert ValidationResult.from_dict({"safe": value}).safe is False


def test_missing_safe_is_unsafe():
    assert ValidationResult.from_dict({}).safe is False


def test_boolean_true_is_safe():
    assert ValidationResult.from_dict({"safe": True}).safe is True
