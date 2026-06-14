import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/40">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-title-md text-title-md font-bold text-on-surface">CoreBuild</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
            Wij zijn deelnemer aan affiliate programma&apos;s. Prijzen zijn indicatief.
          </span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap justify-center items-center gap-6">
          <Link href="/galerij" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Buildgalerij
          </Link>
          <Link href="/volglijst" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Volglijst
          </Link>
          <Link href="/blog" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="/over" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Over CoreBuild
          </Link>
          <Link href="/over#privacy" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/over#affiliate" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Affiliate disclaimer
          </Link>
          <Link href="/contact" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>

        <span className="font-label-technical text-label-technical text-on-surface-variant">© 2026 CoreBuild</span>
      </div>
    </footer>
  );
}
