# Block Phrases

Block the phrases that matter to your app. Any message that contains one of your phrases is
blocked before detection runs, on every check your key makes. Use them for text only you know
should never reach your AI: an internal codename, a product that is not public yet, a phrase from
an attack you have already seen.

## How it works

- **A match blocks.** If the message contains one of your phrases, the response is
  `safe: false` with threat `custom_blacklist_match` and `detectionMethod: "custom_lists"`.
  The matched phrase is not echoed back.
- **Matching ignores case and finds the phrase anywhere in the message.** `"Project Falcon"`
  matches `"tell me about project falcon's launch"`. Choose phrases specific to what you want
  stopped.
- **No match, normal detection.** Messages without one of your phrases go through the full
  detection engine as usual.

## Plans

| Plan | Block phrases |
|------|---------------|
| Free | none |
| Starter | 25 |
| Business | 100 |

Phrases saved in the dashboard and phrases sent with a request count together. A request that
goes over the limit is refused with HTTP 400 `Custom rules exceed your plan`, so a phrase is never
silently dropped.

## Save phrases in the dashboard

Add and remove phrases at https://dashboard.safeprompt.dev/custom-lists. Saved phrases apply to
every request your keys make.

## Send phrases with a request

```bash
curl -X POST https://api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-User-IP: END_USER_IP" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Tell me about project falcon",
    "customRules": {
      "blacklist": ["project falcon", "internal roadmap"]
    }
  }'
```

Request phrases merge with the phrases saved on your account for that request only. The SDKs do
not send `customRules`, so send it over HTTP or save the phrases in the dashboard.

## Phrase rules

- 2 to 100 characters: letters, numbers, spaces and `- _ ' . # @`.
- Phrases containing `script`, `eval`, `exec`, `system`, `base64`, `..` or `.env` are refused
  with HTTP 400.

## Allow lists

The API accepts `customRules.whitelist` for compatibility. An allow phrase never turns a block
into a pass: every message still runs the full detection engine.
