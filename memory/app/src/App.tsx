import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";

const CONTRACT = "0x45F6bef6812834bC17ff5798738e543FB4cA7A8E";

type Verdict = {
  valid: boolean;
  strength: number;
  reasoning: string;
  validations: number;
};

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

const FACTS = [
  { claim: "The Antikythera mechanism is the earliest known analog computer.", source: "British Museum", valid: true, strength: 97, validations: 12 },
  { claim: "Honey never spoils under proper storage conditions.", source: "Smithsonian", valid: true, strength: 88, validations: 9 },
  { claim: "The Great Wall of China is visible from space with the naked eye.", source: "NASA", valid: false, strength: 14, validations: 21 },
  { claim: "Octopuses have three hearts and blue blood.", source: "Marine Biology Rev.", valid: true, strength: 94, validations: 7 },
  { claim: "Goldfish have a three-second memory span.", source: "Animal Cognition", valid: false, strength: 22, validations: 15 },
  { claim: "Light takes about 8 minutes to travel from the Sun to Earth.", source: "ESA", valid: true, strength: 99, validations: 18 },
];

const STEPS = [
  { n: "I", title: "Submit a claim", body: "Contribute a fact along with a source the network can independently read." },
  { n: "II", title: "AI validation", body: "Validators fetch the evidence and judge the claim's truth, assigning a strength score." },
  { n: "III", title: "Evolve over time", body: "Facts are re-validated as new evidence emerges; strength rises or falls with the record." },
];

const FEATURES = [
  { title: "Evidence-bound", body: "Every fact is tied to a source and judged against it — no unsupported assertions." },
  { title: "Validity strength", body: "A 0–100 score expresses how strongly the evidence backs each claim." },
  { title: "Living knowledge", body: "Re-validation lets the archive correct itself as understanding improves." },
  { title: "Consensus-checked", body: "Independent validators must agree before a fact enters the shared memory." },
  { title: "Cited reasoning", body: "Each verdict carries a written rationale, so trust is transparent." },
  { title: "Open archive", body: "Anyone can read the canon and propose a claim for the collective record." },
];

function StrengthMeter({ value, valid }: { value: number; valid: boolean }) {
  const color = valid ? "#312E81" : "#9a3b3b";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-[#312E81]/60">
        <span>Validity strength</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#312E81]/10">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [claim, setClaim] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Verdict | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!claim.trim()) {
      toast.error("A claim is required.");
      return;
    }
    setLoading(true);
    setResult(null);
    toast("Submitting to validators…", { description: "Fetching evidence and weighing the claim." });

    setTimeout(() => {
      const dubious = /always|never|everyone|nobody|cure|proves everything|100%/i.test(claim);
      const verdict: Verdict = dubious
        ? {
            valid: false,
            strength: 27,
            validations: 1,
            reasoning:
              "The claim overgeneralises beyond what the cited evidence supports. Counter-examples exist, so it cannot enter the canon at full strength.",
          }
        : {
            valid: true,
            strength: 91,
            validations: 1,
            reasoning:
              "The cited source corroborates the claim and no contradicting evidence was found. It is admitted to the shared memory with high validity strength.",
          };
      setResult(verdict);
      setLoading(false);
      toast[verdict.valid ? "success" : "error"](
        verdict.valid ? "Validated" : "Not validated",
        { description: `Strength: ${verdict.strength}%` }
      );
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#1f1d2b] antialiased" style={{ fontFamily: "Inter, sans-serif" }}>
      <Toaster position="top-center" richColors />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#312E81]/12 bg-[#FBFAF7]/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#312E81] text-sm text-[#FBFAF7]" style={{ fontFamily: "'Spectral', serif" }}>
              CM
            </span>
            <span className="text-lg text-[#312E81]" style={{ fontFamily: "'Spectral', serif" }}>
              Consensus<span className="font-semibold">Memory</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-[#1f1d2b]/65 md:flex">
            <a href="#canon" className="hover:text-[#312E81]">The canon</a>
            <a href="#how" className="hover:text-[#312E81]">How it works</a>
            <a href="#features" className="hover:text-[#312E81]">Features</a>
            <a href="#submit" className="rounded-full bg-[#312E81] px-4 py-2 text-[#FBFAF7] transition hover:bg-[#312E81]/90">
              Submit a fact
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.7 }}>
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-[#312E81]/60">A knowledge base that evolves</p>
            <h1 className="text-5xl leading-[1.06] text-[#1f1d2b] md:text-6xl" style={{ fontFamily: "'Spectral', serif" }}>
              A shared memory of <span className="text-[#312E81]">what is true</span>.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#1f1d2b]/70">
              ConsensusMemory is a collective archive where every fact is validated by AI against its sources — and re-examined over time as understanding deepens.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#submit" className="rounded-full bg-[#312E81] px-7 py-3 text-sm text-[#FBFAF7] transition hover:bg-[#312E81]/90">
                Contribute a fact
              </a>
              <a href="#canon" className="text-sm text-[#312E81] underline-offset-4 hover:underline">
                Browse the canon →
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="rounded-2xl border border-[#312E81]/15 bg-white p-7 shadow-[0_30px_60px_-35px_rgba(49,46,129,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#312E81]/55">Entry · verified</span>
              <span className="rounded-full bg-[#312E81]/10 px-3 py-1 text-xs text-[#312E81]">18 validations</span>
            </div>
            <p className="text-xl leading-snug text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}>
              “Light takes about 8 minutes to travel from the Sun to Earth.”
            </p>
            <p className="mt-2 text-sm text-[#1f1d2b]/55">Source: ESA</p>
            <div className="mt-5">
              <StrengthMeter value={99} valid={true} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Canon / fact cards */}
      <section id="canon" className="border-y border-[#312E81]/12 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}>From the canon</h2>
            <p className="mt-3 max-w-xl text-[#1f1d2b]/65">A selection of entries, each carrying its validity strength and validation count.</p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FACTS.map((f, i) => (
              <motion.article
                key={f.claim}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.06 }}
                className="flex flex-col justify-between rounded-xl border border-[#312E81]/12 bg-[#FBFAF7] p-6"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-[11px] ${f.valid ? "bg-[#312E81]/10 text-[#312E81]" : "bg-[#9a3b3b]/10 text-[#9a3b3b]"}`}>
                      {f.valid ? "✓ Validated" : "✕ Disputed"}
                    </span>
                    <span className="text-[11px] text-[#1f1d2b]/45">{f.validations} checks</span>
                  </div>
                  <p className="text-lg leading-snug text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}>
                    {f.claim}
                  </p>
                  <p className="mt-2 text-xs text-[#1f1d2b]/50">Source: {f.source}</p>
                </div>
                <div className="mt-5">
                  <StrengthMeter value={f.strength} valid={f.valid} />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <motion.h2
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}
          className="text-4xl text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}
        >
          How a fact enters memory
        </motion.h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#312E81]/30 text-xl text-[#312E81]" style={{ fontFamily: "'Spectral', serif" }}>{s.n}</div>
              <h3 className="mt-4 text-xl text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}>{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1f1d2b]/65">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-[#312E81]/12 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}
            className="text-4xl text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}
          >
            A scholarly record you can trust
          </motion.h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.45, delay: i * 0.05 }}
                className="rounded-xl border border-[#312E81]/12 bg-[#FBFAF7] p-7"
              >
                <h3 className="text-xl text-[#312E81]" style={{ fontFamily: "'Spectral', serif" }}>{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1f1d2b]/65">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Submit form */}
      <section id="submit" className="mx-auto max-w-3xl px-6 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center">
          <h2 className="text-4xl text-[#1f1d2b]" style={{ fontFamily: "'Spectral', serif" }}>Submit a fact for validation</h2>
          <p className="mt-3 text-[#1f1d2b]/65">Propose a claim with its source and receive a validity verdict.</p>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10 space-y-5 rounded-2xl border border-[#312E81]/15 bg-white p-8"
        >
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-[#312E81]/55">Claim</label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={3}
              placeholder="State a fact to be validated…"
              className="w-full resize-none rounded-lg border border-[#312E81]/20 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition focus:border-[#312E81]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-[#312E81]/55">Source URL</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://source.example/reference"
              className="w-full rounded-lg border border-[#312E81]/20 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition focus:border-[#312E81]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#312E81] px-6 py-3.5 text-sm text-[#FBFAF7] transition hover:bg-[#312E81]/90 disabled:opacity-60"
          >
            {loading ? "Validating…" : "Validate this claim"}
          </button>

          {loading && (
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-[#312E81]/60">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#312E81]" />
              Fetching evidence · validators reaching consensus…
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`mt-2 rounded-xl border-l-4 bg-[#FBFAF7] p-6 ${result.valid ? "border-[#312E81]" : "border-[#9a3b3b]"}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`text-2xl ${result.valid ? "text-[#312E81]" : "text-[#9a3b3b]"}`} style={{ fontFamily: "'Spectral', serif" }}>
                  {result.valid ? "Validated" : "Not validated"}
                </span>
                <span className="text-xs text-[#1f1d2b]/50">{result.validations} validation</span>
              </div>
              <StrengthMeter value={result.strength} valid={result.valid} />
              <p className="mt-4 text-sm leading-relaxed text-[#1f1d2b]/75">{result.reasoning}</p>
            </motion.div>
          )}
        </motion.form>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#312E81]/12 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg text-[#312E81]" style={{ fontFamily: "'Spectral', serif" }}>Consensus<span className="font-semibold">Memory</span></p>
            <p className="mt-1 text-sm text-[#1f1d2b]/55">A shared archive of validated knowledge, evolving over time.</p>
          </div>
          <div className="text-sm text-[#1f1d2b]/55">
            <p className="uppercase tracking-[0.2em] text-[#312E81]/45">Contract</p>
            <p className="mt-1 break-all font-mono text-xs text-[#312E81]">{CONTRACT}</p>
          </div>
        </div>
        <div className="border-t border-[#312E81]/12 py-5 text-center text-xs text-[#1f1d2b]/45">
          © {new Date().getFullYear()} ConsensusMemory. Knowledge, validated and preserved.
        </div>
      </footer>
    </div>
  );
}
