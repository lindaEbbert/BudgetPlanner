import os

import pytest
from sqlalchemy import create_engine, text

from src.app.db import db
from src.app.main import DB_NAME, build_database_uri, create_app
from src.app.services import auth_service

TEST_DB_NAME = os.getenv("TEST_DB_NAME", f"{DB_NAME}_test")

TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "test-password"


def _ensure_test_database_exists():
    # The test DB is wiped on every run — never point this at a real DB.
    if TEST_DB_NAME == DB_NAME or not TEST_DB_NAME.endswith("_test"):
        raise RuntimeError(
            f"TEST_DB_NAME '{TEST_DB_NAME}' muss auf '_test' enden und darf nicht die Entwicklungs-DB sein"
        )

    engine = create_engine(build_database_uri("postgres"), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as connection:
            exists = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": TEST_DB_NAME},
            ).scalar()
            if not exists:
                quoted_name = connection.dialect.identifier_preparer.quote(TEST_DB_NAME)
                connection.execute(text(f"CREATE DATABASE {quoted_name}"))
    finally:
        engine.dispose()


@pytest.fixture(scope="session")
def app():
    _ensure_test_database_exists()
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": build_database_uri(TEST_DB_NAME),
        "BCRYPT_LOG_ROUNDS": 4,
    })

    # Rebuild the schema fresh from the models on every test run.
    with app.app_context():
        db.drop_all()
        db.create_all()

    yield app


@pytest.fixture(autouse=True)
def _isolated_database(app):
    """Each test runs in its own app context and leaves the tables empty."""
    with app.app_context():
        yield
        db.session.remove()
        table_names = ", ".join(
            db.engine.dialect.identifier_preparer.quote(table.name)
            for table in db.metadata.sorted_tables
        )
        with db.engine.begin() as connection:
            connection.execute(text(f"TRUNCATE {table_names} CASCADE"))


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def user():
    user, error = auth_service.register_user(TEST_USER_EMAIL, "Test User", TEST_USER_PASSWORD)
    assert error is None, error
    return user


@pytest.fixture
def access_token(user):
    token, error = auth_service.login_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    assert error is None, error
    return token


@pytest.fixture
def auth_headers(access_token):
    return {"Authorization": f"Bearer {access_token}"}
