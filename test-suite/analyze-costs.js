import { readFileSync } from 'fs';

const results = JSON.parse(readFileSync('./realistic-test-results.json', 'utf-8'));

// Analyze cost by stage
const stageCosts = {};

results.allResults.forEach(test => {
  const stage = test.stage;
  const cost = test.cost || 0;

  if (!stageCosts[stage]) {
    stageCosts[stage] = { count: 0, totalCost: 0, tests: [] };
  }

  stageCosts[stage].count++;
  stageCosts[stage].totalCost += cost;
  stageCosts[stage].tests.push({
    id: test.id,
    cost: cost,
    time: test.latency
  });
});

console.log('=== COST BY STAGE ===\n');
Object.entries(stageCosts)
  .sort((a, b) => b[1].totalCost - a[1].totalCost)
  .forEach(([stage, data]) => {
    const avgCost = data.totalCost / data.count;
    const pct = (data.totalCost / results.summary.totalCost * 100).toFixed(1);
    console.log(`${stage}:`);
    console.log(`  Count: ${data.count}`);
    console.log(`  Total: $${data.totalCost.toFixed(6)} (${pct}% of total)`);
    console.log(`  Avg: $${avgCost.toFixed(6)}`);
    console.log();
  });

console.log('=== ZERO-COST POTENTIAL ===\n');
const zeroCostStages = ['pattern', 'xss_pattern', 'sql_pattern', 'template_pattern', 'external_reference', 'semantic_pattern', 'execution_pattern'];
const zeroCost = results.allResults.filter(t => zeroCostStages.includes(t.stage));
const nonZeroCost = results.allResults.filter(t => !zeroCostStages.includes(t.stage));

console.log(`Zero-cost tests: ${zeroCost.length}/${results.allResults.length} (${(zeroCost.length/results.allResults.length*100).toFixed(1)}%)`);
console.log(`AI-based tests: ${nonZeroCost.length}/${results.allResults.length} (${(nonZeroCost.length/results.allResults.length*100).toFixed(1)}%)`);
console.log();

console.log('AI-based breakdown:');
const aiStages = {};
nonZeroCost.forEach(t => {
  const stage = t.stage;
  if (!aiStages[stage]) aiStages[stage] = 0;
  aiStages[stage]++;
});
Object.entries(aiStages).sort((a,b) => b[1] - a[1]).forEach(([stage, count]) => {
  console.log(`  ${stage}: ${count}`);
});
console.log();

console.log('=== OPTIMIZATION OPPORTUNITIES ===\n');

// Find tests that could potentially be caught by patterns
console.log('Tests currently using orchestrator that might be pattern-catchable:');
const orchestratorTests = results.allResults.filter(t => t.stage === 'orchestrator');
orchestratorTests.forEach(t => {
  console.log(`  [${t.id}] ${t.text.substring(0, 60)}...`);
});
console.log();

console.log('Tests currently using attack_detected:');
const attackTests = results.allResults.filter(t => t.stage === 'attack_detected');
attackTests.forEach(t => {
  console.log(`  [${t.id}] ${t.text.substring(0, 60)}...`);
  console.log(`    Reasoning: ${t.reasoning.substring(0, 80)}...`);
});
console.log();

console.log('Pass 2 escalations by category:');
const pass2Tests = results.allResults.filter(t => t.stage === 'pass2');
const pass2ByCategory = {};
pass2Tests.forEach(t => {
  const cat = t.category;
  if (!pass2ByCategory[cat]) pass2ByCategory[cat] = [];
  pass2ByCategory[cat].push(t);
});
Object.entries(pass2ByCategory).forEach(([cat, tests]) => {
  console.log(`  ${cat}: ${tests.length} tests`);
});
