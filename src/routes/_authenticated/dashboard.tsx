import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Inbox } from "lucide-react";
import { listMyComplaints, getMyRole, type ComplaintRow } from "@/lib/complaints.functions";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/PriorityBadge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Complaints · CampusFix" },
      { name: "description", content: "Track your submitted campus complaints and their status." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const listFn = useServerFn(listMyComplaints);
  const roleFn = useServerFn(getMyRole);
  const navigate = useNavigate();
  const [rows, setRows] = useState<ComplaintRow[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await roleFn().catch(() => ({ isAdmin: false }));
      if (r.isAdmin) {
        navigate({ to: "/admin" });
        return;
      }
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      const list = await listFn();
      setRows(list);
    })();
  }, [listFn, roleFn, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={email} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Complaints</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track everything you've reported and see the AI's classification.
            </p>
          </div>
          <Link to="/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" /> New complaint
            </Button>
          </Link>
        </div>

        {rows === null ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-base font-semibold">No complaints yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reported an issue? Log it here and we'll route it to facilities.
            </p>
            <Link to="/new">
              <Button className="mt-5 gap-2">
                <Plus className="h-4 w-4" /> Submit your first complaint
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((c) => (
              <Link
                key={c.id}
                to="/complaint/$id"
                params={{ id: c.id }}
                className="group rounded-xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] transition hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold">{c.title}</h3>
                      <PriorityBadge priority={c.ai_priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {c.ai_improved_description || c.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <CategoryBadge category={c.ai_category} />
                      {c.location && <span>· {c.location}</span>}
                      <span>· {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
