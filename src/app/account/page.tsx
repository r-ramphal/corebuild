"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, ShieldOff, KeyRound, Copy, Check, Download, TriangleAlert } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";

/** better-auth voegt twoFactorEnabled toe aan de user via de twoFactor-plugin. */
function is2faEnabled(user: unknown): boolean {
  return Boolean((user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled);
}

function errMessage(e: { message?: string } | null | undefined, fallback: string): string {
  return e?.message?.trim() || fallback;
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) router.push("/inloggen");
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-[760px] mx-auto px-4 sm:px-8 py-16 text-on-surface-variant">Laden...</div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-[760px] mx-auto px-4 sm:px-8 py-12">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Account &amp; beveiliging</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-10">
          Ingelogd als <span className="text-on-surface font-medium">{session.user.email}</span>.
        </p>

        <TwoFactorSection enabled={is2faEnabled(session.user)} />
      </div>
    </main>
  );
}

/** Beheer van tweestapsverificatie (TOTP). */
function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  // null = overzicht; anders een actieve flow.
  const [flow, setFlow] = useState<null | "enable" | "disable" | "backup">(null);

  function done() {
    setFlow(null);
    router.refresh();
  }

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            enabled ? "bg-success-emerald/10 text-success-emerald" : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-title-md text-title-md text-on-surface">Tweestapsverificatie (2FA)</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {enabled
              ? "Actief. Bij het inloggen vragen we naast je wachtwoord een code uit je authenticator-app."
              : "Voeg een extra beveiligingslaag toe met een authenticator-app (Google Authenticator, 1Password, Aegis…)."}
          </p>

          {flow === null && (
            <div className="mt-4 flex flex-wrap gap-2">
              {enabled ? (
                <>
                  <button
                    onClick={() => setFlow("backup")}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary transition-colors"
                  >
                    <KeyRound className="h-4 w-4" /> Nieuwe backup-codes
                  </button>
                  <button
                    onClick={() => setFlow("disable")}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-error-crimson hover:text-error-crimson transition-colors"
                  >
                    <ShieldOff className="h-4 w-4" /> Uitschakelen
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setFlow("enable")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
                >
                  <ShieldCheck className="h-4 w-4" /> 2FA inschakelen
                </button>
              )}
            </div>
          )}

          {flow === "enable" && <EnableFlow onDone={done} onCancel={() => setFlow(null)} />}
          {flow === "disable" && <DisableFlow onDone={done} onCancel={() => setFlow(null)} />}
          {flow === "backup" && <BackupFlow onDone={() => setFlow(null)} onCancel={() => setFlow(null)} />}
        </div>
      </div>
    </section>
  );
}

/** Inschakelen: wachtwoord → QR + backup-codes → eerste code bevestigen. */
function EnableFlow({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<"password" | "verify">("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await authClient.twoFactor.enable({ password, issuer: "CoreBuild" });
    setLoading(false);
    if (err || !data) {
      setError(errMessage(err, "Inschakelen mislukt — klopt je wachtwoord?"));
      return;
    }
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes);
    setStep("verify");
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await authClient.twoFactor.verifyTotp({ code: code.trim() });
    setLoading(false);
    if (err) {
      setError(errMessage(err, "Onjuiste code — probeer de actuele code uit je app."));
      return;
    }
    onDone();
  }

  if (step === "password") {
    return (
      <form onSubmit={start} className="mt-5 border-t border-outline-variant pt-5">
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
          Bevestig je wachtwoord om 2FA in te schakelen.
        </p>
        <FieldPassword value={password} onChange={setPassword} autoFocus />
        {error && <ErrorBox>{error}</ErrorBox>}
        <FlowButtons loading={loading} submitLabel="Doorgaan" onCancel={onCancel} disabled={!password} />
      </form>
    );
  }

  return (
    <div className="mt-5 border-t border-outline-variant pt-5">
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
        Scan deze QR-code met je authenticator-app. Lukt scannen niet? Voer de sleutel handmatig in.
      </p>
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="bg-white p-3 rounded-lg border border-outline-variant shrink-0">
          {totpUri && <QRCodeSVG value={totpUri} size={172} />}
        </div>
        <div className="min-w-0 flex-1">
          <ManualSecret uri={totpUri} />
          <BackupCodesPanel codes={backupCodes} />
        </div>
      </div>

      <form onSubmit={confirm} className="mt-5">
        <label className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider block mb-2">
          Voer de 6-cijferige code in om te bevestigen
        </label>
        <FieldCode value={code} onChange={setCode} autoFocus />
        {error && <ErrorBox>{error}</ErrorBox>}
        <FlowButtons
          loading={loading}
          submitLabel="2FA activeren"
          onCancel={onCancel}
          disabled={code.trim().length < 6}
        />
      </form>
    </div>
  );
}

/** Uitschakelen: wachtwoord bevestigen. */
function DisableFlow({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await authClient.twoFactor.disable({ password });
    setLoading(false);
    if (err) {
      setError(errMessage(err, "Uitschakelen mislukt — klopt je wachtwoord?"));
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-5 border-t border-outline-variant pt-5">
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
        Bevestig je wachtwoord om 2FA uit te schakelen. Je account is daarna alleen met je wachtwoord
        beveiligd.
      </p>
      <FieldPassword value={password} onChange={setPassword} autoFocus />
      {error && <ErrorBox>{error}</ErrorBox>}
      <FlowButtons
        loading={loading}
        submitLabel="2FA uitschakelen"
        destructive
        onCancel={onCancel}
        disabled={!password}
      />
    </form>
  );
}

/** Nieuwe backup-codes genereren (vervangt de oude). */
function BackupFlow({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await authClient.twoFactor.generateBackupCodes({ password });
    setLoading(false);
    if (err || !data) {
      setError(errMessage(err, "Genereren mislukt — klopt je wachtwoord?"));
      return;
    }
    setCodes(data.backupCodes);
  }

  if (codes) {
    return (
      <div className="mt-5 border-t border-outline-variant pt-5">
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
          Je oude backup-codes zijn vervangen. Bewaar deze nieuwe codes veilig.
        </p>
        <BackupCodesPanel codes={codes} />
        <div className="mt-4">
          <button
            onClick={onDone}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90"
          >
            Klaar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 border-t border-outline-variant pt-5">
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
        Bevestig je wachtwoord. De oude backup-codes worden ongeldig.
      </p>
      <FieldPassword value={password} onChange={setPassword} autoFocus />
      {error && <ErrorBox>{error}</ErrorBox>}
      <FlowButtons loading={loading} submitLabel="Genereer codes" onCancel={onCancel} disabled={!password} />
    </form>
  );
}

/* ---------- Gedeelde UI-stukjes ---------- */

function FieldPassword({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="password"
      required
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Je wachtwoord"
      autoComplete="current-password"
      className="w-full h-11 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
    />
  );
}

function FieldCode({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={6}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      placeholder="123456"
      className="w-40 h-12 px-4 bg-white border border-outline-variant rounded-lg font-mono text-[20px] tracking-[0.3em] focus:ring-2 focus:ring-primary focus:border-primary outline-none"
    />
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 font-body-sm text-body-sm text-error-crimson bg-error-crimson/10 border border-error-crimson/30 rounded-lg px-4 py-3">
      {children}
    </div>
  );
}

function FlowButtons({
  loading,
  submitLabel,
  onCancel,
  disabled,
  destructive,
}: {
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        type="submit"
        disabled={loading || disabled}
        className={`px-5 py-2.5 rounded-lg font-label-technical text-label-technical text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 ${
          destructive ? "bg-error-crimson" : "bg-primary"
        }`}
      >
        {loading ? "Bezig..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2.5 font-label-technical text-label-technical text-on-surface-variant hover:text-on-surface"
      >
        Annuleer
      </button>
    </div>
  );
}

function ManualSecret({ uri }: { uri: string | null }) {
  const secret = uri ? new URLSearchParams(uri.split("?")[1] ?? "").get("secret") : null;
  const [copied, setCopied] = useState(false);
  if (!secret) return null;
  return (
    <div className="mb-4">
      <p className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider mb-1.5">
        Handmatige sleutel
      </p>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(secret);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant rounded-lg font-mono text-[13px] break-all text-on-surface hover:border-primary"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success-emerald" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{secret}</span>
      </button>
    </div>
  );
}

function BackupCodesPanel({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");

  function download() {
    const blob = new Blob([`CoreBuild backup-codes\n\n${text}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corebuild-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <TriangleAlert className="h-4 w-4 text-amber-600" />
        <p className="font-label-technical text-label-technical text-on-surface uppercase tracking-wider">
          Backup-codes
        </p>
      </div>
      <p className="font-body-sm text-[12px] text-on-surface-variant mb-3">
        Bewaar deze veilig. Elke code werkt één keer als je geen toegang tot je app hebt. Ze worden nu
        eenmalig getoond.
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[13px] text-on-surface">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success-emerald" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Gekopieerd" : "Kopieer"}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>
    </div>
  );
}
