import type { Complaint, Order } from "./types";
import { WEEK_STARTS } from "./weeks";

type Spec = {
  warehouse: string;
  product: string;
  partner: string;
  region: string;
  issue: string;
};

const TARGETS = {
  warehouse: { "North Hub": 80, "Warehouse B": 40, "Coastal Depot": 80 },
  product: { "Oak Chair": 90, "Glass Vase": 30, "Cotton Shirt": 80 },
  partner: { SwiftHaul: 80, MetroRoute: 50, CityDrop: 70 },
  region: { North: 50, South: 50, West: 50, East: 50 },
} as const;

const WAREHOUSE_WEIGHTS: [string, number][] = [
  ["North Hub", 80],
  ["Warehouse B", 40],
  ["Coastal Depot", 80],
];
const PRODUCT_WEIGHTS: [string, number][] = [
  ["Oak Chair", 90],
  ["Glass Vase", 30],
  ["Cotton Shirt", 80],
];
const PARTNER_WEIGHTS: [string, number][] = [
  ["SwiftHaul", 80],
  ["MetroRoute", 50],
  ["CityDrop", 70],
];
const REGION_WEIGHTS: [string, number][] = [
  ["North", 50],
  ["South", 50],
  ["West", 50],
  ["East", 50],
];

type IssuePlan = {
  issue: string;
  count: number;
  focus?: { warehouse?: string; product?: string; partner?: string; count: number };
};

const WEEK_PLANS: IssuePlan[][] = [
  [
    { issue: "late delivery", count: 9, focus: { warehouse: "Warehouse B", count: 2 } },
    { issue: "damaged item", count: 8, focus: { product: "Glass Vase", count: 2 } },
    { issue: "refund delay", count: 6, focus: { partner: "MetroRoute", count: 2 } },
    { issue: "wrong item", count: 8 },
    { issue: "support experience", count: 6 },
  ],
  [
    { issue: "late delivery", count: 10, focus: { warehouse: "Warehouse B", count: 2 } },
    { issue: "damaged item", count: 8, focus: { product: "Glass Vase", count: 2 } },
    { issue: "refund delay", count: 7, focus: { partner: "MetroRoute", count: 2 } },
    { issue: "wrong item", count: 7 },
    { issue: "support experience", count: 7 },
  ],
  [
    { issue: "late delivery", count: 11, focus: { warehouse: "Warehouse B", count: 3 } },
    { issue: "damaged item", count: 9, focus: { product: "Glass Vase", count: 2 } },
    { issue: "refund delay", count: 6, focus: { partner: "MetroRoute", count: 2 } },
    { issue: "wrong item", count: 8 },
    { issue: "support experience", count: 6 },
  ],
  [
    { issue: "late delivery", count: 10, focus: { warehouse: "Warehouse B", count: 3 } },
    { issue: "damaged item", count: 8, focus: { product: "Glass Vase", count: 2 } },
    { issue: "refund delay", count: 7, focus: { partner: "MetroRoute", count: 2 } },
    { issue: "wrong item", count: 8 },
    { issue: "support experience", count: 7 },
  ],
  [
    { issue: "late delivery", count: 13, focus: { warehouse: "Warehouse B", count: 4 } },
    { issue: "damaged item", count: 10, focus: { product: "Glass Vase", count: 3 } },
    { issue: "refund delay", count: 8, focus: { partner: "MetroRoute", count: 3 } },
    { issue: "wrong item", count: 7 },
    { issue: "support experience", count: 6 },
  ],
  [
    { issue: "late delivery", count: 18, focus: { warehouse: "Warehouse B", count: 8 } },
    { issue: "damaged item", count: 14, focus: { product: "Glass Vase", count: 6 } },
    { issue: "refund delay", count: 11, focus: { partner: "MetroRoute", count: 6 } },
    { issue: "wrong item", count: 8 },
    { issue: "support experience", count: 7 },
  ],
];

export function generateDataset(): { orders: Order[]; complaints: Complaint[] } {
  const orders: Order[] = [];
  const complaints: Complaint[] = [];
  let nextOrderId = 5001;
  let nextComplaint = 1;

  WEEK_STARTS.forEach((week, weekIndex) => {
    const specs = weekSpecs(WEEK_PLANS[weekIndex]);
    const weekOrders = buildWeekOrders(week, nextOrderId, specs);
    nextOrderId += weekOrders.length;
    orders.push(...weekOrders);

    specs.forEach((spec, index) => {
      complaints.push(makeComplaint(spec.issue, weekOrders[index], week, index, nextComplaint));
      nextComplaint += 1;
    });
  });

  return { orders, complaints };
}

function weekSpecs(plans: IssuePlan[]): Spec[] {
  return plans.flatMap((plan) => {
    const warehouses = mix(plan.count, WAREHOUSE_WEIGHTS, plan.focus?.warehouse, plan.focus?.warehouse ? plan.focus.count : 0);
    const products = mix(plan.count, PRODUCT_WEIGHTS, plan.focus?.product, plan.focus?.product ? plan.focus.count : 0);
    const partners = mix(plan.count, PARTNER_WEIGHTS, plan.focus?.partner, plan.focus?.partner ? plan.focus.count : 0);
    const regions = mix(plan.count, REGION_WEIGHTS);
    return warehouses.map((warehouse, index) => ({
      issue: plan.issue,
      warehouse,
      product: products[index],
      partner: partners[index],
      region: regions[index],
    }));
  });
}

function mix(count: number, weights: [string, number][], focus?: string, focusCount = 0): string[] {
  const rest = allocate(count - focusCount, focus ? weights.filter(([name]) => name !== focus) : weights);
  return focus ? [...Array(focusCount).fill(focus), ...rest] : rest;
}

function allocate(count: number, weights: [string, number][]): string[] {
  if (count <= 0) return [];
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const rows = weights.map(([name, weight]) => {
    const exact = (count * weight) / total;
    return { name, base: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let used = rows.reduce((sum, row) => sum + row.base, 0);
  const byFrac = [...rows].sort((a, b) => b.frac - a.frac || a.name.localeCompare(b.name));
  let index = 0;
  while (used < count) {
    byFrac[index % byFrac.length].base += 1;
    used += 1;
    index += 1;
  }
  return rows.flatMap((row) => Array(row.base).fill(row.name));
}

function buildWeekOrders(week: string, idStart: number, specs: Spec[]): Order[] {
  const counts = {
    warehouse: empty(TARGETS.warehouse),
    product: empty(TARGETS.product),
    partner: empty(TARGETS.partner),
    region: empty(TARGETS.region),
  };
  const orders: Order[] = [];
  let nextId = idStart;

  for (const [index, item] of specs.entries()) {
    orders.push(orderFrom(week, nextId, index, item));
    bump(counts, item);
    nextId += 1;
  }

  while (orders.length < 200) {
    const filler: Spec = {
      issue: "",
      warehouse: mostBehind(counts.warehouse, TARGETS.warehouse),
      product: mostBehind(counts.product, TARGETS.product),
      partner: mostBehind(counts.partner, TARGETS.partner),
      region: mostBehind(counts.region, TARGETS.region),
    };
    orders.push(orderFrom(week, nextId, orders.length, filler));
    bump(counts, filler);
    nextId += 1;
  }

  return orders;
}

function orderFrom(week: string, id: number, index: number, item: Spec): Order {
  return {
    orderId: String(id),
    orderedAt: atTime(week, index, id),
    product: item.product,
    warehouse: item.warehouse,
    partner: item.partner,
    region: item.region,
  };
}

function makeComplaint(issue: string, order: Order, week: string, index: number, complaintNumber: number): Complaint {
  return {
    id: `c${String(complaintNumber).padStart(4, "0")}`,
    text: complaintText(issue, order.orderId, complaintNumber),
    createdAt: atTime(week, index, complaintNumber + 17),
    channel: "email",
    orderId: order.orderId,
  };
}

function atTime(week: string, index: number, seed: number): string {
  const date = new Date(`${week}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + (index % 7));
  date.setUTCHours(8 + ((seed * 5) % 11), (seed * 17) % 60, (seed * 11) % 60, 0);
  return date.toISOString();
}

function complaintText(issue: string, orderId: string, seed: number): string {
  const variants: Record<string, string[]> = {
    "late delivery": [
      `Hi, Order ${orderId} was due Tuesday and the delivery was late. Can you tell me where it is?`,
      `The carrier marked Order ${orderId} as delayed. This late delivery has left us without the item for work.`,
      `Just checking in because Order ${orderId} still has not shown up. The delivery is late again.`,
      `Order ${orderId} missed the delivery window. It is now a full day late.`,
      `Our office was closed waiting on Order ${orderId}. The late delivery means we cannot finish the setup.`,
      `Please look at Order ${orderId}. The tracking has not moved and the delivery is late.`,
    ],
    "damaged item": [
      `Order ${orderId} arrived damaged. The corner of the box was crushed and the item is cracked.`,
      `I opened Order ${orderId} and the product is broken. It looks damaged from the trip.`,
      `The glass in Order ${orderId} is cracked. Please treat this as a damaged item.`,
      `Order ${orderId} came with a torn carton. The contents are damaged and one piece is broken.`,
      `There is a crack across the item in Order ${orderId}. I cannot use something that arrived damaged.`,
      `Order ${orderId} was wet when it arrived and the product is damaged.`,
    ],
    "wrong item": [
      `Order ${orderId} is the wrong item. I ordered a different size and colour.`,
      `What arrived for Order ${orderId} is the wrong item. The label does not match my order.`,
      `I received an incorrect item on Order ${orderId}. This is the wrong item entirely.`,
      `Order ${orderId} contains the wrong item. The sku on the packing slip is not what I bought.`,
      `Please arrange a swap for Order ${orderId}. You sent the wrong item.`,
      `The box for Order ${orderId} had someone else's product. It is the wrong item.`,
    ],
    "refund delay": [
      `I returned Order ${orderId} ten days ago and I am still waiting on the refund.`,
      `The refund for Order ${orderId} has not reached my card. Can you check the status?`,
      `Order ${orderId} was cancelled, but the refund is still missing.`,
      `Support told me the refund for Order ${orderId} was sent last week. It is not there.`,
      `I need the refund from Order ${orderId} before I can place a replacement.`,
      `Following up on Order ${orderId}. The return was accepted and the refund has not posted.`,
    ],
    "support experience": [
      `I am wondering why customer service closed Order ${orderId} without an answer.`,
      `The support agent on Order ${orderId} was rude and ended the chat.`,
      `Customer service kept transferring me about Order ${orderId} and nobody followed up.`,
      `I asked for help with Order ${orderId} and the support agent was rude about the wait.`,
      `Customer service told me to reorder Order ${orderId} instead of fixing it.`,
      `The note on Order ${orderId} says resolved, but customer service never replied to me.`,
    ],
  };
  return variants[issue][seed % variants[issue].length];
}

function empty(target: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.keys(target).map((key) => [key, 0]));
}

function bump(
  counts: Record<keyof typeof TARGETS, Record<string, number>>,
  item: Spec,
) {
  counts.warehouse[item.warehouse] += 1;
  counts.product[item.product] += 1;
  counts.partner[item.partner] += 1;
  counts.region[item.region] += 1;
}

function mostBehind(counts: Record<string, number>, targets: Record<string, number>): string {
  let best = "";
  let gap = -Infinity;
  for (const key of Object.keys(targets)) {
    const remaining = targets[key] - (counts[key] ?? 0);
    if (remaining > gap) {
      gap = remaining;
      best = key;
    }
  }
  if (gap <= 0) {
    throw new Error(`Weekly targets exceeded while filling ${best || "orders"}`);
  }
  return best;
}
