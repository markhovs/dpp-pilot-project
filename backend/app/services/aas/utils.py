from datetime import datetime
from urllib.parse import urlparse

from basyx.aas.model.datatypes import (
    AnyURI,
    Boolean,
    Date,
    DateTime,
    Double,
    Float,
    Int,
    Long,
    UnsignedLong,
    trivial_cast,
)


def get_basyx_type(xsd_type: str):
    """Map XSD type strings to BaSyx types"""
    type_mapping = {
        "xs:string": str,
        "xs:integer": Int,
        "xs:long": Long,
        "xs:unsignedLong": UnsignedLong,
        "xs:double": Double,
        "xs:float": Float,
        "xs:boolean": Boolean,
        "xs:date": Date,
        "xs:dateTime": DateTime,
        "xs:anyURI": AnyURI,
    }
    return type_mapping.get(xsd_type)


def convert_value(value, expected_type):
    """Converts an input value into the correct XSD type before storing."""
    # Add null check at the start
    if value is None or value == "":
        if expected_type == AnyURI:
            return ""  # Return empty string for URLs instead of None
        return None

    # If we got a Python type instead of BaSyx type or XSD string
    if expected_type == int:
        expected_type = "xs:integer"
    elif expected_type == float:
        expected_type = "xs:float"
    elif expected_type == bool:
        expected_type = "xs:boolean"
    elif expected_type == str:
        expected_type = "xs:string"

    # If it's an XSD string type, convert to BaSyx type
    if isinstance(expected_type, str):
        basyx_type = get_basyx_type(expected_type)
        if not basyx_type:
            raise ValueError(f"Unhandled XSD type: {expected_type}")
        expected_type = basyx_type

    if expected_type == str:
        return str(value)  # Ensure it's a string

    elif expected_type == Long:
        try:
            return trivial_cast(int(value), Long)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert {value} to xs:long.")

    elif expected_type == Int:
        try:
            return trivial_cast(int(value), Int)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert {value} to xs:integer.")

    elif expected_type == UnsignedLong:
        try:
            # Add extra validation to ensure value is non-negative
            parsed_value = int(value)
            if parsed_value < 0:
                raise ValueError("UnsignedLong cannot be negative")
            return trivial_cast(parsed_value, UnsignedLong)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert {value} to xs:unsignedLong")

    elif expected_type == Float:
        try:
            return trivial_cast(float(value), Float)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert {value} to xs:float.")

    elif expected_type == Double:
        try:
            return trivial_cast(float(value), Double)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert {value} to xs:double.")

    elif expected_type == Boolean:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lower_val = value.lower()
            if lower_val in {"true", "1"}:
                return True
            if lower_val in {"false", "0"}:
                return False
        raise ValueError(f"Cannot convert {value} to xs:boolean.")

    elif expected_type == Date:
        try:
            # If already a datetime.date, cast it safely
            if isinstance(value, datetime):
                return trivial_cast(value.date(), Date)
            if isinstance(value, str):
                # Try different formats
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y"):
                    try:
                        return trivial_cast(datetime.strptime(value, fmt).date(), Date)
                    except ValueError:
                        continue
            raise ValueError
        except ValueError:
            raise ValueError(
                f"Cannot convert {value} to xs:date. Expected format: YYYY-MM-DD."
            )

    elif expected_type == DateTime:
        try:
            if isinstance(value, datetime):
                return trivial_cast(value, DateTime)
            if isinstance(value, str):
                for fmt in (
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%d %H:%M:%S",
                    "%d-%m-%Y %H:%M:%S",
                ):
                    try:
                        return trivial_cast(datetime.strptime(value, fmt), DateTime)
                    except ValueError:
                        continue
            raise ValueError
        except ValueError:
            raise ValueError(
                f"Cannot convert {value} to xs:dateTime. Expected format: YYYY-MM-DDTHH:MM:SS."
            )

    elif expected_type == AnyURI:
        try:
            parsed = urlparse(value)
            if parsed.scheme and parsed.netloc:
                return trivial_cast(value, AnyURI)
            raise ValueError
        except ValueError:
            raise ValueError(f"Cannot convert {value} to xs:anyURI.")

    else:
        raise TypeError(f"Unhandled XSD type: {expected_type}")
