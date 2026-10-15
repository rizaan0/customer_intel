import type { Complaint, Order } from "./types";
import { addDays, WEEK_STARTS } from "./weeks";

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

const CHANNELS = [
  ...Array(24).fill("phone"),
  ...Array(18).fill("email"),
  ...Array(17).fill("chat"),
  ...Array(16).fill("review"),
  ...Array(14).fill("social"),
  ...Array(11).fill("support portal"),
];

const REGIONS = ["North", "South", "West", "East"];

export function generateDataset(): { orders: Order[]; complaints: Complaint[] } {
  const orders: Order[] = [];
  const complaints: Complaint[] = [];
  let nextOrderId = 5001;
  let nextComplaint = 1;
  let channelCursor = 0;

  WEEK_STARTS.forEach((week, weekIndex) => {
    const spike = weekIndex === WEEK_STARTS.length - 1;
    const specs = spike ? spikeSpecs() : baselineSpecs();
    const weekOrders = buildWeekOrders(week, nextOrderId, specs);
    nextOrderId += weekOrders.length;
    orders.push(...weekOrders);

    specs.forEach((spec, index) => {
      const order = weekOrders[index];
      complaints.push(
        makeComplaint(spec.issue, order, week, index, nextComplaint, CHANNELS[(channelCursor + weekIndex * 11) % CHANNELS.length]),
      );
      nextComplaint += 1;
      channelCursor += 1;
    });

    const unlinkedIssues = spike
      ? (["wrong item", "support experience"] as const)
      : (["wrong item", "support experience"] as const);
    for (const issue of unlinkedIssues) {
      complaints.push(
        makeComplaint(issue, null, week, specs.length, nextComplaint, CHANNELS[(channelCursor + weekIndex * 11) % CHANNELS.length]),
      );
      nextComplaint += 1;
      channelCursor += 1;
    }
  });

  return { orders, complaints };
}

function baselineSpecs(): Spec[] {
  const issues: [string, number][] = [
    ["late delivery", 4],
    ["damaged item", 3],
    ["refund delay", 2],
    ["wrong item", 5],
    ["support experience", 4],
  ];
  const specs: Spec[] = [];
  for (const [issue, count] of issues) {
    for (let i = 0; i < count; i++) specs.push(looseSpec(issue, specs.length));
  }
  return specs;
}

function looseSpec(issue: string, index: number): Spec {
  const warehouses = ["North Hub", "Warehouse B", "Coastal Depot", "North Hub", "Coastal Depot"];
  const products = ["Oak Chair", "Cotton Shirt", "Glass Vase", "Oak Chair", "Cotton Shirt"];
  const partners = ["SwiftHaul", "CityDrop", "MetroRoute", "SwiftHaul", "CityDrop"];
  return {
    issue,
    warehouse: warehouses[index % warehouses.length],
    product: products[index % products.length],
    partner: partners[index % partners.length],
    region: REGIONS[index % REGIONS.length],
  };
}

function spikeSpecs(): Spec[] {
  return [
    ...repeatSpecs("late delivery", {
      count: 16,
      warehouse: "Warehouse B",
      products: pack(["Oak Chair", 7], ["Glass Vase", 2], ["Cotton Shirt", 7]),
      partners: pack(["SwiftHaul", 6], ["MetroRoute", 4], ["CityDrop", 6]),
    }),
    spec("late delivery", "North Hub", "Oak Chair", "SwiftHaul", "North"),
    spec("late delivery", "North Hub", "Glass Vase", "CityDrop", "South"),
    spec("late delivery", "Coastal Depot", "Cotton Shirt", "MetroRoute", "West"),
    spec("late delivery", "Coastal Depot", "Cotton Shirt", "SwiftHaul", "East"),
    ...repeatSpecs("damaged item", {
      count: 12,
      product: "Glass Vase",
      warehouses: pack(["North Hub", 5], ["Warehouse B", 2], ["Coastal Depot", 5]),
      partners: pack(["SwiftHaul", 4], ["MetroRoute", 4], ["CityDrop", 4]),
    }),
    spec("damaged item", "Coastal Depot", "Oak Chair", "SwiftHaul", "North"),
    spec("damaged item", "Coastal Depot", "Oak Chair", "CityDrop", "South"),
    spec("damaged item", "North Hub", "Cotton Shirt", "SwiftHaul", "West"),
    spec("damaged item", "North Hub", "Cotton Shirt", "CityDrop", "East"),
    ...repeatSpecs("refund delay", {
      count: 8,
      partner: "MetroRoute",
      warehouses: pack(["North Hub", 3], ["Warehouse B", 2], ["Coastal Depot", 3]),
      products: pack(["Oak Chair", 3], ["Cotton Shirt", 3], ["Glass Vase", 2]),
    }),
    spec("refund delay", "North Hub", "Oak Chair", "SwiftHaul", "North"),
    spec("refund delay", "Coastal Depot", "Cotton Shirt", "SwiftHaul", "South"),
    spec("refund delay", "North Hub", "Oak Chair", "CityDrop", "West"),
    spec("refund delay", "Coastal Depot", "Cotton Shirt", "CityDrop", "East"),
    ...repeatSpecs("wrong item", {
      count: 5,
      warehouses: pack(["North Hub", 2], ["Warehouse B", 1], ["Coastal Depot", 2]),
      products: pack(["Oak Chair", 2], ["Cotton Shirt", 2], ["Glass Vase", 1]),
      partners: pack(["SwiftHaul", 2], ["CityDrop", 2], ["MetroRoute", 1]),
    }),
    ...repeatSpecs("support experience", {
      count: 4,
      warehouses: pack(["North Hub", 2], ["Coastal Depot", 2]),
      products: pack(["Oak Chair", 2], ["Cotton Shirt", 2]),
      partners: pack(["SwiftHaul", 2], ["CityDrop", 2]),
    }),
  ];
}

function spec(
  issue: string,
  warehouse: string,
  product: string,
  partner: string,
  region: string,
): Spec {
  return { issue, warehouse, product, partner, region };
}

function pack(...pairs: [string, number][]): string[] {
  return pairs.flatMap(([name, count]) => Array(count).fill(name));
}

function repeatSpecs(
  issue: string,
  options: {
    count: number;
    warehouse?: string;
    product?: string;
    partner?: string;
    warehouses?: string[];
    products?: string[];
    partners?: string[];
  },
): Spec[] {
  const specs: Spec[] = [];
  for (let i = 0; i < options.count; i++) {
    specs.push({
      issue,
      warehouse: options.warehouse ?? options.warehouses?.[i] ?? "North Hub",
      product: options.product ?? options.products?.[i] ?? "Oak Chair",
      partner: options.partner ?? options.partners?.[i] ?? "SwiftHaul",
      region: REGIONS[i % REGIONS.length],
    });
  }
  return specs;
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
    orderedAt: addDays(week, index % 7),
    product: item.product,
    warehouse: item.warehouse,
    partner: item.partner,
    region: item.region,
  };
}

function makeComplaint(
  issue: string,
  order: Order | null,
  week: string,
  index: number,
  complaintNumber: number,
  channel: string,
): Complaint {
  const orderId = order?.orderId ?? "";
  return {
    id: `c${String(complaintNumber).padStart(4, "0")}`,
    text: complaintText(issue, orderId, complaintNumber),
    createdAt: addDays(week, index % 7),
    channel,
    orderId,
  };
}

function complaintText(issue: string, orderId: string, seed: number): string {
  const orderBit = orderId ? ` Order ${orderId}.` : "";
  const variants: Record<string, string[]> = {
    "late delivery": [
      `The delivery was late and the package was delayed.${orderBit}`,
      `Late delivery today. I am unhappy this shipment was delayed.${orderBit}`,
    ],
    "damaged item": [
      `The item arrived damaged and broken.${orderBit}`,
      `My package was damaged. The product is cracked.${orderBit}`,
    ],
    "wrong item": [
      `You sent the wrong item. This is not what I ordered.${orderBit}`,
      `This is the wrong item. I received an incorrect item.${orderBit}`,
    ],
    "refund delay": [
      `I am still waiting on my refund.${orderBit}`,
      `The refund has not arrived and I need the refund processed.${orderBit}`,
    ],
    "support experience": [
      `The support agent was rude and customer service did not help.${orderBit}`,
      `Customer service was rude when I asked for help.${orderBit}`,
    ],
  };
  const options = variants[issue];
  return options[seed % options.length].replace(/\s+/g, " ").trim();
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
