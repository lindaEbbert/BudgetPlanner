import os
import subprocess
import sys
from pathlib import Path

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import Column, create_engine, text

from src.app.db import db
from src.app.main import DB_NAME, build_database_uri

# A database of its own, as the other tests build their schema from the models instead.
MIGRATED_DB_NAME = f"{DB_NAME}_migrations_test"
BACKEND_DIR = Path(__file__).resolve().parent.parent


def _recreate_database(name):
    engine = create_engine(build_database_uri("postgres"), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as connection:
            quoted_name = connection.dialect.identifier_preparer.quote(name)
            connection.execute(text(f"DROP DATABASE IF EXISTS {quoted_name}"))
            connection.execute(text(f"CREATE DATABASE {quoted_name}"))
    finally:
        engine.dispose()


@pytest.fixture
def migrated_database_uri():
    _recreate_database(MIGRATED_DB_NAME)
    # env.py reads DB_NAME, and running Alembic apart keeps its logging setup out of pytest.
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env={**os.environ, "DB_NAME": MIGRATED_DB_NAME},
        check=True,
        capture_output=True,
    )
    return build_database_uri(MIGRATED_DB_NAME)


def _is_expression_index(difference):
    # Alembic cannot compare indexes on expressions like lower(trim(name)) and always
    # reports them as removed and added again.
    operation = difference[0]
    return operation in ("add_index", "remove_index") and any(
        not isinstance(expression, Column) for expression in difference[1].expressions
    )


def test_migrations_build_the_schema_the_models_describe(migrated_database_uri):
    engine = create_engine(migrated_database_uri)
    try:
        with engine.connect() as connection:
            context = MigrationContext.configure(connection, opts={"compare_type": True})
            differences = compare_metadata(context, db.metadata)
            unused_enum_types = connection.execute(text(
                "SELECT typname FROM pg_type WHERE typtype = 'e' AND typname NOT IN ("
                "  SELECT udt_name FROM information_schema.columns WHERE table_schema = 'public')"
            )).scalars().all()
    finally:
        engine.dispose()

    assert [d for d in differences if not _is_expression_index(d)] == []
    assert unused_enum_types == []
