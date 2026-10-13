#!/bin/sh
set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
python - <<'PY'
import os, time
import MySQLdb

host = os.environ.get("DB_HOST", "db-prototipo")
port = int(os.environ.get("DB_PORT", "3306"))
user = os.environ.get("MYSQL_USER", "app_user")
password = os.environ.get("MYSQL_PASSWORD", "")
database = os.environ.get("MYSQL_DATABASE", "")

for attempt in range(60):
    try:
        conn = MySQLdb.connect(
            host=host, port=port, user=user, passwd=password, db=database
        )
        conn.close()
        print("MySQL is ready.")
        break
    except Exception as exc:
        print(f"MySQL not ready ({attempt + 1}/60): {exc}")
        time.sleep(2)
else:
    raise SystemExit("MySQL did not become ready in time.")
PY

python manage.py migrate --noinput
python manage.py seed_user
python manage.py collectstatic --noinput

exec "$@"
