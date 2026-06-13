import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { read, write, CONTRACT } from "./genlayer";

type Category =
  | "Science"
  | "History"
  | "Technology"
  | "Geography"
  | "Economics";

interface Fact {
  key: string;
  claim: string;
  body: string;
  category: Category;
  validity: number; // 0-100 consensus strength
  valid: boolean;
  source: string;
  validations: number;
}

const CATEGORIES: Category[] = [
  "Science",
  "History",
  "Technology",
  "Geography",
  "Economics",
];

// Normalise a 0-1 or 0-100 value into a 0-100 integer.
function pct(v: any) {
  let n = Number(v ?? 0);
  if (!Number.isFinite(n)) n = 0;
  if (n > 0 && n <= 1) n *= 100;
  return Math.round(n);
}

function factFrom(i: number, raw: any): Fact {
  return {
    key: String(i),
    claim: String(raw?.claim ?? ""),
    body: String(raw?.reasoning ?? "Awaiting validator reasoning."),
    category: CATEGORIES[i % CATEGORIES.length],
    validity: pct(raw?.strength),
    valid: Boolean(raw?.valid),
    source: String(raw?.source ?? ""),
    validations: Number(raw?.validations ?? 0),
  };
}

const validityTone = (v: number) =>
  v >= 80
    ? { label: "Strong consensus", color: "#1f7a4d", bg: "#e3f3ea" }
    : v >= 55
      ? { label: "Emerging", color: "#9a6b00", bg: "#f6eed8" }
      : { label: "Contested", color: "#9a2c2c", bg: "#f6e0e0" };

function StrengthMeter({ value }: { value: number }) {
  const tone = validityTone(value);
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium" style={{ color: tone.color }}>
          {tone.label}
        </span>
        <span className="font-mono text-[#312E81]/60">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#312E81]/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: tone.color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}

function App() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<Category | "All">("All");
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({
    claim: "",
    body: "",
    category: "Science" as Category,
    source: "",
  });

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: facts.length };
    CATEGORIES.forEach((c) => (m[c] = facts.filter((f) => f.category === c).length));
    return m;
  }, [facts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facts
      .filter((f) => (activeCat === "All" ? true : f.category === activeCat))
      .filter(
        (f) =>
          !q ||
          f.claim.toLowerCase().includes(q) ||
          f.body.toLowerCase().includes(q)
      );
  }, [facts, query, activeCat]);

  async function loadFacts() {
    setLoading(true);
    try {
      const stats = (await read("stats")) as any;
      const total = Number(stats?.total_facts ?? 0);
      const loaded: Fact[] = [];
      for (let i = 0; i < total; i++) {
        try {
          const raw = (await read("get_fact", [String(i)])) as any;
          if (raw) loaded.push(factFrom(i, raw));
        } catch {
          // skip
        }
      }
      setFacts(loaded.reverse());
    } catch (e: any) {
      toast.error(`Failed to load facts: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revalidate = async (key: string) => {
    setRevalidating(key);
    toast.loading("Re-validating against current sources… (30–60s)", { id: `rv-${key}` });
    try {
      await write("revalidate", [key]);
      const raw = (await read("get_fact", [key])) as any;
      setFacts((fs) =>
        fs.map((f) =>
          f.key === key
            ? {
                ...f,
                validity: pct(raw?.strength),
                valid: Boolean(raw?.valid),
                body: String(raw?.reasoning ?? f.body),
                validations: Number(raw?.validations ?? f.validations),
              }
            : f
        )
      );
      toast.success("Consensus strength updated.", { id: `rv-${key}` });
    } catch (e: any) {
      toast.error(`Re-validation failed: ${e?.message ?? e}`, { id: `rv-${key}` });
    } finally {
      setRevalidating(null);
    }
  };

  const submitFact = async () => {
    if (!draft.claim.trim() || !draft.source.trim()) {
      toast.error("A claim and a source citation are required.");
      return;
    }
    setSubmitting(true);
    const tid = toast.loading("Submitting fact for validation… (30–60s)");
    try {
      await write("post_fact", [draft.claim.trim(), draft.source.trim()]);
      const stats = (await read("stats")) as any;
      const total = Number(stats?.total_facts ?? 0);
      try {
        const raw = (await read("get_fact", [String(total - 1)])) as any;
        const f = factFrom(total - 1, raw);
        toast.success(
          `Fact contributed — ${f.valid ? "validated" : "contested"} at ${f.validity}% strength.`,
          { id: tid }
        );
      } catch {
        toast.success("Fact contributed to the archive.", { id: tid });
      }
      setDraft({ claim: "", body: "", category: "Science", source: "" });
      setComposing(false);
      await loadFacts();
    } catch (e: any) {
      toast.error(`Submit failed: ${e?.message ?? e}`, { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#1f1d2b]" style={{ fontFamily: "'Spectral', Georgia, serif" }}>
      <Toaster position="top-center" richColors />

      {/* archive masthead + search */}
      <header className="border-b border-[#312E81]/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl text-[#312E81]">❧</span>
              <h1 className="text-2xl font-semibold tracking-tight text-[#312E81]">
                ConsensusMemory
              </h1>
              <span className="hidden text-sm italic text-[#312E81]/50 sm:inline">
                a living archive of validated knowledge
              </span>
            </div>
            <button
              onClick={() => setComposing(true)}
              className="rounded-md bg-[#312E81] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3d3a9e]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              + Contribute fact
            </button>
          </div>

          {/* big centered wiki search */}
          <div className="relative mx-auto max-w-2xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#312E81]/40">
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the archive — claims, topics, evidence…"
              className="w-full rounded-full border-2 border-[#312E81]/15 bg-white py-3.5 pl-12 pr-4 text-lg text-[#1f1d2b] shadow-sm outline-none transition focus:border-[#312E81]/50"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[200px_1fr]">
        {/* left category sidebar */}
        <aside className="md:sticky md:top-6 md:self-start">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#312E81]/50"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Categories
          </p>
          <ul className="space-y-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            {(["All", ...CATEGORIES] as const).map((c) => (
              <li key={c}>
                <button
                  onClick={() => setActiveCat(c)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition ${
                    activeCat === c
                      ? "bg-[#312E81] text-white"
                      : "text-[#312E81]/70 hover:bg-[#312E81]/5"
                  }`}
                >
                  <span>{c}</span>
                  <span
                    className={`text-xs ${
                      activeCat === c ? "text-white/70" : "text-[#312E81]/40"
                    }`}
                  >
                    {counts[c] ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-md border border-[#312E81]/10 bg-white p-3 text-xs text-[#312E81]/60">
            <p className="mb-1 font-semibold text-[#312E81]/80" style={{ fontFamily: "'Inter', sans-serif" }}>
              On-chain registry
            </p>
            <p className="break-all font-mono text-[10px]">{CONTRACT}</p>
          </div>
        </aside>

        {/* fact entry list */}
        <main>
          <div className="mb-4 flex items-baseline justify-between border-b border-[#312E81]/10 pb-2">
            <h2 className="text-lg font-semibold text-[#312E81]">
              {activeCat === "All" ? "All entries" : activeCat}
            </h2>
            <span className="text-sm text-[#312E81]/50">
              {loading ? "loading…" : `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`}
            </span>
          </div>

          <div className="space-y-7">
            <AnimatePresence>
              {visible.map((f) => (
                <motion.article
                  key={f.key}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-[#312E81]/10 pb-6 last:border-0"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#312E81]"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        backgroundColor: "#312E8115",
                      }}
                    >
                      {f.category}
                    </span>
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: f.valid ? "#1f7a4d" : "#9a2c2c",
                        backgroundColor: f.valid ? "#e3f3ea" : "#f6e0e0",
                      }}
                    >
                      {f.valid ? "✓ valid" : "✕ contested"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold leading-snug text-[#1f1d2b]">
                    {f.claim}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#1f1d2b]/75">
                    {f.body}
                  </p>

                  <div className="mt-3 max-w-sm">
                    <StrengthMeter value={f.validity} />
                  </div>

                  <div
                    className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#312E81]/60"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <span>
                      <span className="text-[#312E81]/40">Source:</span>{" "}
                      <cite className="not-italic">{f.source}</cite>
                    </span>
                    <span>
                      <span className="text-[#312E81]/40">Validations:</span>{" "}
                      {f.validations}
                    </span>
                    <button
                      onClick={() => revalidate(f.key)}
                      disabled={revalidating === f.key}
                      className="ml-auto rounded border border-[#312E81]/30 px-2.5 py-1 font-medium text-[#312E81] transition hover:bg-[#312E81]/5 disabled:opacity-50"
                    >
                      {revalidating === f.key ? "validating…" : "↻ Re-validate"}
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            {!loading && visible.length === 0 && (
              <p className="py-16 text-center italic text-[#312E81]/40">
                No entries match this search.
              </p>
            )}
            {loading && (
              <p className="py-16 text-center italic text-[#312E81]/40">
                Loading the archive from chain…
              </p>
            )}
          </div>
        </main>
      </div>

      {/* contribute-fact modal */}
      <AnimatePresence>
        {composing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1d2b]/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setComposing(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-lg bg-[#FBFAF7] p-6 shadow-2xl"
            >
              <h3 className="mb-1 text-xl font-semibold text-[#312E81]">
                Contribute a fact
              </h3>
              <p className="mb-4 text-sm italic text-[#312E81]/55">
                New entries are validated on-chain by the consensus network.
              </p>
              <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <input
                  value={draft.claim}
                  onChange={(e) => setDraft({ ...draft, claim: e.target.value })}
                  placeholder="The claim (stated as a heading)"
                  className="w-full rounded-md border border-[#312E81]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#312E81]/50"
                />
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={3}
                  placeholder="Supporting elaboration (optional)"
                  className="w-full resize-none rounded-md border border-[#312E81]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#312E81]/50"
                />
                <div className="flex gap-3">
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value as Category })
                    }
                    className="w-1/2 rounded-md border border-[#312E81]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#312E81]/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    value={draft.source}
                    onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                    placeholder="Source citation / URL"
                    className="w-1/2 rounded-md border border-[#312E81]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#312E81]/50"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <button
                  onClick={() => setComposing(false)}
                  disabled={submitting}
                  className="rounded-md px-4 py-2 text-sm text-[#312E81]/60 transition hover:text-[#312E81] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFact}
                  disabled={submitting}
                  className="rounded-md bg-[#312E81] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3d3a9e] disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit to archive"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
