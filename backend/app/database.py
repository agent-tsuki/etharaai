from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal = None


def _get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        from sqlalchemy import create_engine
        from sqlalchemy.pool import NullPool
        settings = get_settings()
        # NullPool: no persistent connections between serverless invocations.
        # Lazy import: defers psycopg2 C-extension load until first DB request.
        _engine = create_engine(settings.DATABASE_URL, poolclass=NullPool)
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine, _SessionLocal


def get_db():
    _, SessionLocal = _get_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
