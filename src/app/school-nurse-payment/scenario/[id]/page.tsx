import ScenarioFlow from "./ScenarioFlow";

const SCENARIOS = [
  "nurse-generate-link",
  "nurse-returning-parent",
  "nurse-offline-batch",
  "nurse-dashboard",
  "parent-first-payment-web",
  "parent-second-payment-gate",
  "parent-ussd-payment",
  "parent-ussd-second-payment",
  "parent-app-payment-request",
];

export function generateStaticParams() {
  return SCENARIOS.map((id) => ({ id }));
}

export default function Page() {
  return <ScenarioFlow />;
}
