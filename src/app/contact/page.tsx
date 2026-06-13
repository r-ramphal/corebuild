import type { Metadata } from "next";
import { Mail, MessageSquare, Bug, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met CoreBuild — vragen, feedback, een ontbrekend product of een foutmelding. We lezen alles.",
  alternates: {
    canonical: "/contact",
  },
};

const EMAIL = "corebuildnl@proton.me";

const REASONS = [
  { icon: Lightbulb, title: "Idee of feedback", desc: "Mis je een functie of retailer? Laat het weten." },
  { icon: Bug, title: "Iets klopt niet", desc: "Verkeerde prijs, dood product of een bug? Stuur het door." },
  { icon: MessageSquare, title: "Algemene vraag", desc: "Over je account, een build of samenwerking." },
];

export default function ContactPage() {
  return (
    <main className="mt-16 max-w-3xl mx-auto px-4 sm:px-8 py-16 min-h-screen">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">Contact</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl">
        Vragen, feedback of een product dat we missen? We horen graag van je. Mail ons direct —
        we lezen alles en reageren meestal binnen een paar dagen.
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sm:p-8 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
              E-mail
            </p>
            <a href={`mailto:${EMAIL}`} className="font-title-md text-title-md text-on-surface hover:text-primary transition-colors">
              {EMAIL}
            </a>
          </div>
        </div>
        <a
          href={`mailto:${EMAIL}?subject=${encodeURIComponent("Contact via CoreBuild")}`}
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg font-label-technical text-label-technical hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Mail className="w-4 h-4" /> Stuur een e-mail
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {REASONS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-title-md text-[15px] text-on-surface mb-1">{title}</h2>
            <p className="font-body-sm text-[13px] text-on-surface-variant">{desc}</p>
          </div>
        ))}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant mt-10">
        Tip: meld je een verkeerde prijs of een ontbrekend product, voeg dan de productnaam of een
        link toe — dan kunnen we het sneller oplossen.
      </p>
    </main>
  );
}
