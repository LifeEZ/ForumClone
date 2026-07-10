import pytest
from pydantic import ValidationError

from app.schemas.post import (
    POST_CONTENT_MAX_LENGTH,
    POST_TITLE_MAX_LENGTH,
    PostCreate,
    PostUpdate,
)

pytestmark = pytest.mark.anyio


def test_post_create_accepts_title_at_max_length() -> None:
    post = PostCreate(title="x" * POST_TITLE_MAX_LENGTH)
    assert len(post.title) == POST_TITLE_MAX_LENGTH


def test_post_create_rejects_title_over_max_length() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="x" * (POST_TITLE_MAX_LENGTH + 1))


def test_post_create_rejects_blank_title() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="   ")


def test_post_create_accepts_content_at_max_length() -> None:
    post = PostCreate(title="t", content="y" * POST_CONTENT_MAX_LENGTH)
    assert len(post.content) == POST_CONTENT_MAX_LENGTH


def test_post_create_rejects_content_over_max_length() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="t", content="y" * (POST_CONTENT_MAX_LENGTH + 1))


def test_post_create_rejects_link_type() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="t", post_type="link", url="https://example.com")


def test_post_create_rejects_url_on_text_post() -> None:
    with pytest.raises(ValidationError):
        PostCreate(title="t", url="https://example.com")


def test_post_update_rejects_title_over_max_length() -> None:
    with pytest.raises(ValidationError):
        PostUpdate(title="x" * (POST_TITLE_MAX_LENGTH + 1))
