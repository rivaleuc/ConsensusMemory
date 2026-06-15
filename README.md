# ConsensusMemory

**A shared knowledge base of AI-validated facts — claims are checked against their evidence by a validator network and can be re-validated as the truth changes.**

ConsensusMemory is a public ledger of factual claims where each entry is only as trustworthy as the network's reading of its source. Anyone posts a claim with a source URL; validators independently fetch the evidence and an LLM decides whether the claim holds and how strongly. Facts aren't frozen — anyone can re-validate, so the memory tracks a living, consensus-backed view of what's true.

- **Contract (Bradbury, chain 4221):** `0x45F6bef6812834bC17ff5798738e543FB4cA7A8E`
- **Explorer:** https://explorer-bradbury.genlayer.com/contract/0x45F6bef6812834bC17ff5798738e543FB4cA7A8E
- **Live app:** https://consensusmemory.pages.dev

## What it does

1. **`post_fact(claim, source_url)`** — a `@gl.public.write` method. Validates the claim is non-empty, runs validation, and stores a JSON record (author, claim, source, `valid`, `strength`, `reasoning`, `validations=1`) in the `facts` `TreeMap[str, str]` keyed by `fact_count`; returns the key.
2. **`revalidate(key)`** — a `@gl.public.write` method that re-runs validation against the same source, refreshes `valid` / `strength` / `reasoning`, and increments the record's `validations` counter. This is how a fact's truth-status stays current.
3. The private `_validate(claim, source_url)` builds the non-deterministic block:
   - **Validators crawl the evidence.** `leader_fn` calls `gl.nondet.web.get(source_url)` and decodes the first 4000 bytes of the body, so each validator checks the claim against the *actual* source.
   - **An LLM acts as fact-checker.** `gl.nondet.exec_prompt(prompt, response_format="json")` is given the claim and the fetched evidence and must reply `{"valid": true/false, "strength": <0-100>, "reasoning": "..."}`.
   - **Consensus via `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`.** `validator_fn` requires a `gl.vm.Return` and checks `valid` is a `bool` and `strength` is an `int` — validators agree the verdict is well-formed, not byte-identical.
4. **Reads** are free `@gl.public.view` calls: `get_fact(key)` returns the full record, and `stats()` returns `{total_facts}`.

State lives entirely in the `facts` `TreeMap`; `fact_count` is a `u256`.

## Why GenLayer

A deterministic EVM cannot fact-check. Fetching a source from the open web is non-deterministic, and deciding whether the evidence supports a claim is an act of interpretation — there is no on-chain primitive for "this statement is true." Storing claims is easy; *validating* them is the hard part a plain chain can't do.

GenLayer's **Optimistic Democracy** lets each validator fetch the source, judge the claim, and *vote* on whether the leader's verdict is acceptable. The contract owns the fact registry and the validation counters; validators supply the truth judgment.

Use ConsensusMemory when "is this true?" depends on reading and interpreting external evidence, and when that answer should be revisitable over time. Use a plain database when facts are already structured and signed by a trusted source — that does not need a validator network.

## Architecture

| GenLayer contract | Frontend dir | EVM / off-chain |
| --- | --- | --- |
| `memory/consensus_memory.py` | `memory/app/` (React + Vite) | off-chain only — the fact registry lives entirely in GenLayer storage; `memory/index.html` is a static preview |

## Tech

- **GenVM Python**, pinned to `py-genlayer:1jb45aa8…jpz09h6` via the `# { "Depends": ... }` header. Typed storage: `TreeMap[str, str]` plus a `u256` counter.
- **`genlayer-js`** handles all reads (`client.readContract`) against `testnetBradbury`. Writes use **MetaMask with no Snap** — the app drives `window.ethereum`, ensures **chain 4221** (`0x107d`, auto-adding the Bradbury network), submits via `client.writeContract`, and waits for `FINALIZED`.
- **App-specific UI:** a React 19 + Vite knowledge base (Tailwind v4, `framer-motion`, `sonner`) — post a claim with its source, browse validated facts with their validity/strength, and trigger re-validation.

## Project structure

```
ConsensusMemory/
├── memory/
│   ├── consensus_memory.py       ← GenLayer contract (fact validation)
│   ├── index.html                ← static preview
│   └── app/                      ← frontend (Cloudflare Pages root)
│       ├── src/
│       │   ├── App.tsx           ← post / browse / revalidate UI
│       │   ├── genlayer.ts       ← client, wallet, read/write helpers
│       │   ├── main.tsx
│       │   └── index.css
│       ├── public/
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
└── README.md
```

## Develop

```bash
cd memory/app
npm install
npm run dev      # local dev server (Vite)
npm run build    # type-check + production build to dist/
```

## Deploy the frontend

Cloudflare Pages:

- **Root directory:** `memory/app`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `NODE_VERSION=20`

## Why GenLayer (engineering notes)

Real gotchas learned building this:

- **Integers, not floats.** `strength` is an `int` in `[0, 100]` and `validator_fn` rejects a non-int strength; `fact_count` and `validations` are integers too. Confidence-as-integer keeps validators byte-stable.
- **Validate structure, not exact LLM output.** `validator_fn` only checks `valid` is a `bool` and `strength` is an `int`. It never compares the `reasoning` string, which legitimately differs across validators reading the same source.
- **ACCEPTED ≠ executed.** Consensus means validators accepted the verdict's validity; a fact being marked `valid` is a recorded judgment, not a guarantee any downstream action ran.
- **Optimistic finality has an appeal window.** A `post_fact` or `revalidate` result is provisional until the appeal window elapses; the frontend waits for `FINALIZED` before treating a fact's status as settled.
- **Evidence is untrusted (greybox).** The source is fetched from a user-supplied URL; the prompt treats the fetched evidence as adversarial input (a source can't be allowed to "assert" its own claim true), and fetch failures degrade to `(no source)` rather than crashing validation.

## License

MIT
