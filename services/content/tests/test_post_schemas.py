import pytest
from pydantic import ValidationError

from app.schemas.post import POST_TITLE_MAX_LENGTH, PostCreate, PostUpdate

pytestmark = pytest.mark.anyio


def test_post_create_accepts_title_at_max_length() -> None:
    post = PostCreate(title="x" * POST_TITLE_MAX_LENGTH, community_id="c1")
    assert len(post.title) == POST_TITLE_MAX_LENGTH


def test_post_create_rejects_title_over_max_length() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="x" * (POST_TITLE_MAX_LENGTH + 1), community_id="c1")


def test_post_create_rejects_blank_title() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="   ", community_id="c1")


def test_post_update_rejects_title_over_max_length() -> None:
    with pytest.raises(ValidationError):
        PostUpdate(title="x" * (POST_TITLE_MAX_LENGTH + 1))
