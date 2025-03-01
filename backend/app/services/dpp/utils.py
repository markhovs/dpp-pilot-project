"""Utility functions for DPP processing."""
from typing import Any


def clean_nulls(obj: Any, preserve_paths=None) -> Any:
    """
    Recursively remove null/None values from dictionaries and lists.

    Args:
        obj: The object to clean (dict, list, or primitive value)
        preserve_paths: Set of dot-notation paths where nulls should be preserved
            Example: {"structure.components.0.BulkCount"}

    Returns:
        The cleaned object with null/None values removed
    """
    preserve_paths = preserve_paths or set()

    def _clean_nulls_with_path(obj, current_path=""):
        if isinstance(obj, dict):
            return {
                k: _clean_nulls_with_path(
                    v, f"{current_path}.{k}" if current_path else k
                )
                for k, v in obj.items()
                if v is not None
                or current_path in preserve_paths
                or f"{current_path}.{k}" in preserve_paths
            }
        elif isinstance(obj, list):
            return [
                _clean_nulls_with_path(item, f"{current_path}[{i}]")
                for i, item in enumerate(obj)
                if item is not None or f"{current_path}[{i}]" in preserve_paths
            ]
        else:
            return obj

    return _clean_nulls_with_path(obj)
