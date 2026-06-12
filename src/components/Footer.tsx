import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} CoreBuild</span>
        <span>
          Prijzen zijn indicatief en kunnen afwijken. Wij zijn een deelnemer aan het Amazon Associates-programma.
        </span>
      </div>
    </footer>
  );
}
