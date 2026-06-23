import ScenarioFlow from "./ScenarioFlow";

const SCENARIOS = [
  "happy-path",
  "name-mismatch-retry",
  "service-down-manual",
  "name-differs-consent",
  "max-attempts",
  "manual-approved",
  "manual-rejected",
  "old-blocked",
];

export function generateStaticParams() {
  return SCENARIOS.map((id) => ({ id }));
}

export default function Page() {
  return <ScenarioFlow />;
}
