from datetime import UTC, datetime
from typing import Annotated

from pydantic import PlainSerializer


def serialize_naive_utc_datetime(value: datetime) -> str:
    """Serialize DB naive UTC datetimes as ISO-8601 with a Z suffix."""
    if value.tzinfo is not None:
        value = value.astimezone(UTC).replace(tzinfo=None)
    return f"{value.isoformat()}Z"


UtcDatetime = Annotated[datetime, PlainSerializer(serialize_naive_utc_datetime)]
