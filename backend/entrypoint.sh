#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until python -c "
import os, sys, socket
url = os.environ.get('DATABASE_URL', '')
try:
    host = url.split('@')[-1].split('/')[0]
    if ':' in host:
        h, p = host.rsplit(':', 1)
    else:
        h, p = host, '5432'
    s = socket.create_connection((h, int(p)), timeout=2)
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "Database not ready, retrying in 2s..."
    sleep 2
done

echo "Running database migrations..."
# Alembic uses a PostgreSQL advisory lock — safe to run from multiple replicas,
# but for large-scale deployments prefer a dedicated init container or migration job.
alembic upgrade head

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
