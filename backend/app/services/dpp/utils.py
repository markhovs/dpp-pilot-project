"""Utility functions for DPP processing."""
from typing import Any


def clean_nulls(obj: Any) -> Any:
    """
    Recursively remove null/None values from dictionaries and lists.

    Args:
        obj: The object to clean (dict, list, or primitive value)

    Returns:
        The cleaned object with null/None values removed
    """
    if isinstance(obj, dict):
        return {
            key: clean_nulls(value) for key, value in obj.items() if value is not None
        }
    elif isinstance(obj, list):
        return [clean_nulls(item) for item in obj if item is not None]
    else:
        return obj
