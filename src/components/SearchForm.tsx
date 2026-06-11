"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { SearchResults } from "@/lib/types";
import { PriceList } from "./PriceList";

export function SearchForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Er ging iets mis");
          return;
        }
        setResults(await res.json());
      } catch {
        setError("Kon geen verbinding maken met de server");
      }
    });
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek een component — bijv. RTX 4070, Ryzen 7 9800X3D"
          className="flex-1"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !query.trim()}>
          <Search className="w-4 h-4 mr-2" />
          {isPending ? "Zoeken…" : "Zoeken"}
        </Button>
      </form>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {results && <PriceList results={results} />}
    </div>
  );
}
