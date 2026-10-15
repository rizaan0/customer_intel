import { generateDataset } from "../lib/generate";
import { buildBriefing } from "../lib/pipeline";
import { PLANTED } from "../lib/planted";

const { complaints, orders } = generateDataset();
const briefing = buildBriefing(complaints, orders);
const found = briefing.alerts.map(
  (alert) => `${alert.issue}|${alert.factor?.dimension ?? ""}|${alert.factor?.value ?? ""}`,
);

let failed = false;
if (briefing.alerts.length !== PLANTED.length) {
  console.error(`Expected ${PLANTED.length} alerts, found ${briefing.alerts.length}.`);
  failed = true;
}

for (const planted of PLANTED) {
  const key = `${planted.issue}|${planted.dimension}|${planted.value}`;
  if (!found.includes(key)) {
    console.error(`Missing planted cause ${key}`);
    failed = true;
  }
}

if (failed) {
  console.error("Alerts:");
  for (const alert of briefing.alerts) {
    console.error(`- ${alert.issue}: ${alert.current} vs baseline ${alert.baseline.toFixed(1)}`);
    console.error(`  top factor ${alert.factor?.dimension} ${alert.factor?.value} lift ${alert.factor?.lift}`);
  }
  const late = briefing.investigations.find((item) => item.issue === "late delivery");
  console.error("Late delivery factors:");
  for (const factor of late?.factors ?? []) {
    console.error(
      `  ${factor.dimension} ${factor.value} complaints ${factor.complaintCount} lift ${factor.lift.toFixed(2)} qualifies ${factor.qualifies}`,
    );
  }
  process.exit(1);
}

console.log("Verified planted causes:");
for (const key of found) console.log(`- ${key}`);
