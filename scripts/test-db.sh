#!/usr/bin/env bash
# Runs the RLS integration tests against the local Supabase stack.
# Start it first:  supabase start && supabase db reset
set -euo pipefail

value() { supabase status -o env | grep "^$1=" | cut -d= -f2- | tr -d '"'\''' ; }

# Read the keys into variables first. As a prefix on the vitest command, a failed
# lookup came through as an empty string, the suite skipped itself, and CI went
# green having tested nothing.
ANON_KEY="$(value ANON_KEY)"
SERVICE_KEY="$(value SERVICE_ROLE_KEY)"
JWT_SECRET="$(value JWT_SECRET)"
for name in ANON_KEY SERVICE_KEY JWT_SECRET; do
  if [ -z "${!name}" ]; then
    echo "test-db: could not read $name from \`supabase status\`; is the local stack running?" >&2
    exit 1
  fi
done

SUPABASE_TEST_URL="${SUPABASE_TEST_URL:-http://127.0.0.1:54321}" \
SUPABASE_TEST_ANON_KEY="$ANON_KEY" \
SUPABASE_TEST_SERVICE_KEY="$SERVICE_KEY" \
SUPABASE_TEST_JWT_SECRET="$JWT_SECRET" \
  npx vitest run tests/rls.integration.test.ts
