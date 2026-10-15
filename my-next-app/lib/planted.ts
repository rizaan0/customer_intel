import type { FactorDimension } from "./types";

export const PLANTED: { issue: string; dimension: FactorDimension; value: string }[] = [
  { issue: "late delivery", dimension: "warehouse", value: "Warehouse B" },
  { issue: "damaged item", dimension: "product", value: "Glass Vase" },
  { issue: "refund delay", dimension: "partner", value: "MetroRoute" },
];
