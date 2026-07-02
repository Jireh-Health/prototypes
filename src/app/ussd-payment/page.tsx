"use client";

import Link from "next/link";

type Scenario = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  specRef: string;
};

const MENU_NEW: Scenario[] = [
  {
    id: "menu-new-register",
    title: "Register via *654#",
    description: "Grace dials *654# and registers before her first payment. Name, DOB, and national ID collected upfront. IPRS verifies.",
    icon: "📝",
    color: "#7B18B8",
    bg: "#FBF0FF",
    specRef: "Solution 4.1 — Register",
  },
  {
    id: "menu-new-pay",
    title: "Pay a Bill via *654#",
    description: "James dials *654# and pays his first bill. Tier 1 account created silently on payment. Cashback earned.",
    icon: "💳",
    color: "#16A34A",
    bg: "#DCFCE7",
    specRef: "Solution 4.1 — Pay (new)",
  },
  {
    id: "invalid-payment-number",
    title: "Invalid Payment Number",
    description: "Peter enters the wrong payment number. The system catches the error and lets him retry without losing the session.",
    icon: "❌",
    color: "#6B7280",
    bg: "#F3F4F6",
    specRef: "Scenario 7.3.8",
  },
];

const MENU_RETURNING: Scenario[] = [
  {
    id: "menu-returning-pay",
    title: "Pay a Bill (KYC Gate)",
    description: "Nancy's second payment via *654# triggers the one-time KYC gate. After identity collection, she pays with cashback.",
    icon: "🔐",
    color: "#2563EB",
    bg: "#DBEAFE",
    specRef: "Solution 4.1 + 4.4",
  },
  {
    id: "menu-returning-balance",
    title: "View Cashback Balance",
    description: "Vitalis dials *654# to check his cashback balance without making a payment. No app needed.",
    icon: "💰",
    color: "#059669",
    bg: "#D1FAE5",
    specRef: "Solution 4.1 — Balance",
  },
  {
    id: "session-timeout",
    title: "Session Timeout & Resume",
    description: "John's USSD session times out while he searches for his invoice. He redials and resumes without re-entering data.",
    icon: "⏱️",
    color: "#DC2626",
    bg: "#FEE2E2",
    specRef: "Scenario 7.3.6",
  },
];

const MENU_VERIFIED: Scenario[] = [
  {
    id: "menu-verified-pay",
    title: "Pay a Bill (Personalised)",
    description: "Gladys dials *654# and sees 'Hi Gladys'. No KYC gate. Straight to payment with cashback applied.",
    icon: "👋",
    color: "#0891B2",
    bg: "#CFFAFE",
    specRef: "Solution 4.1 — Personalised",
  },
  {
    id: "menu-verified-balance",
    title: "View Cashback Balance",
    description: "Ruth dials *654# and sees her personalised greeting. She checks her accumulated cashback from 6 payments.",
    icon: "📊",
    color: "#7B18B8",
    bg: "#FBF0FF",
    specRef: "Solution 4.1 — Balance",
  },
];

const DIRECT_ENTRY: Scenario[] = [
  {
    id: "first-time-payment",
    title: "First Payment (Direct Entry)",
    description: "David dials *654*384201# on his feature phone. Payment in under 60 seconds. No account, no app, no data.",
    icon: "📱",
    color: "#16A34A",
    bg: "#DCFCE7",
    specRef: "Scenario 7.3.1",
  },
  {
    id: "returning-cashback",
    title: "Returning User + Cashback + KYC",
    description: "David's second direct-entry payment triggers KYC. He applies KES 90 cashback to reduce the M-Pesa amount.",
    icon: "🔄",
    color: "#2563EB",
    bg: "#DBEAFE",
    specRef: "Scenario 7.3.2",
  },
  {
    id: "smartphone-ussd",
    title: "Smartphone User via USSD",
    description: "Mercy has the Jireh app but data is too slow. She dials *654*271045# and her cashback carries over.",
    icon: "📶",
    color: "#0891B2",
    bg: "#CFFAFE",
    specRef: "Scenario 7.3.7",
  },
  {
    id: "full-cashback",
    title: "Full Cashback Coverage",
    description: "Gladys's KES 320 cashback exceeds the KES 200 bill. No M-Pesa STK push needed.",
    icon: "💰",
    color: "#059669",
    bg: "#D1FAE5",
    specRef: "Scenario 7.3.5",
  },
];

const EDGE_CASES: Scenario[] = [
  {
    id: "name-mismatch",
    title: "IPRS Name Mismatch",
    description: "Amina's surname doesn't match IPRS. She must re-enter her details. No option to proceed with a mismatch.",
    icon: "⚠️",
    color: "#EA580C",
    bg: "#FFF7ED",
    specRef: "Scenario 7.3.3",
  },
  {
    id: "iprs-downtime",
    title: "IPRS Downtime During KYC",
    description: "Pata Score API is down. Payment proceeds. On Samuel's next visit, IPRS retries and silently verifies.",
    icon: "🔌",
    color: "#7B18B8",
    bg: "#FBF0FF",
    specRef: "Scenario 7.3.4",
  },
];

function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {scenarios.map((s) => (
        <Link
          key={s.id}
          href={`/ussd-payment/scenario/${s.id}`}
          style={{
            textDecoration: "none",
            padding: 18,
            borderRadius: 12,
            border: "1px solid var(--border-default)",
            background: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
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
            <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
              {s.icon}
            </div>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg-heading)", flex: 1 }}>{s.title}</h3>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", lineHeight: 1.5, flex: 1 }}>{s.description}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.6875rem", color: s.color, fontWeight: 500 }}>{s.specRef}</span>
            <span style={{ fontSize: "0.75rem", color: s.color, fontWeight: 500 }}>Open &rarr;</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle, code }: { title: string; subtitle: string; code?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg-heading)" }}>{title}</h2>
        {code && (
          <code style={{ fontSize: "0.75rem", color: "var(--fg-muted)", background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>{code}</code>
        )}
      </div>
      <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}

export default function UssdPaymentPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <Link href="/" style={{ fontSize: "0.8125rem", color: "#A020F0", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          All Prototypes
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FBF0FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#A020F0" }}>J</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--fg-heading)", lineHeight: 1.2 }}>
              USSD Payment Prototype
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>Jireh Health</p>
          </div>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "var(--fg-muted)", lineHeight: 1.6, maxWidth: 640 }}>
          Interactive prototype of the USSD payment interface. Two entry points: <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 4, fontSize: "0.875rem" }}>*654#</code> (menu-first) and <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 4, fontSize: "0.875rem" }}>*654*XXXXXX#</code> (direct entry).
        </p>
        <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: "#F3F4F6", display: "inline-block" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
            Spec: ussd-payment-interface.md
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        <section>
          <SectionHeader
            title="New user"
            subtitle="No existing Jireh account. Menu shows Register first, Pay second."
            code="*654#"
          />
          <ScenarioGrid scenarios={MENU_NEW} />
        </section>

        <section>
          <SectionHeader
            title="Returning user (Tier 1)"
            subtitle="Has made one payment. Menu shows Pay first, View cashback second. KYC gate triggers on second payment."
            code="*654#"
          />
          <ScenarioGrid scenarios={MENU_RETURNING} />
        </section>

        <section>
          <SectionHeader
            title="Verified user (Tier 2)"
            subtitle="KYC complete. Personalised greeting. No KYC gate. Straight to payment or balance."
            code="*654#"
          />
          <ScenarioGrid scenarios={MENU_VERIFIED} />
        </section>

        <section>
          <SectionHeader
            title="Direct entry"
            subtitle="User dials the 6 digits after JH- directly. Skips the main menu."
            code="*654*XXXXXX#"
          />
          <ScenarioGrid scenarios={DIRECT_ENTRY} />
        </section>

        <section>
          <SectionHeader
            title="Verification edge cases"
            subtitle="IPRS name mismatch and downtime scenarios during the KYC gate."
          />
          <ScenarioGrid scenarios={EDGE_CASES} />
        </section>
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-default)" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 12 }}>Key design decisions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 8, background: "#FBF0FF", border: "1px solid rgba(123,24,184,0.15)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#7B18B8", marginBottom: 6 }}>Payment first, identity later</p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--fg-default)", lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>First payment: zero friction, phone only</li>
              <li>Second payment: name, DOB, ID (one-time KYC)</li>
              <li>Loans/Circles: require the app</li>
            </ul>
          </div>
          <div style={{ padding: 16, borderRadius: 8, background: "#DCFCE7", border: "1px solid rgba(22,163,74,0.15)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16A34A", marginBottom: 6 }}>Works on every phone</p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--fg-default)", lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>No data connection needed</li>
              <li>No smartphone needed</li>
              <li>M-Pesa-native interaction model</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
