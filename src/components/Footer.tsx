import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant">
      <div className="max-w-[1280px] mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-title-md text-title-md font-bold text-on-surface">CoreBuild</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
            Prijzen zijn indicatief en kunnen afwijken. Wij zijn een deelnemer aan het Amazon Associates-programma.
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="#" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Over CoreBuild
          </Link>
          <Link href="#" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="#" className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary transition-colors">
            Affiliate disclaimer
          </Link>
        </nav>

        <span className="font-label-technical text-label-technical text-on-surface-variant">© 2025 CoreBuild</span>
      </div>
    </footer>
  );
}
