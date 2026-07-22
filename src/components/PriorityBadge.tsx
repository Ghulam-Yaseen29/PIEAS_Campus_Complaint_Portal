import { PRIORITY_STYLES, STATUS_STYLES, type Priority, type Status } from "@/lib/priority";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          priority === "High" && "bg-danger",
          priority === "Medium" && "bg-warning",
          priority === "Low" && "bg-success",
        )}
      />
      {priority}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {category}
    </span>
  );
}
