#!/usr/bin/env bash
# Runs the RLS integration tests against the local Supabase stack.
# Start it first:  supabase start && supabase db reset
set -euo pipefail

value() { supabase status -o env | grep "^$1=" | cut -d= -f2- | tr -d '"'\''' ; }

SUPABASE_TEST_URL="${SUPABASE_TEST_URL:-http://127.0.0.1:54321}" \
SUPABASE_TEST_ANON_KEY="$(value ANON_KEY)" \
SUPABASE_TEST_SERVICE_KEY="$(value SERVICE_ROLE_KEY)" \
SUPABASE_TEST_JWT_SECRET="$(value JWT_SECRET)" \
  npx vitest run tests/rls.integration.test.ts
