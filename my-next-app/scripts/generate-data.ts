import { generateDataset } from "../lib/generate";
import { writeDataset } from "../lib/store";

const { complaints, orders } = generateDataset();
writeDataset(complaints, orders);
console.log(`Wrote ${complaints.length} complaints and ${orders.length} orders.`);
