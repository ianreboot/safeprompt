#!/usr/bin/env node
/**
 * Get runtime logs for actual function invocations
 */
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_vEUOowUKqyUzHVH8v56iMoHBatLe'; // safeprompt-api
const TEAM_ID = 'team_jEzx1ptxrQxcWgrSpGZ9Vah6';

async function getFunctionLogs() {
  console.log('🔍 Fetching function invocation logs...\n');

  // Get recent deployments
  const deploymentsResponse = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/deployments?limit=3&target=production`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    }
  );

  if (!deploymentsResponse.ok) {
    console.error('Failed to fetch deployments:', deploymentsResponse.status);
    const text = await deploymentsResponse.text();
    console.error('Response:', text);
    process.exit(1);
  }

  const deploymentsData = await deploymentsResponse.json();
  console.log('API response:', JSON.stringify(deploymentsData, null, 2).substring(0, 500));

  const deployments = deploymentsData.deployments || [];
  console.log(`\nFound ${deployments.length} recent PROD deployments\n`);

  for (const deployment of deployments) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Deployment: ${deployment.url}`);
    console.log(`Created: ${new Date(deployment.created).toISOString()}`);
    console.log(`State: ${deployment.state}`);
    console.log(`${'='.repeat(60)}\n`);

    // Get runtime logs for this deployment
    const logsResponse = await fetch(
      `https://api.vercel.com/v2/deployments/${deployment.uid}/events?types=stdout,stderr,error&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    const events = await logsResponse.json();

    if (Array.isArray(events)) {
      const runtimeEvents = events.filter(e =>
        e.type === 'stdout' || e.type === 'stderr' || e.type === 'error'
      );

      console.log(`Found ${runtimeEvents.length} runtime log entries`);

      if (runtimeEvents.length > 0) {
        runtimeEvents.forEach((event, i) => {
          console.log(`\n[${i + 1}] ${event.type} - ${new Date(event.created).toISOString()}`);
          console.log(event.payload?.text || event.text || JSON.stringify(event));
        });
      }
    }
  }
}

getFunctionLogs().catch(error => {
  console.error('Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
