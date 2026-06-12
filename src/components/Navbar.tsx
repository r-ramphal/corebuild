"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ChevronDown, Save, LogOut, Menu, X } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/zoeken", label: "Zoeken" },
  { href: "/builder", label: "Builder" },
  { href: "/categorie", label: "Categorieën" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!menuOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setMobileOpen(false);
    router.push(`/zoeken?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleSignOut() {
    setMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-outline-variant">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-headline-lg text-headline-lg font-bold text-primary"
          >
            CoreBuild
          </Link>

          <nav aria-label="Hoofdnavigatie" className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "font-label-technical text-label-technical transition-colors duration-200",
                    isActive
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-on-surface-variant hover:text-primary",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {pathname !== "/" && (
            <form onSubmit={handleSearch} className="relative hidden sm:block" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek componenten..."
                aria-label="Zoek componenten"
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm w-48 lg:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
          )}

          {session ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                {session.user.name || session.user.email}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2 min-w-[180px] z-50">
                  <Link
                    href="/builds"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <Save className="w-4 h-4 text-on-surface-variant" /> Mijn builds
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-on-surface-variant" /> Uitloggen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/inloggen"
              className={cn(
                "hidden md:inline-block bg-primary text-on-primary px-6 py-2 rounded-lg font-label-technical text-label-technical transition-opacity hover:opacity-90",
                isPending && "opacity-0",
              )}
            >
              Inloggen
            </Link>
          )}

          {/* Mobiel: hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobiel-menu"
            aria-label={mobileOpen ? "Menu sluiten" : "Menu openen"}
            className="md:hidden p-2.5 -mr-1 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobiel menu */}
      {mobileOpen && (
        <nav
          id="mobiel-menu"
          aria-label="Mobiele navigatie"
          className="md:hidden border-t border-outline-variant bg-surface px-4 pb-4 pt-2 space-y-1"
        >
          <form onSubmit={handleSearch} className="relative py-2 sm:hidden" role="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek componenten..."
              aria-label="Zoek componenten"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </form>

          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block px-3 py-3 rounded-lg font-body-sm text-body-sm transition-colors",
                  isActive
                    ? "bg-primary-container/10 text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-container-low",
                )}
              >
                {label}
              </Link>
            );
          })}

          <div className="border-t border-outline-variant pt-2 mt-2">
            {session ? (
              <>
                <Link
                  href="/builds"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Save className="w-4 h-4 text-on-surface-variant" /> Mijn builds
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-3 rounded-lg font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-on-surface-variant" /> Uitloggen
                </button>
              </>
            ) : (
              <Link
                href="/inloggen"
                onClick={() => setMobileOpen(false)}
                className="block text-center bg-primary text-on-primary px-6 py-3 rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
              >
                Inloggen
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
