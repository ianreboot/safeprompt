'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeExample {
  language: string
  label: string
  code: string
}

const codeExamples: CodeExample[] = [
  {
    language: 'curl',
    label: 'cURL',
    code: `curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello world"}'`
  },
  {
    language: 'javascript',
    label: 'Node.js',
    code: `const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: 'Hello world' })
});

const result = await response.json();
if (!result.safe) {
  console.log('Blocked:', result.threats);
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `import requests

response = requests.post(
    'https://api.safeprompt.dev/api/v1/validate',
    headers={
        'X-API-Key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={'prompt': 'Hello world'}
)

result = response.json()
if not result['safe']:
    print('Blocked:', result['threats'])`
  },
  {
    language: 'php',
    label: 'PHP',
    code: `$ch = curl_init('https://api.safeprompt.dev/api/v1/validate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'prompt' => 'Hello world'
]));

$result = json_decode(curl_exec($ch), true);
if (!$result['safe']) {
    echo 'Blocked: ' . implode(', ', $result['threats']);
}`
  },
  {
    language: 'go',
    label: 'Go',
    code: `package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]string{
        "prompt": "Hello world",
    })

    req, _ := http.NewRequest("POST",
        "https://api.safeprompt.dev/api/v1/validate",
        bytes.NewBuffer(body))

    req.Header.Set("X-API-Key", "YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}`
  }
]

export default function CodeSelector() {
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[selected].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-background rounded-lg overflow-hidden">
      {/* Language Tabs */}
      <div className="flex border-b border-border">
        {codeExamples.map((example, index) => (
          <button
            key={example.language}
            onClick={() => setSelected(index)}
            className={`px-4 py-2 text-sm font-medium transition ${
              selected === index
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm">{codeExamples[selected].code}</code>
        </pre>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-card rounded-lg border border-border hover:bg-secondary transition"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-safe" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  )
}