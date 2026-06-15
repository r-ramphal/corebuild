/**
 * Rendert schema.org structured data als <script type="application/ld+json">.
 * Volgt de Next-aanbeveling (native script-tag) en escaped het kleiner-dan-teken
 * naar zijn unicode-vorm tegen XSS bij JSON.stringify. Geen hooks → server- én
 * client-veilig.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
