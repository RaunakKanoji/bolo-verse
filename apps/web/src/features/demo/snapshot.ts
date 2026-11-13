import snapshot from "@/lib/demo/snapshot.json";
import type { DemoDataset } from "@/lib/demo/dataset";
// The CLI exports only original fictional source data after validating its SQL rows.
export const demo = snapshot.dataset as unknown as DemoDataset;
export const demoCounts = snapshot.counts;
