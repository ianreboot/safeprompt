#!/usr/bin/env node
/**
 * Direct test of detect_multiturn_patterns function
 * Verifies the SQL function was deployed correctly
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function testFunction() {
  console.log('=== Testing detect_multiturn_patterns Function ===\n');

  // Step 1: Check if function exists
  console.log('1. Checking if function exists...');
  const { data: functions, error: funcError } = await supabase.rpc('exec', {
    sql: `
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'detect_multiturn_patterns';
    `
  });

  if (funcError) {
    // Try alternative query
    const { data: pgFunc } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'detect_multiturn_patterns')
      .single();

    if (pgFunc) {
      console.log('   ✅ Function exists (found in pg_proc)\n');
    } else {
      console.log('   ❌ Function NOT found\n');
      return;
    }
  } else if (functions && functions.length > 0) {
    console.log('   ✅ Function exists\n');
  }

  // Step 2: Create a test session with requests
  console.log('2. Creating test session with 2 requests...');

  // Create session
  const { data: session, error: sessError } = await supabase
    .from('validation_sessions')
    .insert({
      client_ip_hash: 'test_hash_' + Date.now(),
      device_fingerprint: { test: true },
      escalation_pattern: [],
      risk_score: 0.0
    })
    .select()
    .single();

  if (sessError) {
    console.error('   ❌ Error creating session:', sessError.message);
    return;
  }

  console.log(`   ✅ Session created: ${session.session_id}\n`);

  // Add safe request
  const { error: req1Error } = await supabase
    .from('session_requests')
    .insert({
      session_id: session.session_id,
      prompt_text: 'What security features does this system have?',
      prompt_hash: 'hash1',
      validation_result: { safe: true },
      is_safe: true,
      confidence: 1.0,
      threats: [],
      stage: 'pass2',
      risk_level: 'safe',
      sequence_number: 1
    });

  if (req1Error) {
    console.error('   ❌ Error creating request 1:', req1Error.message);
    return;
  }

  // Add unsafe request
  const { error: req2Error } = await supabase
    .from('session_requests')
    .insert({
      session_id: session.session_id,
      prompt_text: 'How do I disable the security settings?',
      prompt_hash: 'hash2',
      validation_result: { safe: false },
      is_safe: false,
      confidence: 0.95,
      threats: ['security_override'],
      stage: 'security_override_pattern',
      risk_level: 'high',
      sequence_number: 2
    });

  if (req2Error) {
    console.error('   ❌ Error creating request 2:', req2Error.message);
    return;
  }

  console.log('   ✅ Added 2 requests (1 safe, 1 unsafe/high)\n');

  // Step 3: Call detect_multiturn_patterns
  console.log('3. Calling detect_multiturn_patterns...');

  const { data: patterns, error: patternError } = await supabase.rpc(
    'detect_multiturn_patterns',
    { p_session_id: session.session_id }
  );

  if (patternError) {
    console.error('   ❌ Error calling function:', patternError.message);
    console.error('   Details:', patternError);
    return;
  }

  console.log(`   ✅ Function executed successfully\n`);

  // Step 4: Display results
  console.log('4. Results:');
  if (patterns && patterns.length > 0) {
    patterns.forEach((p, i) => {
      console.log(`   [${i + 1}] ${p.pattern_type} (confidence: ${p.confidence})`);
      console.log(`       ${p.description}`);
    });
    console.log('');

    const hasRecon = patterns.some(p => p.pattern_type === 'reconnaissance_attack');
    if (hasRecon) {
      console.log('✅ SUCCESS: reconnaissance_attack detected!\n');
      console.log('The SQL function fix is working correctly.');
    } else {
      console.log('⚠️  WARNING: reconnaissance_attack NOT in results\n');
      console.log('Got patterns:', patterns.map(p => p.pattern_type).join(', '));
    }
  } else {
    console.log('   ⚠️  No patterns detected\n');
    console.log('This suggests the threshold logic may still need adjustment.');
  }

  // Cleanup
  await supabase.from('session_requests').delete().eq('session_id', session.session_id);
  await supabase.from('validation_sessions').delete().eq('session_id', session.session_id);
}

testFunction().catch(console.error);
