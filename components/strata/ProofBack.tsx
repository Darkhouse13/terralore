import type { ReactNode } from "react";

/**
 * The standard basalt reverse of a flipped specimen: the observation line
 * engraved in the instrument voice, with an optional second line (a metric
 * definition, a method note — always sourced language, never invented) in
 * clay. Server-safe; layout only — ProofFlip supplies the basalt ground
 * via .flip-back.
 */
export default function ProofBack({
  line,
  note,
  padding = "7px 12px",
}: {
  line: string;
  note?: ReactNode;
  padding?: string;
}) {
  return (
    <div
      className="flex h-full flex-col justify-center gap-[3px]"
      style={{ padding }}
    >
      <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase">{line}</div>
      {note ? (
        <div className="font-sans text-[11.5px] leading-snug text-clay">{note}</div>
      ) : null}
    </div>
  );
}
