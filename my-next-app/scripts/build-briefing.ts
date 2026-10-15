import { rebuildBriefing } from "../lib/store";

const briefing = rebuildBriefing();
console.log(
  briefing.alerts
    .map((alert) => `${alert.issue} -> ${alert.factor?.dimension} ${alert.factor?.value} (lift ${alert.factor?.lift.toFixed(2)})`)
    .join("\n"),
);
