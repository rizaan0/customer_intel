import type { IssueLabel, Sentiment, Severity } from "./types";

const ISSUE_RULES: { issue: string; reason: string; test: (text: string) => boolean }[] = [
  {
    issue: "damaged item",
    reason: 'Matched "damaged".',
    test: (text) => /damaged|broken|cracked/i.test(text),
  },
  {
    issue: "wrong item",
    reason: 'Matched "wrong item".',
    test: (text) => /wrong item|incorrect item/i.test(text),
  },
  {
    issue: "refund delay",
    reason: 'Matched "refund".',
    test: (text) => /refund/i.test(text),
  },
  {
    issue: "late delivery",
    reason: 'Matched "late" and "delivery".',
    test: (text) => /late/i.test(text) && /deliver/i.test(text),
  },
  {
    issue: "support experience",
    reason: 'Matched "customer service" or "rude".',
    test: (text) => /customer service|support agent|rude/i.test(text),
  },
];

export function issueSlug(issue: string): string {
  return issue.toLowerCase().replace(/\s+/g, "-");
}

export function labelComplaint(text: string): IssueLabel {
  const matched = ISSUE_RULES.find((rule) => rule.test(text));
  const issue = matched?.issue ?? "other";
  const reason = matched?.reason ?? "No issue keyword matched.";
  return {
    issue,
    reason,
    sentiment: sentimentOf(text),
    severity: severityOf(issue, text),
  };
}

function sentimentOf(text: string): Sentiment {
  if (/\b(thank|thanks|great|excellent)\b/i.test(text)) return "positive";
  if (/\b(checking|wondering)\b/i.test(text)) return "neutral";
  return "negative";
}

function severityOf(issue: string, text: string): Severity {
  if (issue === "damaged item" || issue === "refund delay") return "high";
  if (/\b(unacceptable|furious|worst)\b/i.test(text)) return "high";
  if (issue === "support experience" || issue === "other") return "low";
  return "medium";
}
