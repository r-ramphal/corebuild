import { SearchForm } from "@/components/SearchForm";

export default function Home() {
  return (
    <main className="min-h-screen p-8 pt-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">CoreBuild</h1>
          <p className="text-muted-foreground text-lg">
            Vergelijk actuele prijzen van PC-componenten bij alle grote Nederlandse retailers.
          </p>
        </div>
        <SearchForm />
      </div>
    </main>
  );
}
