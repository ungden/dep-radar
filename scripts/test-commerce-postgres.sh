#!/usr/bin/env bash
# Reuses a running LOCAL PostgreSQL cluster; never starts Docker or a new stack.
# Needs a local role allowed to create databases/roles. No production DB URL.
set -euo pipefail
cd "$(dirname "$0")/.."
export PGHOST="${PGHOST:-/tmp}"
case "$PGHOST" in /tmp|/var/run/postgresql|localhost|127.0.0.1|::1) ;; *) echo 'Only a local PostgreSQL cluster is allowed.' >&2; exit 1;; esac
qa_db="${COMMERCE_TEST_DB:-dep360_qa_commerce_$$}"
case "$qa_db" in dep360_qa_*) ;; *) echo 'Use a disposable dep360_qa_ database name.' >&2; exit 1;; esac
createdb "$qa_db"
cleanup() { if [ "${KEEP_TEST_DB:-0}" != 1 ]; then dropdb --if-exists "$qa_db"; fi; }
trap cleanup EXIT
psql -X -v ON_ERROR_STOP=1 -q -d "$qa_db" -f supabase/tests/platform_fixture.sql
for migration in supabase/migrations/*.sql; do
  psql -X -v ON_ERROR_STOP=1 -q -d "$qa_db" -f "$migration"
done
psql -X -v ON_ERROR_STOP=1 -q -d "$qa_db" -f supabase/seed/catalog.sql -f supabase/seed/demo.sql
psql -X -v ON_ERROR_STOP=1 -q -d "$qa_db" -c 'grant all on all tables in schema public to service_role'
psql -X -v ON_ERROR_STOP=1 -q -d "$qa_db" -f supabase/tests/rules.sql -f supabase/tests/commerce_lifecycle.sql
printf 'Full migration chain and SQL rules passed: %s\n' "$qa_db"
