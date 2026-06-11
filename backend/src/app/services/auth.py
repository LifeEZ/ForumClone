"""Auth service — implemented in Phase 1."""


class TokenInvalidError(Exception):
    pass


class UserNotFoundError(Exception):
    def __init__(self, identifier: str) -> None:
        self.identifier = identifier
        super().__init__(f"User '{identifier}' not found")


class InvalidCredentialsError(Exception):
    pass


async def get_user_from_token(session: object, token: str) -> object:  # type: ignore[return]
    raise NotImplementedError("Implemented in Phase 1")
