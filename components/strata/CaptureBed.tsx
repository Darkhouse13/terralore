/* ── The capture bed — the Ledger Letter's on-site intake (deviations E16) ──
   Server-only, zero client JS: a plain form POST to the listmonk instance's
   public subscription endpoint, which rides the apex first-party
   (terralore.co/subscription/form via the proxy — see
   docs/newsletter-ops.md). The confirmation page the POST lands on is the
   listmonk public surface restyled in the strata language
   (assets/listmonk/README.md).

   Two variants, one physics:
   - "bed"  — the full bed on the ledger surfaces: eyebrow, the one-line
     promise, input + subscribe, the honesty fine print.
   - "row"  — the front door's modest presence beside the dig cell: a single
     bordered row, the fine print carrying the promise.

   The `nonce` field is listmonk's honeypot — present and EMPTY, hidden from
   people and readers, filled only by naive bots. */

const FORM_ACTION = "/subscription/form";
const LEDGER_LIST_UUID = "70011fd6-48ff-40cc-bb1d-ee3164f1c76f";

function Honeypot() {
  return (
    <input
      type="text"
      name="nonce"
      defaultValue=""
      className="hidden"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
    />
  );
}

export default function CaptureBed({ variant = "bed" }: { variant?: "bed" | "row" }) {
  if (variant === "row") {
    return (
      <div className="mt-3">
        <form method="post" action={FORM_ACTION} className="flex border-2 border-basalt">
          <Honeypot />
          <input type="hidden" name="l" value={LEDGER_LIST_UUID} />
          <label htmlFor="letter-email-row" className="sr-only">
            Email address for the Ledger letter
          </label>
          <input
            id="letter-email-row"
            type="email"
            name="email"
            required
            placeholder="The Ledger, by letter — your email…"
            className="min-w-0 flex-1 bg-transparent px-4 py-[13px] font-sans text-[15px] text-basalt placeholder:text-umber"
          />
          <button
            type="submit"
            className="pressable border-l-2 border-basalt px-4 font-mono text-xs text-oxide"
          >
            SUBSCRIBE
          </button>
        </form>
        <p className="mt-2 font-mono text-[10px] text-umber">
          WHAT CHANGED IN THE RECORD · ONE LETTER PER RECORDED REFRESH · DOUBLE OPT-IN ·
          LEAVE ANYTIME
        </p>
      </div>
    );
  }

  return (
    <section className="mt-10 border-t-2 border-basalt pt-5">
      <h2 className="eyebrow text-oxide">The Ledger Letter</h2>
      <p className="mt-2 max-w-2xl font-sans text-[15px] leading-relaxed">
        What changed in the world&rsquo;s record — each recorded refresh as one letter:
        the sharpest movements, the counts, and the claim IDs to verify every line.
      </p>
      <form method="post" action={FORM_ACTION} className="mt-4 flex max-w-2xl">
        <Honeypot />
        <input type="hidden" name="l" value={LEDGER_LIST_UUID} />
        <label htmlFor="letter-email" className="sr-only">
          Email address for the Ledger letter
        </label>
        <input
          id="letter-email"
          type="email"
          name="email"
          required
          placeholder="you@…"
          className="min-w-0 flex-1 border-2 border-r-0 border-basalt bg-bone px-4 py-[11px] font-sans text-[15px] text-basalt placeholder:text-umber"
        />
        <button
          type="submit"
          className="pressable border-2 border-basalt bg-oxide px-5 font-mono text-xs tracking-[0.08em] text-bone"
        >
          SUBSCRIBE
        </button>
      </form>
      <p className="mt-3 max-w-2xl font-mono text-[10px] leading-relaxed text-umber">
        DOUBLE OPT-IN — NOTHING ARRIVES UNTIL YOU CONFIRM FROM YOUR INBOX · NO OTHER
        MAIL · LEAVE ANYTIME — UNSUBSCRIBING REMOVES YOUR ADDRESS ·{" "}
        <a href="/privacy" className="text-oxide underline underline-offset-2">
          HOW THE ADDRESS IS HANDLED
        </a>
      </p>
    </section>
  );
}
