"""
Minimal OpenAI-compatible shim so AgentDojo's vllm_parsed provider can drive an
OpenRouter model. AgentDojo hardcodes base_url=http://localhost:PORT/v1, so a
local shim is the non-invasive way in: nothing in the installed package is edited.

Serves /v1/models and /v1/chat/completions, forwarding to OpenRouter and injecting
the API key server-side so it never reaches AgentDojo's process or its logs.
"""
import json, os, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import urllib.request

PORT = int(os.environ.get("LOCAL_LLM_PORT", "8000"))
MODEL = os.environ.get("PROXY_MODEL", "meta-llama/llama-3.3-70b-instruct")
KEY = os.environ["OPENROUTER_API_KEY"]
UP = "https://openrouter.ai/api/v1"


class H(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.rstrip("/").endswith("/models"):
            return self._send(200, {"object": "list",
                                    "data": [{"id": MODEL, "object": "model", "owned_by": "openrouter"}]})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(n) or b"{}")
        body["model"] = MODEL
        body.pop("stream", None)
        req = urllib.request.Request(
            f"{UP}/chat/completions",
            data=json.dumps(body).encode(),
            headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return self._send(200, json.loads(r.read()))
        except urllib.error.HTTPError as e:
            return self._send(e.code, {"error": e.read()[:400].decode("utf-8", "replace")})
        except Exception as e:
            return self._send(502, {"error": str(e)})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"proxy on :{PORT} -> {MODEL}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
