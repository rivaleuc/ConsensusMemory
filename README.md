# ConsensusMemory

ConsensusMemory is a protocol-level shared knowledge base on GenLayer. Instead of storing static data, it stores facts whose validity evolves over time. Anyone can post a claim with a source, AI validators fetch evidence and judge its truth. Facts can be revalidated as the world changes, strengthening or weakening over consecutive checks.

## Why GenLayer

Fact validation requires fetching live sources and interpreting whether they support a claim. A deterministic VM cannot read a Wikipedia page and decide if it confirms a height measurement. GenLayer validators independently fetch evidence and reach consensus on validity, creating a shared memory that reflects what is collectively believed to be true right now.

## Deployed

**GenLayer (Bradbury):** `0x45F6bef6812834bC17ff5798738e543FB4cA7A8E`

## Test

Posted: "Eiffel Tower is 330 meters tall" → valid=false (Wikipedia returned incomplete HTML). Correct behavior: no evidence = no validation.

## Structure

```
ConsensusMemory/
├── memory/
│   ├── consensus_memory.py  ← GenLayer contract
│   └── index.html           ← Frontend
└── .gitignore
```
