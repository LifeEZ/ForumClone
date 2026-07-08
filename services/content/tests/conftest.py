from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import jwt
import pytest
import pytest_asyncio
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from hiver_auth_contract import (
    ACCESS_TOKEN_TYPE,
    ALGORITHM,
    CLAIM_SUB,
    CLAIM_TYPE,
    CLAIM_USERNAME,
)
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models.comment  # noqa: F401
import app.models.community  # noqa: F401
import app.models.membership  # noqa: F401
import app.models.post  # noqa: F401
import app.models.vote  # noqa: F401
from app.database import Base
from app.dependencies import get_session
from app.keyresolver import KeyResolver, set_resolver_for_testing
from app.main import create_app

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
TEST_KID = "hiver-identity-key"


@pytest.fixture(scope="session")
def test_keypair() -> tuple[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode()
    )
    return private_pem, public_pem


@pytest.fixture(scope="session", autouse=True)
def _install_test_public_key(test_keypair: tuple[str, str]) -> None:
    _, public_pem = test_keypair
    public_key = serialization.load_pem_public_key(public_pem.encode())
    set_resolver_for_testing(KeyResolver.for_keys({TEST_KID: public_key}))


def _mint_access_token(
    private_pem: str,
    *,
    sub: str,
    username: str,
) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=15)
    payload = {
        CLAIM_SUB: sub,
        CLAIM_USERNAME: username,
        "exp": expire,
        CLAIM_TYPE: ACCESS_TOKEN_TYPE,
    }
    return jwt.encode(payload, private_pem, algorithm=ALGORITHM, headers={"kid": TEST_KID})


@pytest.fixture
def auth_headers(test_keypair: tuple[str, str]) -> dict[str, str]:
    private_pem, _ = test_keypair
    token = _mint_access_token(private_pem, sub="u-test", username="test_user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers2(test_keypair: tuple[str, str]) -> dict[str, str]:
    private_pem, _ = test_keypair
    token = _mint_access_token(private_pem, sub="u-test2", username="other_user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest_asyncio.fixture
async def session() -> AsyncGenerator:
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as sess:
        yield sess

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(session: AsyncSession) -> AsyncGenerator:
    app = create_app()

    async def override_get_session() -> AsyncGenerator:
        yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
