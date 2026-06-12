"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/zoeken", label: "Zoeken" },
  { href: "/builder", label: "Builder" },
  { href: "/categorie", label: "Categorieën" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-outline-variant">
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-primary font-heading font-bold text-2xl"
        >
          CoreBuild
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "font-mono text-xs tracking-wide transition-colors pb-0.5",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/inloggen"
          className="bg-primary text-white px-6 py-2 rounded-lg font-mono text-xs transition-opacity hover:opacity-90"
        >
          Inloggen
        </Link>
      </div>
    </header>
  );
}
