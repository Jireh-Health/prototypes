"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Scenario = "happy-path" | "name-mismatch-retry" | "service-down-manual" | "name-differs-consent" | "max-attempts" | "manual-approved" | "manual-rejected" | "old-blocked";

type Screen =
  | "phone_entry" | "otp" | "personal_details" | "pin_create" | "pin_confirm"
  | "onboarding_success" | "kyc_intro" | "id_verification" | "id_verifying"
  | "name_consent" | "id_fail_mismatch" | "id_fail_service_down" | "id_fail_max_attempts"
  | "manual_intro" | "capture_id_front" | "capture_id_back" | "manual_submitted"
  | "dashboard_pending" | "dashboard_verified" | "manual_rejected" | "id_fail_blocked";

interface FlowState {
  phone: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  pin: string;
  pinConfirm: string;
  attempts: number;
  registryName: string;
  rejectionReason: string;
}

const SCENARIO_META: Record<string, { title: string; specRef: string }> = {
  "happy-path": { title: "Happy Path", specRef: "Scenario 7.3.1 — Successful Automated Verification" },
  "name-mismatch-retry": { title: "Name Mismatch + Retry", specRef: "Scenario 7.3.2 — Name Mismatch with Automated Retry" },
  "service-down-manual": { title: "Service Down + Manual Fallback", specRef: "Scenario 7.3.3 — Service Downtime" },
  "name-differs-consent": { title: "Name Differs + Consent", specRef: "Scenario 7.3.5 — Name Differs After Successful Verification" },
  "max-attempts": { title: "Max Attempts Exhausted", specRef: "Scenario 7.3.8 — Maximum Attempts with Fallback" },
  "manual-approved": { title: "Manual Verification Approved", specRef: "Scenarios 7.3.3 + 7.3.4 — Full Manual Path" },
  "manual-rejected": { title: "Manual Verification Rejected", specRef: "Scenario 7.3.4 — Manual Review Rejection + Retry" },
  "old-blocked": { title: "Old Flow: Blocked (Dead End)", specRef: "Problem 2.1 — No Fallback When Automated ID Verification Fails" },
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Shared Primitives ───────────────────────────────────────────────────────

function ScreenShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="phone-screen" style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>{children}</div>
      {footer && (
        <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border-default)", background: "var(--bg-surface)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}

function TopNav({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, minHeight: 24 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--fg-default)", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>
      )}
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--fg-heading)" }}>{title}</span>
    </div>
  );
}

function Btn({ children, onClick, disabled, loading, variant = "primary" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean; variant?: "primary" | "secondary" | "ghost" | "destructive" }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: disabled ? "var(--interactive-disabled)" : "var(--interactive-default)", color: disabled ? "var(--fg-muted)" : "#fff", border: "none" },
    secondary: { background: "var(--bg-surface)", color: "var(--fg-default)", border: "1px solid var(--border-default)" },
    ghost: { background: "none", color: "var(--color-jireh-purple)", border: "none", padding: "8px 0", width: "auto" },
    destructive: { background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid rgba(220,38,38,0.2)" },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: variant === "ghost" ? "auto" : "100%", padding: "14px 16px", borderRadius: 12, fontFamily: "var(--font-sans)",
      fontSize: "0.875rem", fontWeight: 600, cursor: disabled ? "default" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.1s", ...s,
    }}>
      {loading && <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />}
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", maxLength, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number; error?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--fg-heading)", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${error ? "var(--color-error)" : "var(--border-default)"}`,
          fontFamily: "var(--font-sans)", fontSize: "0.875rem", color: "var(--fg-default)", background: "var(--bg-surface)", outline: "none" }} />
      {error && <p style={{ fontSize: "0.75rem", color: "var(--color-error)", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function OtpSlots({ length, value, onChange, masked }: { length: number; value: string; onChange: (v: string) => void; masked?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const change = (i: number, c: string) => {
    if (!/^\d?$/.test(c)) return;
    const a = value.split(""); a[i] = c;
    onChange(a.join("").slice(0, length));
    if (c && i < length - 1) refs.current[i + 1]?.focus();
  };
  const keyDown = (i: number, e: React.KeyboardEvent) => { if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus(); };
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length }, (_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} type={masked ? "password" : "text"} inputMode="numeric" maxLength={1}
          value={value[i] || ""} onChange={(e) => change(i, e.target.value)} onKeyDown={(e) => keyDown(i, e)}
          style={{ width: 44, height: 52, textAlign: "center", fontSize: "1.25rem", fontWeight: 600, fontFamily: "var(--font-sans)",
            borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--fg-default)", outline: "none" }} />
      ))}
    </div>
  );
}

function Card({ variant, children }: { variant: "info" | "warning" | "error" | "success"; children: ReactNode }) {
  const colors = {
    info: { bg: "var(--color-info-bg)", border: "rgba(37,99,235,0.15)", stroke: "var(--color-info)", icon: "M12 16v-4M12 8h.01" },
    warning: { bg: "var(--color-warning-bg)", border: "rgba(234,88,12,0.15)", stroke: "var(--color-warning)", icon: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01" },
    error: { bg: "var(--color-error-bg)", border: "rgba(220,38,38,0.15)", stroke: "var(--color-error)", icon: "M15 9l-6 6M9 9l6 6" },
    success: { bg: "var(--color-success-bg)", border: "rgba(22,163,74,0.15)", stroke: "var(--color-success)", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14M9 11l3 3L22 4" },
  };
  const c = colors[variant];
  return (
    <div style={{ padding: "14px 16px", borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        {variant !== "error" && variant !== "success" && <circle cx="12" cy="12" r="10"/>}
        {c.icon.split("M").filter(Boolean).map((d, i) => <path key={i} d={`M${d}`} />)}
      </svg>
      <div style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--fg-default)" }}>{children}</div>
    </div>
  );
}

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < current ? "#A020F0" : i === current ? "#E0A0FF" : "#E5E7EB", transition: "background 0.3s" }} />
      ))}
    </div>
  );
}

function KYCStep({ step, label, status }: { step: string; label: string; status: "done" | "current" | "locked" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: 600,
        background: status === "done" ? "var(--color-success-bg)" : status === "current" ? "#A020F0" : "#F3F4F6",
        color: status === "done" ? "var(--color-success)" : status === "current" ? "#fff" : "var(--fg-muted)",
        border: status === "done" ? "1.5px solid var(--color-success)" : "none",
      }}>
        {status === "done" ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
         : status === "locked" ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
         : step}
      </div>
      <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: status === "locked" ? "var(--fg-muted)" : "var(--fg-heading)" }}>{label}</span>
      {status === "current" && <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "#A020F0", background: "#FBF0FF", padding: "2px 8px", borderRadius: 99 }}>Next</span>}
    </div>
  );
}

function CameraSim({ label, onCapture }: { label: string; onCapture: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{
        width: "100%", aspectRatio: "3/2", borderRadius: 12,
        border: done ? "2px solid var(--color-success)" : "2px dashed var(--border-strong)",
        background: done ? "var(--color-success-bg)" : "#F9FAFB",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s",
      }}>
        {done ? (
          <>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-success)" }}>Photo captured</span>
          </>
        ) : (
          <>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            <span style={{ fontSize: "0.875rem", color: "var(--fg-muted)" }}>{label}</span>
          </>
        )}
      </div>
      {!done && <Btn onClick={() => { setDone(true); setTimeout(onCapture, 500); }}>Take Photo</Btn>}
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function PhoneScreen({ s, set, next }: { s: FlowState; set: (v: FlowState) => void; next: () => void }) {
  return (
    <ScreenShell footer={<Btn onClick={next} disabled={s.phone.length < 9}>Send verification code</Btn>}>
      <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FBF0FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#A020F0" }}>J</span>
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>Welcome to Jireh</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>Healthcare you can afford. Enter your phone number to get started.</p>
      </div>
      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--fg-heading)", marginBottom: 6 }}>Phone number</label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-surface)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>🇰🇪 +254</div>
        <input type="tel" value={s.phone} onChange={(e) => set({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="712 345 678"
          style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border-default)", fontFamily: "var(--font-sans)", fontSize: "0.875rem", color: "var(--fg-default)", background: "var(--bg-surface)", outline: "none" }} />
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 3 }} />
        <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>I agree to the <span style={{ color: "#A020F0", fontWeight: 500 }}>Terms of Service</span> and <span style={{ color: "#A020F0", fontWeight: 500 }}>Privacy Policy</span></span>
      </div>
    </ScreenShell>
  );
}

function OtpScreen({ s, next, back }: { s: FlowState; next: () => void; back: () => void }) {
  const [otp, setOtp] = useState("");
  const [cd, setCd] = useState(60);
  useEffect(() => { const t = setInterval(() => setCd((c) => Math.max(0, c - 1)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (otp.length === 6) next(); }, [otp, next]);
  return (
    <ScreenShell footer={<Btn onClick={next} disabled={otp.length < 6}>Verify</Btn>}>
      <TopNav title="Verify phone" onBack={back} />
      <Steps current={0} total={4} />
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>Enter verification code</h2>
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: 24, lineHeight: 1.5 }}>We sent a 6-digit code to <strong>+254 {s.phone}</strong></p>
      <OtpSlots length={6} value={otp} onChange={setOtp} />
      <div style={{ textAlign: "center", marginTop: 20 }}>
        {cd > 0 ? <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Resend code in {cd}s</span>
         : <Btn variant="ghost" onClick={() => setCd(60)}>Resend code</Btn>}
      </div>
      <div style={{ textAlign: "center", marginTop: 4 }}><Btn variant="ghost" onClick={back}>Change phone number</Btn></div>
    </ScreenShell>
  );
}

function DetailsScreen({ s, set, next, back }: { s: FlowState; set: (v: FlowState) => void; next: () => void; back: () => void }) {
  return (
    <ScreenShell footer={<Btn onClick={next} disabled={!s.firstName.trim() || !s.lastName.trim()}>Continue</Btn>}>
      <TopNav title="Create account" onBack={back} />
      <Steps current={1} total={4} />
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 4 }}>What is your full name?</h2>
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: 24, lineHeight: 1.5 }}>This should match your National ID.</p>
      <Field label="First name" value={s.firstName} onChange={(v) => set({ ...s, firstName: v })} placeholder="e.g. Fatuma" />
      <Field label="Last name" value={s.lastName} onChange={(v) => set({ ...s, lastName: v })} placeholder="e.g. Hassan" />
    </ScreenShell>
  );
}

function PinScreen({ s, set, next, back, confirm }: { s: FlowState; set: (v: FlowState) => void; next: () => void; back: () => void; confirm?: boolean }) {
  const [err, setErr] = useState("");
  const go = () => { if (confirm && s.pinConfirm !== s.pin) { setErr("PINs do not match."); return; } next(); };
  const val = confirm ? s.pinConfirm : s.pin;
  const setter = confirm ? (v: string) => { setErr(""); set({ ...s, pinConfirm: v }); } : (v: string) => set({ ...s, pin: v });
  return (
    <ScreenShell footer={<Btn onClick={go} disabled={val.length < 4}>{confirm ? "Confirm PIN" : "Save PIN"}</Btn>}>
      <TopNav title="Create account" onBack={back} />
      <Steps current={2} total={4} />
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 4 }}>{confirm ? "Confirm your PIN" : "Create your PIN"}</h2>
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: 24, lineHeight: 1.5 }}>{confirm ? "Enter the PIN you just created." : "You will use this PIN to confirm all payments."}</p>
      <OtpSlots length={4} value={val} onChange={setter} masked />
      {err && <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-error)", marginTop: 12 }}>{err}</p>}
    </ScreenShell>
  );
}

function SuccessScreen({ s, next }: { s: FlowState; next: () => void }) {
  return (
    <ScreenShell footer={<Btn onClick={next}>Take me to my dashboard</Btn>}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 80 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-success-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>Account Created!</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.6, maxWidth: 280 }}>Welcome, {s.firstName}. Complete ID verification to unlock payments and loans.</p>
      </div>
    </ScreenShell>
  );
}

function KYCIntro({ next, back }: { next: () => void; back: () => void }) {
  return (
    <ScreenShell footer={<Btn onClick={next}>Continue</Btn>}>
      <TopNav title="Upgrade to Jireh Plus" onBack={back} />
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 4 }}>Verify your identity</h2>
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: 24, lineHeight: 1.5 }}>Complete these steps to unlock payments, loans, and cashback.</p>
      <div style={{ border: "1px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
        <KYCStep step="1" label="National ID number" status="current" />
        <div style={{ borderTop: "1px solid var(--border-default)" }}><KYCStep step="2" label="ID photo (front)" status="locked" /></div>
        <div style={{ borderTop: "1px solid var(--border-default)" }}><KYCStep step="3" label="Selfie" status="locked" /></div>
        <div style={{ borderTop: "1px solid var(--border-default)" }}><KYCStep step="4" label="Add 2 Circle members" status="locked" /></div>
        <div style={{ borderTop: "1px solid var(--border-default)" }}><KYCStep step="5" label="Pay KES 499" status="locked" /></div>
      </div>
    </ScreenShell>
  );
}

function IDEntry({ s, set, onSubmit, back, attemptsLeft }: { s: FlowState; set: (v: FlowState) => void; onSubmit: () => void; back: () => void; attemptsLeft: number }) {
  return (
    <ScreenShell footer={<Btn onClick={onSubmit} disabled={!s.idNumber.trim()}>Verify my ID</Btn>}>
      <TopNav title="ID Verification" onBack={back} />
      <Steps current={0} total={5} />
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 16 }}>Enter your National ID number</h2>
      <Card variant="info">
        <strong>How this works:</strong> We verify your national ID with the government registry (IPRS) to confirm your identity. This protects you and enables secure payments. The name on your ID must match the name you provided.
      </Card>
      <div style={{ marginTop: 20 }}>
        <Field label="National ID number" value={s.idNumber} onChange={(v) => set({ ...s, idNumber: v.replace(/\D/g, "").slice(0, 10) })} placeholder="e.g. 28456712" maxLength={10} />
      </div>
      {attemptsLeft < 4 && <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: -8 }}>{attemptsLeft} verification {attemptsLeft === 1 ? "attempt" : "attempts"} remaining</p>}
    </ScreenShell>
  );
}

function IDVerifying() {
  return (
    <ScreenShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 120 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: "#A020F0", animation: "spin 0.8s linear infinite", marginBottom: 24 }} />
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 8 }}>Verifying your ID with the national registry...</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)" }}>This usually takes a few seconds.</p>
      </div>
    </ScreenShell>
  );
}

function NameMismatch({ s, set, onRetry, onManual, attemptsLeft }: { s: FlowState; set: (v: FlowState) => void; onRetry: () => void; onManual: () => void; attemptsLeft: number }) {
  return (
    <ScreenShell>
      <TopNav title="ID Verification" />
      <Card variant="error">
        <strong>Name mismatch.</strong> The name you entered does not match the name on your national ID. Please check your details and try again, or verify manually by uploading a photo of your ID.
      </Card>
      <div style={{ marginTop: 20 }}>
        <Field label="First name" value={s.firstName} onChange={(v) => set({ ...s, firstName: v })} />
        <Field label="Last name" value={s.lastName} onChange={(v) => set({ ...s, lastName: v })} />
        <Field label="National ID number" value={s.idNumber} onChange={(v) => set({ ...s, idNumber: v.replace(/\D/g, "").slice(0, 10) })} placeholder="e.g. 28456712" maxLength={10} />
      </div>
      {attemptsLeft > 0 && <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: 16, textAlign: "center" }}>{attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} remaining</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {attemptsLeft > 0 && <Btn onClick={onRetry}>Update name and try again</Btn>}
        <Btn variant="secondary" onClick={onManual}>Verify with ID photo instead</Btn>
      </div>
    </ScreenShell>
  );
}

function ServiceDown({ onRetry, onManual }: { onRetry: () => void; onManual: () => void }) {
  return (
    <ScreenShell>
      <TopNav title="ID Verification" />
      <Card variant="warning">
        <strong>ID verification is temporarily unavailable.</strong> We are having trouble connecting to the government registry. This is not your fault and does not count as a verification attempt.
      </Card>
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.5, marginTop: 16, textAlign: "center" }}>You can try again later or verify manually by uploading a photo of your ID.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <Btn onClick={onRetry}>Try again</Btn>
        <Btn variant="secondary" onClick={onManual}>Verify with ID photo instead</Btn>
      </div>
    </ScreenShell>
  );
}

function MaxAttempts({ onManual }: { onManual: () => void }) {
  return (
    <ScreenShell>
      <TopNav title="ID Verification" />
      <Card variant="error">
        <strong>Maximum verification attempts reached.</strong> You have used all 4 automated verification attempts. You can still verify your identity by uploading a photo of your national ID for manual review.
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <Btn onClick={onManual}>Verify with ID photo</Btn>
      </div>
    </ScreenShell>
  );
}

function NameConsent({ s, registryName, onAccept, onDispute }: { s: FlowState; registryName: string; onAccept: () => void; onDispute: () => void }) {
  return (
    <ScreenShell>
      <TopNav title="Confirm your name" />
      <div style={{ textAlign: "center", paddingTop: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
      </div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--fg-heading)", textAlign: "center", marginBottom: 16 }}>Your ID name is slightly different</h2>
      <div style={{ border: "1px solid var(--border-default)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", background: "var(--bg-surface-muted)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: 2 }}>You entered</p>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg-heading)" }}>{s.firstName} {s.lastName}</p>
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-default)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: 2 }}>Your ID shows</p>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg-heading)" }}>{registryName}</p>
        </div>
      </div>
      <Card variant="info">We will update your profile to match your ID. This ensures your payments and documents use your official name.</Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <Btn onClick={onAccept}>Use my ID name</Btn>
        <Btn variant="secondary" onClick={onDispute}>This is not right</Btn>
      </div>
    </ScreenShell>
  );
}

function ManualIntro({ next, back }: { next: () => void; back: () => void }) {
  return (
    <ScreenShell footer={<Btn onClick={next}>Start ID photo capture</Btn>}>
      <TopNav title="Manual Verification" onBack={back} />
      <div style={{ textAlign: "center", paddingTop: 20, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FBF0FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A020F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>Verify with your ID photo</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>Take clear photos of the front and back of your national ID. Our team will review and verify your identity within 24 hours.</p>
      </div>
      {[["1", "Front of your ID", "Show the side with your photo and name"], ["2", "Back of your ID", "Show the back side of your ID card"]].map(([n, t, d]) => (
        <div key={n} style={{ display: "flex", gap: 12, padding: "12px 16px", border: "1px solid var(--border-default)", borderRadius: 8, marginBottom: 8 }}>
          <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--fg-muted)" }}>{n}.</span>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--fg-heading)" }}>{t}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{d}</p>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8 }}><Card variant="info">Make sure photos are well-lit, in focus, and show the full card with no parts cut off.</Card></div>
    </ScreenShell>
  );
}

function CaptureFront({ next, back }: { next: () => void; back: () => void }) {
  return (
    <ScreenShell>
      <TopNav title="Front of ID" onBack={back} />
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: 16, lineHeight: 1.5 }}>Position the front of your national ID within the frame.</p>
      <CameraSim label="Front of National ID" onCapture={() => setTimeout(next, 600)} />
    </ScreenShell>
  );
}

function CaptureBack({ next, back }: { next: () => void; back: () => void }) {
  return (
    <ScreenShell>
      <TopNav title="Back of ID" onBack={back} />
      <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: 16, lineHeight: 1.5 }}>Now flip your ID card over and take a photo of the back.</p>
      <CameraSim label="Back of National ID" onCapture={() => setTimeout(next, 600)} />
    </ScreenShell>
  );
}

function ManualDone({ next }: { next: () => void }) {
  const [uploading, setUploading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setUploading(false), 1500); return () => clearTimeout(t); }, []);
  if (uploading) return (
    <ScreenShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 120 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: "#A020F0", animation: "spin 0.8s linear infinite", marginBottom: 20 }} />
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)" }}>Uploading your ID photos...</p>
      </div>
    </ScreenShell>
  );
  return (
    <ScreenShell footer={<Btn onClick={next}>Go to my dashboard</Btn>}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 60 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-success-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>ID photos submitted</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.6, maxWidth: 300 }}>We will verify your identity within 24 hours and notify you by SMS.</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <Card variant="success">You can browse health features, set up your profile, and explore the app while we review. Payments and loans unlock once verified.</Card>
      </div>
    </ScreenShell>
  );
}

function DashboardPending({ s, onApprove, onReject }: { s: FlowState; onApprove: () => void; onReject?: () => void }) {
  return (
    <ScreenShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Good morning,</p><h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)" }}>{s.firstName}</h2></div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#A020F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "0.875rem" }}>{s.firstName[0]}</div>
      </div>
      <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--color-warning-bg)", border: "1px solid rgba(234,88,12,0.2)", display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(234,88,12,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-warning)" }}>ID verification in progress</p>
          <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>You will get an SMS when it is complete.</p>
        </div>
      </div>
      <div style={{ padding: 20, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-default)", textAlign: "center", marginBottom: 16 }}>
        <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: 4 }}>Care Saver Balance</p>
        <p style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--fg-heading)" }}>KES 0</p>
        <p style={{ fontSize: "0.75rem", color: "var(--fg-subtle)", marginTop: 4 }}>Payments unlock after verification</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {["Pay Bill", "Send Money", "My Loans", "Cashback"].map((l) => (
          <div key={l} style={{ padding: 14, borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border-default)", textAlign: "center", opacity: 0.4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 4px", display: "block" }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "0.6875rem", color: "var(--fg-subtle)", marginBottom: 8 }}>Prototype control</p>
        <button onClick={onApprove} style={{ padding: "10px 20px", borderRadius: 8, border: "1px dashed var(--color-success)", background: "var(--color-success-bg)", color: "var(--color-success)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Simulate: Admin approves verification
        </button>
        {onReject && (
          <button onClick={onReject} style={{ padding: "10px 20px", borderRadius: 8, border: "1px dashed var(--color-error)", background: "var(--color-error-bg)", color: "var(--color-error)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", marginTop: 8 }}>
            Simulate: Admin rejects verification
          </button>
        )}
      </div>
    </ScreenShell>
  );
}

function DashboardOK({ s }: { s: FlowState }) {
  return (
    <ScreenShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><p style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Good morning,</p><h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)" }}>{s.firstName || "User"}</h2></div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#A020F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "0.875rem" }}>{(s.firstName || "U")[0]}</div>
      </div>
      <Card variant="success"><strong>ID verified!</strong> Your identity has been confirmed. You now have full access to payments, loans, and cashback.</Card>
      <div style={{ padding: 20, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-default)", textAlign: "center", marginTop: 16, marginBottom: 16 }}>
        <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: 4 }}>Care Saver Balance</p>
        <p style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--fg-heading)" }}>KES 0</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {["Pay Bill", "Send Money", "My Loans", "Cashback"].map((l) => (
          <div key={l} style={{ padding: 14, borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border-default)", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--fg-heading)" }}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 32 }}><p style={{ fontSize: "0.75rem", color: "var(--fg-subtle)" }}>End of scenario</p></div>
    </ScreenShell>
  );
}

function ManualRejected({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  return (
    <ScreenShell>
      <TopNav title="Verification Update" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 20, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-error-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>Verification not approved</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>Our team reviewed your ID photos but could not verify your identity. See the reason below.</p>
      </div>
      <div style={{ padding: "16px", borderRadius: 12, background: "var(--color-error-bg)", border: "1px solid rgba(220,38,38,0.2)", marginBottom: 20 }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-error)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason for rejection</p>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-default)", lineHeight: 1.6 }}>{reason}</p>
      </div>
      <Card variant="info">You can re-upload clearer photos of your ID. Make sure both the front and back are fully visible, well-lit, and in focus.</Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <Btn onClick={onRetry}>Re-upload ID photos</Btn>
        <Btn variant="ghost">Contact support</Btn>
      </div>
    </ScreenShell>
  );
}

function OldBlocked() {
  return (
    <ScreenShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 80 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-error-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--fg-heading)", marginBottom: 8 }}>We could not verify your National ID details.</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>Unfortunately, you have been blocked from our services because your details did not match your ID.</p>
        <p style={{ fontSize: "0.875rem", color: "var(--fg-muted)", lineHeight: 1.6, marginTop: 8 }}>If there was a mistake, please contact customer support for help.</p>
        <div style={{ marginTop: 24, width: "100%" }}><Btn>Contact Customer Support</Btn></div>
        <div style={{ marginTop: 32, padding: "12px 16px", borderRadius: 8, background: "var(--color-error-bg)", border: "1px dashed var(--color-error)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-error)", fontWeight: 600 }}>This is the current production experience.</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-error)", marginTop: 4 }}>Dead end. No manual fallback. No retry. Only a WhatsApp link.</p>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const scenario = (params.id as string) as Scenario;
  const meta = SCENARIO_META[scenario] || { title: "Unknown", specRef: "" };

  const [screen, setScreen] = useState<Screen>(scenario === "old-blocked" ? "id_fail_blocked" : "phone_entry");
  const [s, setS] = useState<FlowState>({ phone: "", firstName: "", lastName: "", idNumber: "", pin: "", pinConfirm: "", attempts: 0, registryName: "", rejectionReason: "" });

  const attemptsLeft = 4 - s.attempts;

  const handleIDSubmit = useCallback(async () => {
    setScreen("id_verifying");
    await wait(2500);
    switch (scenario) {
      case "happy-path":
        setScreen("dashboard_verified");
        break;
      case "name-mismatch-retry":
        if (s.attempts === 0) {
          setS((p) => ({ ...p, attempts: p.attempts + 1, registryName: "Fatuma Abdi Hassan" }));
          setScreen("id_fail_mismatch");
        } else {
          setScreen("dashboard_verified");
        }
        break;
      case "service-down-manual":
      case "manual-approved":
      case "manual-rejected":
        setScreen("id_fail_service_down");
        break;
      case "name-differs-consent":
        setS((p) => ({ ...p, registryName: p.firstName + " " + p.lastName + " Kamau" }));
        setScreen("name_consent");
        break;
      case "max-attempts":
        if (s.attempts < 3) {
          setS((p) => ({ ...p, attempts: p.attempts + 1, registryName: "Samuil Abdirahman" }));
          setScreen("id_fail_mismatch");
        } else {
          setS((p) => ({ ...p, attempts: p.attempts + 1 }));
          setScreen("id_fail_max_attempts");
        }
        break;
      default:
        setScreen("dashboard_verified");
    }
  }, [scenario, s.attempts]);

  const render = () => {
    switch (screen) {
      case "phone_entry": return <PhoneScreen s={s} set={setS} next={() => setScreen("otp")} />;
      case "otp": return <OtpScreen s={s} next={() => setScreen("personal_details")} back={() => setScreen("phone_entry")} />;
      case "personal_details": return <DetailsScreen s={s} set={setS} next={() => setScreen("pin_create")} back={() => setScreen("otp")} />;
      case "pin_create": return <PinScreen s={s} set={setS} next={() => setScreen("pin_confirm")} back={() => setScreen("personal_details")} />;
      case "pin_confirm": return <PinScreen s={s} set={setS} next={() => setScreen("onboarding_success")} back={() => { setS((p) => ({ ...p, pin: "", pinConfirm: "" })); setScreen("pin_create"); }} confirm />;
      case "onboarding_success": return <SuccessScreen s={s} next={() => setScreen("kyc_intro")} />;
      case "kyc_intro": return <KYCIntro next={() => setScreen("id_verification")} back={() => setScreen("onboarding_success")} />;
      case "id_verification": return <IDEntry s={s} set={setS} onSubmit={handleIDSubmit} back={() => setScreen("kyc_intro")} attemptsLeft={attemptsLeft} />;
      case "id_verifying": return <IDVerifying />;
      case "name_consent": return <NameConsent s={s} registryName={s.registryName} onAccept={() => setScreen("dashboard_verified")} onDispute={() => setScreen("manual_intro")} />;
      case "id_fail_mismatch": return <NameMismatch s={s} set={setS} onRetry={handleIDSubmit} onManual={() => setScreen("manual_intro")} attemptsLeft={attemptsLeft} />;
      case "id_fail_service_down": return <ServiceDown onRetry={handleIDSubmit} onManual={() => setScreen("manual_intro")} />;
      case "id_fail_max_attempts": return <MaxAttempts onManual={() => setScreen("manual_intro")} />;
      case "manual_intro": return <ManualIntro next={() => setScreen("capture_id_front")} back={() => setScreen("id_verification")} />;
      case "capture_id_front": return <CaptureFront next={() => setScreen("capture_id_back")} back={() => setScreen("manual_intro")} />;
      case "capture_id_back": return <CaptureBack next={() => setScreen("manual_submitted")} back={() => setScreen("capture_id_front")} />;
      case "manual_submitted": return <ManualDone next={() => setScreen("dashboard_pending")} />;
      case "dashboard_pending": return <DashboardPending s={s} onApprove={() => setScreen("dashboard_verified")} onReject={scenario === "manual-rejected" ? () => { setS((p) => ({ ...p, rejectionReason: "The photo of the front of your ID is too blurry to read. The name and ID number are not clearly visible. Please retake the photo in good lighting and ensure the full card is within the frame." })); setScreen("manual_rejected"); } : undefined} />;
      case "dashboard_verified": return <DashboardOK s={s} />;
      case "manual_rejected": return <ManualRejected reason={s.rejectionReason} onRetry={() => setScreen("manual_intro")} />;
      case "id_fail_blocked": return <OldBlocked />;
      default: return null;
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: "#F3F4F6", padding: "24px 16px" }}>
        {/* Header bar */}
        <div style={{ width: "100%", maxWidth: 420, display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--fg-default)", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-heading)" }}>{meta.title}</h1>
            <p style={{ fontSize: "0.6875rem", color: "var(--fg-muted)" }}>{meta.specRef}</p>
          </div>
          <button onClick={() => { setScreen(scenario === "old-blocked" ? "id_fail_blocked" : "phone_entry"); setS({ phone: "", firstName: "", lastName: "", idNumber: "", pin: "", pinConfirm: "", attempts: 0, registryName: "", rejectionReason: "" }); }}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "var(--bg-surface)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", color: "var(--fg-default)" }}>
            Reset
          </button>
        </div>

        {/* Phone frame */}
        <div style={{
          width: 375, height: 812, borderRadius: 40, background: "#000", padding: 12,
          boxShadow: "0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
        }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", background: "var(--bg-page)" }}>
            {/* Notch */}
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 28, background: "#000", borderRadius: "0 0 16px 16px", zIndex: 10 }} />
            {/* Status bar */}
            <div style={{ height: 44, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 24px 4px", fontSize: 12, fontWeight: 600, color: "var(--fg-default)", position: "relative", zIndex: 5 }}>
              <span>9:41</span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="5" width="3" height="7" rx="0.5" fill="var(--fg-default)"/><rect x="4" y="3" width="3" height="9" rx="0.5" fill="var(--fg-default)"/><rect x="8" y="1" width="3" height="11" rx="0.5" fill="var(--fg-default)"/><rect x="12" y="0" width="3" height="12" rx="0.5" fill="var(--fg-default)" opacity="0.3"/></svg>
                <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0" y="0" width="22" height="12" rx="2" stroke="var(--fg-default)" strokeWidth="1" fill="none"/><rect x="1.5" y="1.5" width="16" height="9" rx="1" fill="var(--color-success)"/><rect x="23" y="3.5" width="1.5" height="5" rx="0.5" fill="var(--fg-default)"/></svg>
              </div>
            </div>
            {/* Content */}
            <div style={{ height: "calc(100% - 44px)", overflow: "hidden" }}>
              {render()}
            </div>
          </div>
        </div>

        {/* Screen indicator */}
        <div style={{ marginTop: 16, padding: "8px 14px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border-default)", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)" }}>Screen:</span>
          <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--fg-default)" }}>{screen}</span>
          {s.attempts > 0 && <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)" }}>| Attempts: {s.attempts}/4</span>}
        </div>
      </div>
    </>
  );
}
