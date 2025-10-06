# SafePrompt - Error Pattern Quick Reference

**Purpose**: Fast lookup table for known failure patterns. Find your error → Get fix immediately.

**For detailed explanations**: See `/home/projects/safeprompt/docs/INCIDENTS.md`

---

## Quick Lookup Table

| Error Pattern | Root Cause | Fix Pattern | Code Tail (Non-Obvious) | Incident # |
|---------------|------------|-------------|------------------------|------------|
| **Error 42P17** "infinite recursion" | RLS policy queries same table | Use SECURITY DEFINER function | `CREATE FUNCTION ... SECURITY DEFINER` | #1 |
| **"user not found"** (prod users exist) | Dashboard using wrong database | Remove `.env.local`, rebuild | `.env.local` loads before `.env.production` | #2 |
| **"Maximum call stack"** (JSX) | Component too complex | Early returns or break into components | Vite JSX limit ~2000 AST nodes | #3 |
| **"permission denied for table"** (trigger) | Trigger lacks table permissions | GRANT to postgres user | `GRANT INSERT, UPDATE ON TABLE ... TO postgres` | #4 |
| **Email templates persist** (after reset) | Stored in auth.config, not migrations | Delete from auth.config first | `DELETE FROM auth.config WHERE parameter IN (...)` | #5 |
| **"No signatures found"** (Stripe) | Body already parsed by Vercel | Set `bodyParser: false` | `export const config = { api: { bodyParser: false }}` | #6 |
| **Old version after deploy** | Cache not invalidated yet | Hard refresh or wait 5-10min | Expected Cloudflare behavior | #7 |
| **"Model not found"** (OpenRouter) | Model deprecated | Use Context7 for current names | Model names change without notice | #8 |
| **Slow queries** (simple SELECT) | RLS policy checks expensive first | Put `auth.uid() = id` first | OR logic evaluates left-to-right | #9 |
| **"Invalid API key"** (after rotation) | No grace period for old keys | Warn users or implement grace period | Future enhancement needed | #10 |
| **Dev traffic hits prod DB** | Single API architecture | Separate Vercel projects for dev/prod | Need dev-api.safeprompt.dev + separate project | #11 |
| **API works without auth** | Optional validation with bypasses | Always require and validate keys | Remove all hardcoded bypass keys | #12 |
| **Custom domain shows old code** | Deployed to Preview not Production | Add `--branch main` flag | `wrangler pages deploy out --project-name X --branch main` | #13 |
| **Dev calls prod API** | Next.js build-time substitution | Use `.env.local` to override | `NEXT_PUBLIC_*` baked into bundle at build time | #14 |
| **CORS wildcard** | `Access-Control-Allow-Origin: *` | Whitelist specific origins | Security vulnerability, not just config | #15 |
| **Cache data leakage** | Cache keyed by prompt only | Include profileId in cache key | `crypto.createHash('md5').update(profileId:prompt:mode)` | #16 |
| **Performance claims wrong** | Mixed pattern + AI validation | Specify detection method | <100ms for pattern, 2-3s for AI | #17 |
| **"Safe pattern" proposals** | Creates bypass vulnerability | NEVER implement | Attackers target whitelist logic | #18 |
| **Inconsistent regex detection** | `/g` flag state pollution | Remove `/g` from boolean `.test()` | `lastIndex` state persists between calls | #19 |

---

## Common Error Categories

### Database Issues (#1, #2, #4, #5, #9, #11)
- **RLS problems**: Use SECURITY DEFINER, check policy order
- **Wrong database**: Remove `.env.local`, check bundle
- **Permissions**: GRANT statements for triggers
- **Dev/Prod separation**: Separate API + DB, not just DB

### Deployment Issues (#7, #13, #14)
- **Cloudflare**: Cache takes 5-10min, use `--branch main`
- **Next.js**: Build-time substitution requires separate builds
- **Verification**: Check bundle hash matches deployment

### Security Issues (#6, #12, #15, #16, #18, #19)
- **Authentication**: Always validate, no bypasses
- **CORS**: Whitelist origins, never `*`
- **Cache**: Include user ID in cache keys
- **Stripe**: Raw buffer for webhooks
- **Regex**: No `/g` flag for boolean checks
- **Safe patterns**: NEVER implement (bypass risk)

### API/Integration Issues (#8, #10, #17)
- **Model names**: Use Context7 for current names
- **Key rotation**: No grace period (future enhancement)
- **Performance**: Specify detection method in claims

---

## Pattern Matching Guide

**If you see this error → Look up this row:**

- `42P17` → Error 42P17
- `user not found` + prod users exist → "user not found"
- `Maximum call stack` + JSX/Vite → "Maximum call stack"
- `permission denied` + trigger → "permission denied for table"
- Email templates unchanged → Email templates persist
- `No signatures found` + Stripe → "No signatures found"
- Deployed but old content → Old version after deploy
- `Model not found` + OpenRouter → "Model not found"
- Slow SELECT queries → Slow queries
- `Invalid API key` after user rotates → "Invalid API key"
- Dev creates prod users → Dev traffic hits prod DB
- API works without header → API works without auth
- Custom domain stale → Custom domain shows old code
- Dev calls wrong API → Dev calls prod API
- Any origin accepted → CORS wildcard
- User A sees user B data → Cache data leakage
- Latency claims don't match → Performance claims wrong
- Whitelist "safe" prompts → "Safe pattern" proposals
- Detection inconsistent → Inconsistent regex detection

---

## Non-Obvious Code Patterns (Copy-Paste Ready)

### Absolute Path for dotenv (95% of "API key not found" errors):
```javascript
const path = require('path');
const os = require('os');
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });
```

### SECURITY DEFINER to break RLS recursion:
```sql
CREATE FUNCTION is_internal_user() RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tier = 'internal'); $$;
```

### Stripe webhook with raw buffer:
```javascript
export const config = { api: { bodyParser: false } };
const buf = await buffer(req);
const event = stripe.webhooks.constructEvent(buf, signature, secret);
```

### Cache key with user isolation:
```javascript
function getCacheKey(prompt, mode, profileId) {
  return crypto.createHash('md5').update(`${profileId}:${prompt}:${mode}`).digest('hex');
}
```

### Cloudflare production deployment:
```bash
wrangler pages deploy out --project-name safeprompt --branch main
```

### Next.js dev build override:
```bash
cp .env.development .env.local && npm run build && rm .env.local
```

---

**End of Pattern Reference**
