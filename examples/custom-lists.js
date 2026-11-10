/**
 * SafePrompt block phrases example
 *
 * Any message that contains one of your block phrases is blocked before detection runs.
 * Requires a Starter (25 phrases) or Business (100 phrases) plan. Phrases saved in the
 * dashboard and phrases sent with a request count together toward the limit.
 */

const SAFEPROMPT_API_URL = 'https://api.safeprompt.dev/api/v1/validate';
const API_KEY = process.env.SAFEPROMPT_API_KEY || 'sp_test_EXAMPLE_KEY';

async function check(prompt, blacklist, userIP = '203.0.113.10') {
  const response = await fetch(SAFEPROMPT_API_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'X-User-IP': userIP,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt, customRules: { blacklist } })
  });
  return { status: response.status, body: await response.json() };
}

async function main() {
  const blacklist = ['project falcon', 'internal roadmap'];

  // Contains a block phrase: blocked, threat custom_blacklist_match.
  const blocked = await check('What is the launch date for Project Falcon?', blacklist);
  console.log('blocked:', blocked.body.safe, blocked.body.threats, blocked.body.detectionMethod);

  // No block phrase: the full detection engine decides.
  const ordinary = await check('What are your opening hours?', blacklist);
  console.log('ordinary:', ordinary.body.safe);

  // A Free key, or more phrases than the plan allows, gets HTTP 400.
  if (blocked.status === 400) console.log('400:', blocked.body.error, blocked.body.details);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { check };
