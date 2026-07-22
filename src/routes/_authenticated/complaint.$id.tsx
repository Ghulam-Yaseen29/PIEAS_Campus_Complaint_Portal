import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MapPin, Clock, User } from "lucide-react";
import { toast } from "sonner";
import {
  getComplaint,
  updateComplaintStatus,
  getMyRole,
  type ComplaintRow,
} from "@/lib/complaints.functions";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/PriorityBadge";
import { format } from "date-fns";
import type { Status } from "@/lib/priority";

export const Route = createFileRoute("/_authenticated/complaint/$id")({
  head: () => ({
    meta: [
      { title: "Complaint details · CampusFix" },
      { name: "description", content: "View the AI-processed complaint and its current status." },
    ],
  }),
  component: ComplaintDetail,
});

const STATUSES: Status[] = ["Pending", "In Progress", "Resolved"];

function ComplaintDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getComplaint);
  const updateFn = useServerFn(updateComplaintStatus);
  const roleFn = useServerFn(getMyRole);
  const navigate = useNavigate();

  const [c, setC] = useState<ComplaintRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getFn({ data: { id } })
      .then(setC)
      .catch((e) => {
        toast.error((e as Error).message);
        navigate({ to: "/dashboard" });
      });
  };

  useEffect(() => {
    roleFn().then((r) => setIsAdmin(r.isAdmin));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setStatus = async (status: Status) => {
    setSaving(true);
    try {
      await updateFn({ data: { id, status } });
      toast.success(`Marked as ${status}`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader isAdmin={isAdmin} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to={isAdmin ? "/admin" : "/dashboard"}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {!c ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={c.ai_priority} />
                    <CategoryBadge category={c.ai_category} />
                    <StatusBadge status={c.status} />
                  </div>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h1>
                </div>
              </div>

              <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                {c.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {c.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {format(new Date(c.created_at), "PPp")}
                </span>
                {isAdmin && c.student && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {c.student.full_name || c.student.email}
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    AI-improved description
                  </h3>
                  <p className="mt-1.5 rounded-lg bg-primary/5 p-4 leading-relaxed">
                    {c.ai_improved_description || c.description}
                  </p>
                  {c.ai_priority_reason && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Priority reason:</span>{" "}
                      {c.ai_priority_reason}
                    </p>
                  )}
                </section>
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Original submission
                  </h3>
                  <p className="mt-1.5 rounded-lg border border-dashed border-border p-4 text-muted-foreground">
                    {c.description}
                  </p>
                </section>
              </div>
            </div>

            {isAdmin && (
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-sm font-semibold">Update status</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      variant={c.status === s ? "default" : "outline"}
                      size="sm"
                      disabled={saving || c.status === s}
                      onClick={() => setStatus(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
