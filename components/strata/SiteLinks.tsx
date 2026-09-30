import Link from "next/link";
import { routes, SOCIAL } from "@/lib/seo";

/**
 * The site's small print and its channels — the front door's closing row
 * (deviations E18). Server-only, mono fine-print voice. The YouTube mark is
 * drawn monochrome in basalt (YouTube's brand rules allow the one-colour
 * icon; the strata palette has no red), and carries the word beside it so
 * the link never depends on the icon.
 */
export default function SiteLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Site" className={`flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.08em] ${className}`}>
      <Link href={routes.privacy()} prefetch={false} className="text-oxide">
        PRIVACY
      </Link>
      <Link href={routes.terms()} prefetch={false} className="text-oxide">
        TERMS
      </Link>
      <a href={SOCIAL.youtube} rel="me noopener" className="flex items-center gap-1.5 text-oxide">
        <svg aria-hidden width="14" height="10" viewBox="0 0 14 10">
          <rect width="14" height="10" rx="2.6" fill="#221e19" />
          <path d="M5.6 2.8v4.4L9.4 5z" fill="#efe7d8" />
        </svg>
        YOUTUBE
      </a>
      <a href={SOCIAL.instagram} rel="me noopener" className="text-oxide">
        INSTAGRAM
      </a>
    </nav>
  );
}
