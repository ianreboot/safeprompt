#!/usr/bin/env python3

import json
import urllib.request

# Fetch models from OpenRouter API
url = "https://openrouter.ai/api/v1/models"
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read())

models = data.get('data', [])

# Find all free models
free_models = []

for model in models:
    model_id = model.get('id')
    pricing = model.get('pricing', {})

    # Get prices
    prompt_str = pricing.get('prompt', '0')
    completion_str = pricing.get('completion', '0')

    try:
        prompt_price = float(prompt_str) if prompt_str else 0
        completion_price = float(completion_str) if completion_str else 0
    except:
        continue

    # Check if free
    if prompt_price == 0 and completion_price == 0:
        free_models.append({
            'id': model_id,
            'name': model.get('name', ''),
            'context': model.get('context_length', 0),
            'moderation': model.get('moderation', 'unknown')
        })

# Group by provider
providers = {}
for model in free_models:
    provider = model['id'].split('/')[0]
    if provider not in providers:
        providers[provider] = []
    providers[provider].append(model)

print('=== ALL FREE MODELS BY PROVIDER ===\n')
for provider, models in sorted(providers.items()):
    print(f'{provider.upper()}:')
    for m in models:
        # Check if it's suitable for validation (not image/video models)
        if 'vision' not in m['id'] and 'image' not in m['id']:
            print(f'  - {m["id"]} (context: {m["context"]})')
    print()

print('=== RECOMMENDED FREE COMBINATIONS FOR TESTING ===\n')
print('Fast Pre-filter Models (Pass 1):')
print('  1. google/gemini-2.0-flash-exp:free')
print('  2. google/gemini-2.0-flash-thinking-exp-1219:free')
print('  3. deepseek/deepseek-chat-v3.1:free')
print('  4. deepseek/deepseek-r1:free')
print('  5. tngtech/deepseek-r1t-chimera:free')
print('')
print('Full Validation Models (Pass 2):')
print('  1. google/gemini-2.0-flash-thinking-exp-1219:free (reasoning)')
print('  2. deepseek/deepseek-r1:free (reasoning)')
print('  3. deepseek/deepseek-r1-distill-llama-70b:free')
print('  4. google/gemini-2.0-flash-exp:free')
print('  5. deepseek/deepseek-chat-v3.1:free')