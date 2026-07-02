import ScenarioFlow from "./ScenarioFlow";

const SCENARIOS = [
  "first-time-payment",
  "returning-cashback",
  "name-mismatch",
  "iprs-downtime",
  "full-cashback",
  "session-timeout",
  "smartphone-ussd",
  "invalid-payment-number",
  "menu-new-register",
  "menu-new-pay",
  "menu-returning-pay",
  "menu-returning-balance",
  "menu-verified-pay",
  "menu-verified-balance",
];

export function generateStaticParams() {
  return SCENARIOS.map((id) => ({ id }));
}

export default function Page() {
  return <ScenarioFlow />;
}
