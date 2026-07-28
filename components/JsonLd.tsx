/**
 * Emits a schema.org JSON-LD block. Server-only — the payload must be in the
 * initial HTML, since the crawlers that matter for citation do not run our JS.
 *
 * `JSON.stringify` is XSS-safe here only after escaping `<`, which is the one
 * sequence that can break out of a <script> element.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
