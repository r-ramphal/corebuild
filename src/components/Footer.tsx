import Link from "next/link";

const LINKS = [
  { href: "/galerij", label: "Buildgalerij" },
  { href: "/community", label: "Community" },
  { href: "/volglijst", label: "Volglijst" },
  { href: "/blog", label: "Blog" },
  { href: "/over", label: "Over CoreBuild" },
  { href: "/over#privacy", label: "Privacy" },
  { href: "/over#affiliate", label: "Affiliate disclaimer" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-gp-bg text-gp-ink border-t border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10 gp-rule-x flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-mont font-extrabold text-[18px]">
            Core<span className="text-gp-orange">Build</span>
          </span>
          <span className="font-plex text-[12px] text-gp-ink-soft max-w-xs">
            <span className="text-gp-orange">_</span>deelnemer aan affiliate-programma&apos;s. Prijzen indicatief.
          </span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="font-plex text-[12px] uppercase tracking-wider text-gp-ink-soft hover:text-gp-orange transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <span className="font-plex text-[12px] uppercase tracking-wider text-gp-ink-soft">© 2026</span>
      </div>
    </footer>
  );
}
