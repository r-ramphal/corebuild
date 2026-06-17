"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Cpu, Bookmark, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Mobiel-exclusieve onderbalk (app-stijl tabbar). Alleen <1024px (lg:hidden);
 * op desktop neemt de Navbar het over. Vaste vijf kernbestemmingen voor
 * duim-navigatie richting conversie (zoeken/builder/volglijst). De body krijgt
 * in globals.css onderaan ruimte (3.5rem + safe-area) zodat content nooit
 * achter deze balk valt. Stijl volgt giastpc: wit, scherpe hoeken, plex-font,
 * oranje accent op de actieve tab.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Account-tab is sessie-afhankelijk: ingelogd → Mijn builds, anders inloggen.
  const accountHref = session ? "/builds" : "/inloggen";

  const tabs = [
    { href: "/", label: "Home", Icon: Home, active: pathname === "/" },
    {
      href: "/zoeken",
      label: "Zoeken",
      Icon: Search,
      active: pathname.startsWith("/zoeken"),
    },
    {
      href: "/builder",
      label: "Builder",
      Icon: Cpu,
      active: pathname.startsWith("/builder"),
    },
    {
      href: "/volglijst",
      label: "Volglijst",
      Icon: Bookmark,
      active: pathname.startsWith("/volglijst"),
    },
    {
      href: accountHref,
      label: "Account",
      Icon: User,
      active:
        pathname.startsWith("/builds") || pathname.startsWith("/inloggen"),
    },
  ];

  return (
    <nav
      aria-label="Snelnavigatie"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gp-bg/95 backdrop-blur-sm border-t border-gp-line pb-safe"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon, active }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 font-plex text-[10px] uppercase tracking-wider transition-colors",
                active
                  ? "text-gp-orange"
                  : "text-gp-ink-soft hover:text-gp-ink",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-gp-orange" />
              )}
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
