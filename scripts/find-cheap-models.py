#!/usr/bin/env python3

import json
import urllib.request

# Fetch models from OpenRouter API
url = "https://openrouter.ai/api/v1/models"
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read())

models = data.get('data', [])

# Find super cheap models
cheap_models = []
free_models = []

for model in models:
    model_id = model.get('id')
    pricing = model.get('pricing', {})

    # Get prices as strings
    prompt_str = pricing.get('prompt', '0')
    completion_str = pricing.get('completion', '0')

    # Convert to float
    try:
        prompt_price = float(prompt_str) if prompt_str else 0
        completion_price = float(completion_str) if completion_str else 0
    except:
        continue

    # Convert to per million tokens
    prompt_per_m = prompt_price * 1000000
    completion_per_m = completion_price * 1000000

    # Check for free models
    if prompt_per_m == 0 and completion_per_m == 0:
        free_models.append({
            'id': model_id,
            'name': model.get('name', '')
        })
    # Look for models under $0.10 per million
    elif prompt_per_m <= 0.10 and completion_per_m <= 0.10 and prompt_per_m > 0:
        cheap_models.append({
            'id': model_id,
            'name': model.get('name', ''),
            'prompt_per_m': prompt_per_m,
            'completion_per_m': completion_per_m
        })

# Sort by price
cheap_models.sort(key=lambda x: x['prompt_per_m'])

print('=== FREE MODELS ===')
for m in free_models:
    if 'gemini' in m['id'].lower() or 'deepseek' in m['id'].lower():
        print(f"  {m['id']}")

print('\n=== ULTRA-CHEAP MODELS (under $0.10 per million tokens) ===')
for m in cheap_models[:15]:
    print(f"  {m['id']}: ${m['prompt_per_m']:.4f} / ${m['completion_per_m']:.4f} (prompt/completion)")

# Look for specific providers
print('\n=== MODELS BY PROVIDER ===')

# Groq models (served on Groq hardware)
groq_models = [m for m in models if 'groq' in str(m.get('architecture', {})).lower() or 'groq' in m.get('id', '').lower()]
if groq_models:
    print('Groq models:')
    for m in groq_models[:5]:
        print(f"  {m.get('id')}")
else:
    # Look for Llama models which are often served by Groq
    llama_models = [m for m in cheap_models if 'llama' in m['id'].lower()]
    if llama_models:
        print('Llama models (possibly on Groq):')
        for m in llama_models[:5]:
            print(f"  {m['id']}: ${m['prompt_per_m']:.4f} / ${m['completion_per_m']:.4f}")