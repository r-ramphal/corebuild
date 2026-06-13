import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Gedeelde tekstcomponenten voor blogposts — in de CoreBuild-huisstijl, zonder
 * markdown/MDX-afhankelijkheden. Posts (src/content/blog/*) stellen hun body
 * hiermee samen, zodat alle artikelen consistent ogen.
 */

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="font-body-lg text-body-lg text-on-surface leading-relaxed mb-8">{children}</p>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-title-md text-title-md text-on-surface mt-10 mb-3 scroll-mt-24">{children}</h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-4">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 mb-4 font-body-lg text-body-lg text-on-surface-variant marker:text-outline">
      {children}
    </ul>
  );
}

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="my-6 rounded-xl border-l-4 border-primary bg-primary/[0.05] p-4 sm:p-5">
      {title && (
        <p className="font-title-md text-[14px] text-on-surface mb-1">{title}</p>
      )}
      <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{children}</div>
    </div>
  );
}

/** In-tekst link, intern of extern. */
export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="text-primary hover:underline">
      {children}
    </Link>
  );
}

/** Afsluitende call-to-action onder een artikel. */
export function CTA({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <div className="mt-10 rounded-xl border border-outline-variant bg-surface-container-low p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="font-body-lg text-body-lg text-on-surface">{children}</p>
      <Link
        href={href}
        className="shrink-0 px-5 py-2.5 bg-primary text-on-primary font-label-technical text-label-technical rounded-lg hover:opacity-90 transition-opacity text-center"
      >
        {label}
      </Link>
    </div>
  );
}
