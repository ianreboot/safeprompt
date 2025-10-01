#!/usr/bin/env python3

import json

with open('test-suite/realistic-test-results.json', 'r') as f:
    data = json.load(f)

# Calculate overall statistics
total = 0
passed = 0
cost_by_stage = {}
count_by_stage = {}

for category, results in data['categoryResults'].items():
    total += results['total']
    passed += results['passed']

    for test in results['tests']:
        stage = test.get('stage', 'unknown')
        cost = test.get('cost', 0)

        if stage not in cost_by_stage:
            cost_by_stage[stage] = 0
            count_by_stage[stage] = 0

        cost_by_stage[stage] += cost
        count_by_stage[stage] += 1

print('OVERALL STATISTICS:')
print(f'Total tests: {total}')
print(f'Passed: {passed}')
print(f'Failed: {total - passed}')
print(f'Accuracy: {(passed/total)*100:.1f}%')
print()
print('STAGE BREAKDOWN:')
for stage in sorted(count_by_stage.keys()):
    pct = (count_by_stage[stage]/total)*100
    avg_cost = (cost_by_stage[stage]/count_by_stage[stage])*100000 if count_by_stage[stage] > 0 else 0
    print(f'{stage:20} {count_by_stage[stage]:3} tests ({pct:5.1f}%) - Avg cost: ${avg_cost:.2f} per 100K')
print()
print(f'Total cost for {total} tests: ${sum(cost_by_stage.values()):.6f}')
print(f'Average cost per 100K prompts: ${(sum(cost_by_stage.values())/total)*100000:.2f}')

# Find Pass 2 escalations
pass2_tests = []
for category, results in data['categoryResults'].items():
    for test in results['tests']:
        if test.get('stage') == 'pass2':
            pass2_tests.append({
                'category': category,
                'text': test['text'][:100],
                'expected': test['expected'],
                'got': test['got'],
                'passed': test['passed'],
                'confidence': test['confidence']
            })

print()
print(f'PASS 2 ESCALATIONS: {len(pass2_tests)} tests')
print('Sample escalations:')
for i, test in enumerate(pass2_tests[:5]):
    print(f"  {i+1}. [{test['category']}] {test['text'][:50]}...")
    print(f"     Expected: {test['expected']}, Got: {test['got']}, Passed: {test['passed']}")