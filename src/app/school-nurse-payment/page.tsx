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

const NURSE_SCENARIOS: Scenario[] = [
  {
    id: "nurse-generate-link",
    title: "Generate Payment Link (New Student)",
    description:
      "The nurse enters parent phone, student name, charge number, and amount. System generates a unique payment link and sends SMS to the parent.",
    icon: "🔗",
    color: "#7B18B8",
    bg: "#FBF0FF",
    specRef: "Solution 4.2",
  },
  {
    id: "nurse-returning-parent",
    title: "Returning Parent (Linked Children)",
    description:
      "The nurse enters a returning parent's phone number. System shows a dropdown of linked children. Nurse selects the child, enters charge number and amount.",
    icon: "👨‍👧",
    color: "#2563EB",
    bg: "#DBEAFE",
    specRef: "Solution 4.2",
  },
  {
    id: "nurse-offline-batch",
    title: "Offline Batch (3 Links Queued)",
    description:
      "The nurse generates 3 payment links while offline. Internet reconnects. System syncs and sends all 3 SMS messages automatically.",
    icon: "📡",
    color: "#EA580C",
    bg: "#FFF7ED",
    specRef: "Solution 4.2 + Click-Stop 1",
  },
  {
    id: "nurse-dashboard",
    title: "Payment Status Dashboard",
    description:
      "Nurse views payment status: student name, amount, SMS sent/delivered time, payment time, status. Sends a reminder for an unpaid link.",
    icon: "📊",
    color: "#059669",
    bg: "#D1FAE5",
    specRef: "Solution 4.10",
  },
];

const PARENT_SCENARIOS: Scenario[] = [
  {
    id: "parent-first-payment-web",
    title: "First Payment via Web Link",
    description:
      "Grace receives SMS, opens link, sees pre-filled payment screen (Cana Hospital, Daniel, CN-4421, KES 2,500). Pays via M-Pesa. Tier 1 account created. Cashback shown.",
    icon: "💳",
    color: "#16A34A",
    bg: "#DCFCE7",
    specRef: "Scenario 7.3.1",
  },
  {
    id: "parent-second-payment-gate",
    title: "Second Payment Onboarding Gate",
    description:
      "Parent opens second payment link but hasn't onboarded. Sees onboarding requirement with cashback incentive. After onboarding, returns to payment.",
    icon: "🔐",
    color: "#2563EB",
    bg: "#DBEAFE",
    specRef: "Solution 4.6",
  },
  {
    id: "parent-ussd-payment",
    title: "USSD Payment Request",
    description:
      "Parent dials *654#, selects 'Payment requests', sees pending payment from nurse, selects it, pays via M-Pesa. Tier 1 account created.",
    icon: "📱",
    color: "#0891B2",
    bg: "#CFFAFE",
    specRef: "Solution 4.8",
  },
  {
    id: "parent-ussd-second-payment",
    title: "USSD Second Payment (KYC Gate)",
    description:
      "Parent dials *654# for second payment. KYC gate triggers. After providing identity details, selects payment request and pays.",
    icon: "🔑",
    color: "#7B18B8",
    bg: "#FBF0FF",
    specRef: "Solution 4.8",
  },
  {
    id: "parent-app-payment-request",
    title: "App Payment Request (Onboarded)",
    description:
      "Onboarded parent opens app, sees pending payment request from nurse on dashboard, completes payment using blended payment screen (cashback + M-Pesa).",
    icon: "📲",
    color: "#059669",
    bg: "#D1FAE5",
    specRef: "Solution 4.7",
  },
];

function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {scenarios.map((s) => (
        <Link
          key={s.id}
          href={`/school-nurse-payment/scenario/${s.id}`}
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg-heading)" }}>{title}</h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}

export default function SchoolNursePaymentPage() {
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
              School Nurse Payment Flow
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>Jireh Health</p>
          </div>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "var(--fg-muted)", lineHeight: 1.6, maxWidth: 640 }}>
          Nurse-generated payment links with deferred onboarding. The nurse generates a link per student treatment. Parents pay via web, USSD, or the Jireh app with no account creation required on first payment.
        </p>
        <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: "#F3F4F6", display: "inline-block" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
            Spec: school-nurse-payment-flow.md
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        <section>
          <SectionHeader
            title="Nurse Portal (Provider Side)"
            subtitle="The nurse generates payment links, manages returning parents, works offline, and tracks payment status."
          />
          <ScenarioGrid scenarios={NURSE_SCENARIOS} />
        </section>

        <section>
          <SectionHeader
            title="Parent Payment (Patient Side)"
            subtitle="Parents pay via web link, USSD, or the Jireh app. First payment is frictionless. Onboarding gates the second."
          />
          <ScenarioGrid scenarios={PARENT_SCENARIOS} />
        </section>
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-default)" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 12 }}>Key design decisions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 8, background: "#FBF0FF", border: "1px solid rgba(123,24,184,0.15)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#7B18B8", marginBottom: 6 }}>First payment: zero friction</p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--fg-default)", lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>No account creation required</li>
              <li>No app download needed</li>
              <li>Pre-filled payment details from link</li>
              <li>Tier 1 account created silently on payment</li>
            </ul>
          </div>
          <div style={{ padding: 16, borderRadius: 8, background: "#DCFCE7", border: "1px solid rgba(22,163,74,0.15)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16A34A", marginBottom: 6 }}>Nurse-first design</p>
            <ul style={{ fontSize: "0.8125rem", color: "var(--fg-default)", lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>Offline-tolerant link generation</li>
              <li>Batch entry for multiple students</li>
              <li>Returning parent auto-detection</li>
              <li>SMS delivery tracking + reminders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
