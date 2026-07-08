from fastapi import APIRouter
from hiver_routing import CONTENT_PREFIXES

from app.api.router import api_router


def _served_prefixes(router: APIRouter) -> set[str]:
    prefixes: set[str] = set()
    for route in router.routes:
        path = getattr(route, "path", None)
        if not isinstance(path, str) or not path:
            continue
        first = path.strip("/").split("/", 1)[0]
        if first:
            prefixes.add(first)
    return prefixes


def test_served_prefixes_are_known_to_gateway() -> None:
    served = _served_prefixes(api_router)
    unknown = served - set(CONTENT_PREFIXES)
    assert not unknown, (
        f"Content serves prefixes absent from hiver-routing CONTENT_PREFIXES: {sorted(unknown)}. "
        "Add them to packages/routing-contract or the gateway will 404 these routes."
    )
