"use client";

import Link from "next/link";

const PROTOTYPES = [
  {
    id: "id-verification",
    title: "ID Verification",
    description:
      "Sign-up to ID verification flow with fallback and transparency improvements. Covers automated verification, name mismatch retry, manual upload, and edge cases.",
    icon: "🪪",
    color: "#7B18B8",
    bg: "#FBF0FF",
    status: "Live" as const,
  },
  {
    id: "sme-care-fund",
    title: "SME Care Fund Payments",
    description:
      "Payment experience for employees under an employer-funded healthcare allocation. Employer fund appears as a new source alongside M-Pesa, Loan, and Care Fund.",
    icon: "💼",
    color: "#2563EB",
    bg: "#DBEAFE",
    status: "Live" as const,
  },
  {
    id: "ussd-payment",
    title: "USSD Payment Interface",
    description:
      "Feature phone USSD payment via *654# and *654*XXXXXX#. Payment-first, identity-later with tiered KYC. Cashback, IPRS verification, session timeout handling.",
    icon: "📞",
    color: "#059669",
    bg: "#D1FAE5",
    status: "Live" as const,
  },
  {
    id: "school-nurse-payment",
    title: "School Nurse Payment Flow",
    description:
      "Nurse-generated payment links for boarding school parents. Offline-tolerant link generation, pre-filled web payments, USSD fallback, and deferred onboarding with cashback.",
    icon: "🏥",
    color: "#0891B2",
    bg: "#CFFAFE",
    status: "Live" as const,
  },
];

export default function PrototypesHome() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#FBF0FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: "#A020F0" }}>J</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--fg-heading)", lineHeight: 1.2 }}>
              Prototypes
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>Jireh Health</p>
          </div>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "var(--fg-muted)", lineHeight: 1.6, maxWidth: 640 }}>
          Interactive prototypes for Jireh Health product features. Click a tile to explore scenarios.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {PROTOTYPES.map((p) => (
          <Link
            key={p.id}
            href={`/${p.id}`}
            style={{
              textDecoration: "none",
              padding: 24,
              borderRadius: 12,
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = p.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: p.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--fg-heading)" }}>{p.title}</h3>
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: p.status === "Live" ? "#16A34A" : "#EA580C",
                  background: p.status === "Live" ? "#DCFCE7" : "#FFF7ED",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {p.status}
              </span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>{p.description}</p>
            <span style={{ fontSize: "0.8125rem", color: p.color, fontWeight: 500 }}>Explore scenarios →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
