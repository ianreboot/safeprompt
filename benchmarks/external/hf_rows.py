"""Fetch every row of a public HuggingFace dataset split through the datasets-server
rows API (stdlib only). Used by the deepset, NotInject and Gandalf builders."""
import json, time, urllib.parse, urllib.request

API = "https://datasets-server.huggingface.co/rows"


def fetch(dataset, split, config="default", page=100):
    out, off = [], 0
    while True:
        q = urllib.parse.urlencode({"dataset": dataset, "config": config, "split": split,
                                    "offset": off, "length": page})
        req = urllib.request.Request(f"{API}?{q}", headers={"User-Agent": "safeprompt-benchmark"})
        for attempt in range(5):
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    d = json.load(r)
                break
            except Exception:
                if attempt == 4:
                    raise
                time.sleep(2 * (attempt + 1))
        rows = d.get("rows", [])
        if not rows:
            return out
        out.extend(dict(r["row"], _split=split, _config=config) for r in rows)
        off += len(rows)
        if off >= d.get("num_rows_total", off):
            return out
