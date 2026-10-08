"""
Rebuild the NotInject, Lakera Gandalf and deepset case sets scored on 12 September 2026.

All three come from public HuggingFace datasets, fetched whole through the
datasets-server rows API. One shared random.Random(20260912) shuffles them, in this
order: NotInject, then Gandalf, then deepset. The order matters, because each shuffle
advances the same generator; build all three in one run.

Writes, per set, cases-full.json and cases-pilot.json into its own directory:
  * NotInject, 339 benign prompts (all three splits). Pilot = first 100 of the shuffle.
  * Gandalf (Lakera/gandalf_ignore_instructions), 1000 attack prompts (all splits).
    Pilot = first 100 of the shuffle. Only the pilot was scored.
  * deepset/prompt-injections, 662 prompts (train + test), label 1 = injection.
    Pilot = first 50 injections plus first 50 benign, in shuffle order.

Case IDs are SHA-256 prefixes of the prompt text (runner_common.case_id), so every
verdict in the committed results files rehashes to the upstream row.
"""
import json, os, random, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from runner_common import case_id
from hf_rows import fetch

SEED = 20260912


def rows(dataset, splits):
    return [r for s in splits for r in fetch(dataset, s)]


def notinject_cases():
    out = []
    for r in rows("leolee99/NotInject", ["NotInject_one", "NotInject_two", "NotInject_three"]):
        out.append({"id": case_id(r["prompt"]), "prompt": r["prompt"], "expect_flagged": False,
                    "meta": {"source": "notinject", "group": r["category"], "split": r["_split"],
                             "words": r["word_list"]}})
    return out


def gandalf_cases():
    return [{"id": case_id(r["text"]), "prompt": r["text"], "expect_flagged": True,
             "meta": {"source": "gandalf_ignore_instructions", "group": r["_split"]}}
            for r in rows("Lakera/gandalf_ignore_instructions", ["train", "validation", "test"])]


def deepset_cases():
    out = []
    for r in rows("deepset/prompt-injections", ["train", "test"]):
        inj = int(r["label"]) == 1
        out.append({"id": case_id(r["text"]), "prompt": r["text"], "expect_flagged": inj,
                    "meta": {"source": "deepset_prompt_injections",
                             "group": "injection" if inj else "benign", "split": r["_split"]}})
    return out


def write(name, full, pilot):
    d = os.path.join(HERE, name)
    os.makedirs(d, exist_ok=True)
    json.dump(full, open(os.path.join(d, "cases-full.json"), "w"), indent=1)
    json.dump(pilot, open(os.path.join(d, "cases-pilot.json"), "w"), indent=1)
    print(f"  {name}: {len(full)} full, {len(pilot)} pilot")


if __name__ == "__main__":
    rng = random.Random(SEED)
    ni = notinject_cases(); rng.shuffle(ni)
    ga = gandalf_cases(); rng.shuffle(ga)
    ds = deepset_cases(); rng.shuffle(ds)
    write("notinject", ni, ni[:100])
    write("gandalf", ga, ga[:100])
    write("deepset", ds, [c for c in ds if c["expect_flagged"]][:50] +
          [c for c in ds if not c["expect_flagged"]][:50])
