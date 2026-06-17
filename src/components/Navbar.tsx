"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Save, LogOut, Menu, X, ArrowUpRight, Search, ChevronDown, ShieldCheck } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { SearchSuggest } from "@/components/SearchSuggest";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/zoeken", label: "Zoeken" },
  { href: "/builder", label: "Builder" },
  { href: "/voorbeeldbuilds", label: "Voorbeeldbuilds" },
  { href: "/categorie", label: "Categorieën" },
  { href: "/community", label: "Community" },
  { href: "/volglijst", label: "Volglijst" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  // Sluit het account-dropdown bij klik buiten of Escape.
  useEffect(() => {
    if (!accountOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [accountOpen]);

  async function handleSignOut() {
    setOpen(false);
    setAccountOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 bg-gp-bg/90 backdrop-blur-sm border-b border-gp-line"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 grid grid-cols-3 items-center gp-rule-x">
        {/* Links: menu-knop */}
        <div className="flex justify-start">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="hoofdmenu"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 border border-transparent hover:border-gp-line text-gp-ink transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="hidden sm:inline font-plex text-[12px] uppercase tracking-wider">
              {open ? "Sluit" : "Menu"}
            </span>
          </button>
        </div>

        {/* Midden: logo */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="font-mont font-extrabold text-[19px] sm:text-[21px] tracking-tight text-gp-ink whitespace-nowrap"
          >
            Core<span className="text-gp-orange">Build</span>
          </Link>
        </div>

        {/* Rechts: zoeken (desktop, niet op home) + account/inloggen */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {pathname !== "/" && (
            <div className="hidden lg:block">
              <SearchSuggest variant="navbar" />
            </div>
          )}
          {session ? (
            <div className="relative hidden sm:block" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 px-3 py-2 border border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:border-gp-orange hover:text-gp-orange transition-colors max-w-[200px]"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[110px]">{session.user.name || session.user.email}</span>
                <ChevronDown
                  className={cn("w-3.5 h-3.5 shrink-0 transition-transform", accountOpen && "rotate-180")}
                />
              </button>
              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1 w-52 border border-gp-line bg-gp-bg shadow-lg"
                >
                  <div className="px-4 py-2.5 border-b border-gp-line">
                    <p className="font-plex text-[11px] text-gp-ink-soft truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/builds"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:bg-gp-bg-soft hover:text-gp-orange transition-colors"
                  >
                    <Save className="w-4 h-4" /> Mijn builds
                  </Link>
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 border-t border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:bg-gp-bg-soft hover:text-gp-orange transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Account &amp; beveiliging
                  </Link>
                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-4 py-3 border-t border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:bg-gp-bg-soft hover:text-gp-orange transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Uitloggen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/inloggen"
              className={cn(
                "inline-flex items-center bg-gp-orange text-white px-4 sm:px-6 py-2 font-plex text-[12px] uppercase tracking-wider transition-colors hover:bg-gp-orange-dark",
                isPending && "opacity-0",
              )}
            >
              Inloggen
            </Link>
          )}
        </div>
      </div>

      {/* Uitklapmenu (alle schermen) */}
      {open && (
        <div id="hoofdmenu" className="border-t border-gp-line bg-gp-bg/98 backdrop-blur-sm">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-6">
            {/* Zoeken (mobiel/tablet) */}
            <div className="lg:hidden mb-5">
              <SearchSuggest variant="page" onNavigate={() => setOpen(false)} />
            </div>

            <nav aria-label="Hoofdnavigatie" className="grid sm:grid-cols-2 sm:gap-x-10">
              {NAV_LINKS.map(({ href, label }, i) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className="group flex items-center gap-4 py-3 border-b border-gp-line"
                  >
                    <span className="font-plex text-[12px] text-gp-ink-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "font-mont font-bold text-[20px] sm:text-[22px] flex-1 transition-colors",
                        isActive ? "text-gp-orange" : "text-gp-ink group-hover:text-gp-orange",
                      )}
                    >
                      {label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-gp-orange opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </nav>

            {/* Account-acties */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {session ? (
                <>
                  <Link
                    href="/builds"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 px-5 py-3 border border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:border-gp-orange hover:text-gp-orange transition-colors"
                  >
                    <Save className="w-4 h-4" /> Mijn builds
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 px-5 py-3 border border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:border-gp-orange hover:text-gp-orange transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Account
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 px-5 py-3 border border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:border-gp-orange hover:text-gp-orange transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/inloggen"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center bg-gp-orange text-white px-6 py-3 font-plex text-[12px] uppercase tracking-wider hover:bg-gp-orange-dark transition-colors"
                  >
                    Inloggen / Registreren
                  </Link>
                  <Link
                    href="/zoeken"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 px-5 py-3 border border-gp-line font-plex text-[12px] uppercase tracking-wider text-gp-ink hover:border-gp-orange hover:text-gp-orange transition-colors"
                  >
                    <Search className="w-4 h-4" /> Onderdelen zoeken
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
