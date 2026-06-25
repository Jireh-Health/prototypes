"use client";

import Link from "next/link";

const SCENARIOS = [
  {
    id: "happy-path",
    title: "Happy Path",
    description: "Automated verification succeeds. Names match exactly. Straight through to verified dashboard.",
    icon: "✅",
    color: "#16A34A",
    bg: "#DCFCE7",
    specRef: "Scenario 7.3.1",
  },
  {
    id: "name-mismatch-retry",
    title: "Name Mismatch + Retry",
    description: "Registry returns a different name (Fatuma vs Fatma). User sees both names, corrects, and retries successfully.",
    icon: "🔄",
    color: "#2563EB",
    bg: "#DBEAFE",
    specRef: "Scenario 7.3.2",
  },
  {
    id: "service-down-manual",
    title: "Service Down + Manual Fallback",
    description: "Pata Score API is down. User sees 'temporarily unavailable' (no attempt consumed) and switches to manual ID photo upload.",
    icon: "🔌",
    color: "#EA580C",
    bg: "#FFF7ED",
    specRef: "Scenario 7.3.3",
  },
  {
    id: "name-differs-consent",
    title: "Name Differs + Consent",
    description: "Verification succeeds but the registry name differs from the form name. Name consent screen shown before proceeding.",
    icon: "📝",
    color: "#7B18B8",
    bg: "#FBF0FF",
    specRef: "Scenario 7.3.5",
  },
  {
    id: "max-attempts",
    title: "Max Attempts Exhausted",
    description: "4 failed attempts from name mismatches. Unlike the old flow (dead end), manual fallback is still available.",
    icon: "🚫",
    color: "#DC2626",
    bg: "#FEE2E2",
    specRef: "Scenario 7.3.8",
  },
  {
    id: "manual-approved",
    title: "Manual Verification Approved",
    description: "Full end-to-end: service is down, user uploads ID photos, waits on limited dashboard, admin approves.",
    icon: "📸",
    color: "#2D7A3A",
    bg: "#DCFCE7",
    specRef: "Scenarios 7.3.3 + 7.3.4",
  },
  {
    id: "manual-rejected",
    title: "Manual Verification Rejected",
    description: "Admin reviews the uploaded ID photos and rejects them with a specific reason. User sees why and can re-upload.",
    icon: "👎",
    color: "#DC2626",
    bg: "#FEE2E2",
    specRef: "Scenario 7.3.4 — Manual Review Rejection + Retry",
  },
  {
    id: "old-blocked",
    title: "Old Flow: Blocked (Dead End)",
    description: "The current production experience. User fails verification and hits a dead-end page with only a WhatsApp link. No fallback.",
    icon: "💀",
    color: "#6B7280",
    bg: "#F3F4F6",
    specRef: "Problem 2.1 — No Fallback",
  },
];

export default function IDVerificationPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <Link href="/" style={{ fontSize: "0.8125rem", color: "#A020F0", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          All Prototypes
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FBF0FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#A020F0" }}>J</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--fg-heading)", lineHeight: 1.2 }}>
              ID Verification Prototype
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>Jireh Health</p>
          </div>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "var(--fg-muted)", lineHeight: 1.6, maxWidth: 640 }}>
          Interactive prototype of the sign-up to ID verification flow with the proposed fallback and transparency changes.
          Each scenario walks through the full onboarding (phone, OTP, name, PIN) then diverges at ID verification to demonstrate a specific outcome.
        </p>
        <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: "#F3F4F6", display: "inline-block" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
            Spec: patient-id-verification-fallback-and-transparency.md
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {SCENARIOS.map((s) => (
          <Link
            key={s.id}
            href={`/id-verification/scenario/${s.id}`}
            style={{
              textDecoration: "none",
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = s.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {s.icon}
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-heading)", flex: 1 }}>{s.title}</h3>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", lineHeight: 1.5, flex: 1 }}>{s.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.6875rem", color: s.color, fontWeight: 500 }}>{s.specRef}</span>
              <span style={{ fontSize: "0.75rem", color: s.color, fontWeight: 500 }}>Open →</span>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-default)" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 12 }}>What changed from the current flow</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 8, background: "#FEE2E2", border: "1px solid rgba(220,38,38,0.15)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>Before (current production)</p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--fg-default)", lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>No explanation of what verification does</li>
              <li>Generic error on failure</li>
              <li>No manual fallback path</li>
              <li>Service downtime consumes attempts</li>
              <li>Silent name overwrite on success</li>
              <li>Dead-end block after 4 failures</li>
            </ul>
          </div>
          <div style={{ padding: 16, borderRadius: 8, background: "#DCFCE7", border: "1px solid rgba(22,163,74,0.15)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16A34A", marginBottom: 6 }}>After (this prototype)</p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--fg-default)", lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>Context card explains IPRS verification</li>
              <li>Specific error messages with both names shown</li>
              <li>Manual ID photo fallback always available</li>
              <li>Service failures do not consume attempts</li>
              <li>Name change requires explicit consent</li>
              <li>Limited dashboard access while review is pending</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
