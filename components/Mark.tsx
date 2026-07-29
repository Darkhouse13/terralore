import { useId } from "react";

/**
 * The Terralore mark — the STRATUM sphere cut in section, as an inline SVG.
 *
 * Same geometry as the favicon and the touch icon (scripts/build-icon.mjs);
 * this is the in-page form, used in the landing header and the journey badge.
 * It replaced two copper compass roses — the old identity's logo, which
 * survived the redesign in inline SVG form because a compass drawn in the new
 * palette still greps as nothing but `<svg>`.
 *
 * Transparent ground, ringed by the shoal, so it sits directly on the deep or
 * on limestone without a plate behind it. `useId` keys the clipPath so several
 * marks on one page cannot collide.
 */
export default function Mark({ size = 24 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="24" cy="24" r="22" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x="2" y="2" width="44" height="12.4" fill="#ebe9e0" />
        <rect x="2" y="14.3" width="44" height="4" fill="#c87244" />
        <rect x="2" y="18.3" width="44" height="4.4" fill="#082230" />
        <rect x="2" y="22.7" width="44" height="5.3" fill="#57a695" />
        <rect x="2" y="28" width="44" height="18" fill="#082230" />
      </g>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#276f80" strokeWidth="2.4" />
    </svg>
  );
}
