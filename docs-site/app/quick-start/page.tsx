import DocsHeader from '@/components/DocsHeader'
import Footer from '@/components/Footer'
import Link from 'next/link'
import CodeTabs, { CodeExample } from '@/components/CodeTabs'
import CodeBlock from '@/components/CodeBlock'

const codeExamples: CodeExample[] = [
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'X-User-IP': clientIpAddress, // End user's IP address
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
});

const result = await response.json();
if (!result.safe) {
  throw new Error(\`Blocked: \${result.threats?.[0] || 'Security threat detected'}\`);
}`
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.post(
    'https://api.safeprompt.dev/api/v1/validate',
    headers={
        'X-API-Key': 'YOUR_API_KEY',
        'X-User-IP': client_ip_address,  # End user's IP address
        'Content-Type': 'application/json'
    },
    json={'prompt': user_input}
)

result = response.json()
if not result['safe']:
    threats = result.get('threats', ['Security threat detected'])
    raise ValueError(f"Blocked: {threats[0]}")`
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$ch = curl_init('https://api.safeprompt.dev/api/v1/validate');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: YOUR_API_KEY',
        'X-User-IP: ' . $_SERVER['REMOTE_ADDR'],
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode(['prompt' => $userInput])
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!$response['safe']) {
    throw new Exception('Blocked: ' . ($response['threats'][0] ?? 'Security threat detected'));
}`
  },
  {
    label: 'Go',
    language: 'go',
    code: `package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type ValidateRequest struct {
    Prompt string \`json:"prompt"\`
}

type ValidateResponse struct {
    Safe       bool     \`json:"safe"\`
    Confidence float64  \`json:"confidence"\`
    Threats    []string \`json:"threats"\`
}

func checkPrompt(userInput, clientIP string) (*ValidateResponse, error) {
    reqBody, _ := json.Marshal(ValidateRequest{Prompt: userInput})
    req, err := http.NewRequest("POST", "https://api.safeprompt.dev/api/v1/validate", bytes.NewBuffer(reqBody))
    if err != nil {
        return nil, err
    }

    req.Header.Set("X-API-Key", "YOUR_API_KEY")
    req.Header.Set("X-User-IP", clientIP)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result ValidateResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}`
  },
  {
    label: 'Ruby',
    language: 'ruby',
    code: `require 'net/http'
require 'json'

uri = URI('https://api.safeprompt.dev/api/v1/validate')
req = Net::HTTP::Post.new(uri)
req['X-API-Key'] = 'YOUR_API_KEY'
req['X-User-IP'] = client_ip_address
req['Content-Type'] = 'application/json'
req.body = { prompt: user_input }.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(req)
end

result = JSON.parse(res.body)
raise "Blocked: #{result['threats']&.first || 'Security threat detected'}" unless result['safe']`
  },
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-User-IP: CLIENT_IP_ADDRESS" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello world"}'`
  }
]

export default function QuickStart() {
  return (
    <main className="min-h-screen">
      <DocsHeader />
      <div className="container mx-auto max-w-5xl px-6 pt-32 pb-20 blog-content">
        <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
        <p className="text-lg mb-8">Get SafePrompt integrated into your LLM application in 5 minutes.</p>

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">1. Get Your API Key</h2>
        <p className="mb-4">
          Sign up and get your API key from{' '}
          <a href="https://dashboard.safeprompt.dev" target="_blank" rel="noopener noreferrer">
            dashboard.safeprompt.dev
          </a>
        </p>

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">2. Install (Optional)</h2>
        <p className="mb-4">Currently, use the HTTP API directly. NPM and pip packages are coming soon.</p>

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">3. Validate User Prompts</h2>

        <CodeTabs examples={codeExamples} />

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">4. Understanding the Response</h2>
        <p className="mb-4">The API returns a JSON object with these key fields:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            <strong>safe</strong> (boolean): <code>true</code> if the prompt is safe, <code>false</code> if it&apos;s a threat
          </li>
          <li>
            <strong>confidence</strong> (float, 0-1): How certain we are about the verdict (0.9+ is very high confidence)
          </li>
          <li>
            <strong>threats</strong> (array): List of detected threat types (e.g., &quot;prompt_injection&quot;, &quot;jailbreak&quot;)
          </li>
          <li>
            <strong>processingTime</strong> (number): Response time in milliseconds
          </li>
        </ul>

        <CodeBlock language="json">
{`{
  "safe": false,
  "confidence": 0.95,
  "threats": ["prompt_injection"],
  "processingTime": 245,
  "sessionId": "sess_abc123"
}`}
        </CodeBlock>

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">5. Important: End User IP Address</h2>
        <p className="mb-4">
          Always pass the <strong>end user&apos;s IP address</strong> via the <code>X-User-IP</code> header, not your server&apos;s IP.
        </p>

        <p className="mb-4">
          <strong>How to get the end user&apos;s IP:</strong>
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            Express.js: <code>req.headers[&apos;x-forwarded-for&apos;] || req.connection.remoteAddress</code>
          </li>
          <li>
            Flask/Django: <code>request.headers.get(&apos;X-Forwarded-For&apos;, request.remote_addr)</code>
          </li>
          <li>
            Next.js: <code>req.headers[&apos;x-forwarded-for&apos;] || req.socket.remoteAddress</code>
          </li>
          <li>
            PHP: <code>$_SERVER[&apos;HTTP_X_FORWARDED_FOR&apos;] ?? $_SERVER[&apos;REMOTE_ADDR&apos;]</code>
          </li>
        </ul>

        <p className="mb-4">
          <strong>For testing and development:</strong>
        </p>
        <p className="mb-4">
          When the end user&apos;s IP is unavailable (testing, batch processing, or privacy requirements), use a placeholder IP from the RFC 5737 TEST-NET-3 range:
        </p>

        <CodeBlock language="bash">
{`# Use TEST-NET-3 addresses (203.0.113.0/24) for testing
curl -X POST https://api.safeprompt.dev/api/v1/validate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-User-IP: 203.0.113.45" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello world"}'`}
        </CodeBlock>

        <p className="mb-4">
          <strong>Why X-User-IP is required:</strong>
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            <strong>Threat intelligence:</strong> Tracks actual attackers vs. legitimate API callers
          </li>
          <li>
            <strong>IP reputation:</strong> Identifies patterns of malicious behavior
          </li>
          <li>
            <strong>Network defense:</strong> Protects all SafePrompt customers from coordinated attacks
          </li>
        </ul>

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">6. Best Practices</h2>

        <h3 className="text-2xl font-semibold mt-8 mb-4">Fail-Open Strategy</h3>
        <p className="mb-4">
          If the SafePrompt API is unreachable or times out, <strong>allow the request to proceed</strong> rather than blocking legitimate users:
        </p>

        <CodeBlock language="javascript">
{`try {
  const result = await validatePrompt(userInput);
  if (!result.safe) {
    return { error: 'Invalid request' };
  }
} catch (error) {
  // Fail open: Allow request if validation service is down
  console.error('SafePrompt validation failed:', error);
}`}
        </CodeBlock>

        <h3 className="text-2xl font-semibold mt-8 mb-4">Caching (Optional)</h3>
        <p className="mb-4">For high-traffic applications, consider caching validation results:</p>

        <CodeBlock language="javascript">
{`const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function validateWithCache(prompt) {
  const hash = hashPrompt(prompt);
  const cached = cache.get(hash);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = await validatePrompt(prompt);
  cache.set(hash, { result, timestamp: Date.now() });
  return result;
}`}
        </CodeBlock>

        <h3 className="text-2xl font-semibold mt-8 mb-4">Multi-Turn Protection</h3>
        <p className="mb-4">For conversational AI, track session tokens to detect multi-turn attacks:</p>

        <CodeBlock language="javascript">
{`let sessionToken = null;

async function validateConversationTurn(userInput) {
  const result = await fetch('https://api.safeprompt.dev/api/v1/validate', {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'X-User-IP': clientIP,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: userInput,
      sessionToken: sessionToken  // Pass previous session token
    })
  });

  const data = await result.json();
  sessionToken = data.sessionId;  // Store for next turn
  return data;
}`}
        </CodeBlock>

        <h2 className="text-3xl font-bold mt-12 mb-4 border-b border-zinc-800 pb-3">Next Steps</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <Link href="/api-reference">View full API reference</Link> for advanced features
          </li>
          <li>
            <a href="https://dashboard.safeprompt.dev" target="_blank" rel="noopener noreferrer">
              Manage your API keys
            </a>{' '}
            and view analytics
          </li>
          <li>
            <Link href="/api-reference#rate-limits">Check rate limits</Link> for your tier
          </li>
        </ul>
      </div>

      <Footer />
    </main>
  )
}
