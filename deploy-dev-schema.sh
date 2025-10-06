#!/bin/bash
# Deploy Phase 1A schema to DEV database
# Uses Supabase REST API to execute SQL

set -e

# Load environment
source /home/projects/.env

echo "=== SafePrompt Phase 1A DEV Database Deployment ==="
echo "Target: ${SAFEPROMPT_SUPABASE_URL}"
echo ""

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql_content="$1"
    local description="$2"

    echo "Executing: $description"

    curl -s -X POST "${SAFEPROMPT_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}" \
        || echo "Warning: RPC method may not exist, trying direct psql..."
}

# Step 1: Apply base schema (if needed)
echo "Step 1: Checking base schema..."
psql "postgresql://postgres:${SAFEPROMPT_SUPABASE_DB_PASSWORD}@db.vkyggknknyfallmnrmfu.supabase.co:5432/postgres" \
    -f /home/projects/safeprompt/database/setup.sql

# Step 2: Apply Phase 1A migrations
echo ""
echo "Step 2: Applying Phase 1A migrations..."
echo "- Session storage..."
psql "postgresql://postgres:${SAFEPROMPT_SUPABASE_DB_PASSWORD}@db.vkyggknknyfallmnrmfu.supabase.co:5432/postgres" \
    -f /home/projects/safeprompt/supabase/migrations/20251006_session_storage.sql

echo "- Threat intelligence..."
psql "postgresql://postgres:${SAFEPROMPT_SUPABASE_DB_PASSWORD}@db.vkyggknknyfallmnrmfu.supabase.co:5432/postgres" \
    -f /home/projects/safeprompt/supabase/migrations/20251006_threat_intelligence.sql

echo ""
echo "✅ DEV database deployment complete!"
echo "Database: vkyggknknyfallmnrmfu"
echo "URL: ${SAFEPROMPT_SUPABASE_URL}"
