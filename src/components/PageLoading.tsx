/**
 * Laadweergave voor route-overgangen (Next `loading.tsx`). Verschijnt direct
 * zodra je op een link klikt, terwijl de bestemmingspagina laadt. Oranje
 * spinner + skeleton in de huisstijl; reduced-motion-veilig.
 */
export function PageLoading({ label = "Laden…" }: { label?: string }) {
  return (
    <main
      role="status"
      aria-label={label}
      className="pt-24 pb-16 px-4 sm:px-8 max-w-[1280px] mx-auto w-full min-h-screen"
    >
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <span
          aria-hidden
          className="inline-block w-9 h-9 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin motion-reduce:animate-none"
        />
        <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
      </div>
      <div className="space-y-3 max-w-3xl mx-auto" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-container animate-pulse" />
        ))}
      </div>
    </main>
  );
}
