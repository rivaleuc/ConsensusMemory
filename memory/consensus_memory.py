# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *

class ConsensusMemory(gl.Contract):
    facts: TreeMap[str, str]
    fact_count: u256

    def __init__(self):
        self.fact_count = u256(0)

    @gl.public.write
    def post_fact(self, claim: str, source_url: str) -> str:
        claim = str(claim).strip()
        if not claim: raise Exception("claim required")
        verdict = self._validate(claim, source_url)
        key = str(int(self.fact_count))
        record = {"author": str(gl.message.sender_address), "claim": claim[:1000], "source": str(source_url).strip(), "valid": verdict["valid"], "strength": verdict["strength"], "reasoning": verdict["reasoning"], "validations": 1}
        self.facts[key] = json.dumps(record)
        self.fact_count += u256(1)
        return key

    @gl.public.write
    def revalidate(self, key: str) -> None:
        key = str(key)
        if key not in self.facts: raise Exception("unknown fact")
        fact = json.loads(self.facts[key])
        verdict = self._validate(fact["claim"], fact["source"])
        fact["valid"] = verdict["valid"]; fact["strength"] = verdict["strength"]; fact["reasoning"] = verdict["reasoning"]; fact["validations"] += 1
        self.facts[key] = json.dumps(fact)

    def _validate(self, claim, source_url):
        def leader_fn() -> str:
            evidence = "(no source)"
            if source_url and str(source_url).startswith("http"):
                try: evidence = gl.nondet.web.get(str(source_url)).body.decode("utf-8")[:4000]
                except: pass
            prompt = f"""Validate this fact against evidence.\nCLAIM: {claim}\nEVIDENCE:\n{evidence}\n\nReply JSON: {{"valid": true/false, "strength": <0-100>, "reasoning": "<brief>"}}"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(raw) if isinstance(raw, dict) else str(raw).strip()
        def validator_fn(r) -> bool:
            if not isinstance(r, gl.vm.Return): return False
            try: d = json.loads(r.calldata); return isinstance(d.get("valid"), bool) and isinstance(d.get("strength"), int)
            except: return False
        return json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))

    @gl.public.view
    def get_fact(self, key: str) -> dict:
        key = str(key)
        if key not in self.facts: return {"exists": False}
        return json.loads(self.facts[key])

    @gl.public.view
    def stats(self) -> dict:
        return {"total_facts": int(self.fact_count)}
