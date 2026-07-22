export type Priority = "High" | "Medium" | "Low";
export type Status = "Pending" | "In Progress" | "Resolved";

export const PRIORITY_STYLES: Record<Priority, string> = {
  High: "bg-danger/10 text-danger border-danger/30",
  Medium: "bg-warning/15 text-warning-foreground border-warning/40",
  Low: "bg-success/10 text-success border-success/30",
};

export const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-primary/10 text-primary border-primary/30",
  Resolved: "bg-success/10 text-success border-success/30",
};

export const CATEGORIES = [
  "Electrical",
  "Internet/Wi-Fi",
  "Plumbing/Water",
  "Cleanliness",
  "Furniture",
  "Security",
  "Noise",
  "Other",
] as const;
