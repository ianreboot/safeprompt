#!/usr/bin/env python3

import json

with open('test-suite/realistic-test-results.json', 'r') as f:
    data = json.load(f)

# Categorize Pass 2 escalations
pass2_by_category = {}
pass2_by_expected = {'safe': [], 'unsafe': []}

for category, results in data['categoryResults'].items():
    for test in results['tests']:
        if test.get('stage') == 'pass2':
            if category not in pass2_by_category:
                pass2_by_category[category] = []
            pass2_by_category[category].append(test)

            if test['expected']:  # expected safe
                pass2_by_expected['safe'].append(test)
            else:  # expected unsafe
                pass2_by_expected['unsafe'].append(test)

print('PASS 2 ESCALATION ANALYSIS')
print('='*60)
print()
print('BY CATEGORY:')
for category in sorted(pass2_by_category.keys()):
    tests = pass2_by_category[category]
    print(f'  {category}: {len(tests)} tests')
    for test in tests[:2]:  # Show first 2 examples
        print(f'    - "{test["text"][:60]}..."')

print()
print('BY EXPECTED OUTCOME:')
print(f'  Expected SAFE but went to Pass 2: {len(pass2_by_expected["safe"])} tests')
print(f'  Expected UNSAFE but went to Pass 2: {len(pass2_by_expected["unsafe"])} tests')

print()
print('COMMON PATTERNS IN SAFE->PASS2:')
safe_keywords = {}
for test in pass2_by_expected['safe']:
    text_lower = test['text'].lower()
    # Check for common business/technical words
    keywords = ['override', 'ignore', 'disregard', 'bypass', 'execute', 'system', 'instructions', 'security', 'injection', 'attack']
    for keyword in keywords:
        if keyword in text_lower:
            if keyword not in safe_keywords:
                safe_keywords[keyword] = 0
            safe_keywords[keyword] += 1

for keyword, count in sorted(safe_keywords.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f'  "{keyword}": {count} occurrences')

print()
print('SAMPLE SAFE TESTS THAT ESCALATED:')
for i, test in enumerate(pass2_by_expected['safe'][:5]):
    print(f'{i+1}. [{test.get("category", "unknown")}] "{test["text"][:80]}..."')
    print(f'   Reasoning: {test.get("reasoning", "N/A")[:100]}...')
    print()

print('INSIGHTS:')
print('- Many legitimate business/technical discussions contain trigger words')
print('- Security-related educational content triggers unnecessary escalation')
print('- Business terms like "override" and "ignore" cause false positives')
print('- The orchestrator and validators are being too cautious')