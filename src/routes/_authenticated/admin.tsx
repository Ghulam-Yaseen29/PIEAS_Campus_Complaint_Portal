import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { listAllComplaints, getMyRole, type ComplaintRow } from "@/lib/complaints.functions";
import { AppHeader } from "@/components/AppHeader";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/PriorityBadge";
import { CATEGORIES, type Priority, type Status } from "@/lib/priority";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard · CampusFix" },
      { name: "description", content: "Facilities admin view of every campus complaint, sorted by AI priority." },
    ],
  }),
  component: AdminDashboard,
});

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

function AdminDashboard() {
  const listFn = useServerFn(listAllComplaints);
  const roleFn = useServerFn(getMyRole);
  const navigate = useNavigate();

  const [rows, setRows] = useState<ComplaintRow[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [fCat, setFCat] = useState<string>("all");
  const [fPri, setFPri] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [sort, setSort] = useState<"priority" | "date">("priority");

  useEffect(() => {
    (async () => {
      const r = await roleFn().catch(() => ({ isAdmin: false }));
      if (!r.isAdmin) {
        navigate({ to: "/dashboard" });
        return;
      }
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      const list = await listFn();
      setRows(list);
    })();
  }, [listFn, roleFn, navigate]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let out = rows;
    if (fCat !== "all") out = out.filter((r) => r.ai_category === fCat);
    if (fPri !== "all") out = out.filter((r) => r.ai_priority === fPri);
    if (fStatus !== "all") out = out.filter((r) => r.status === fStatus);
    out = [...out].sort((a, b) => {
      if (sort === "priority") {
        const d = PRIORITY_ORDER[a.ai_priority] - PRIORITY_ORDER[b.ai_priority];
        if (d !== 0) return d;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return out;
  }, [rows, fCat, fPri, fStatus, sort]);

  const stats = useMemo(() => {
    if (!rows) return { total: 0, pending: 0, highOpen: 0, resolvedWeek: 0 };
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === "Pending").length,
      highOpen: rows.filter((r) => r.ai_priority === "High" && r.status !== "Resolved").length,
      resolvedWeek: rows.filter(
        (r) => r.status === "Resolved" && new Date(r.updated_at).getTime() >= weekAgo,
      ).length,
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={email} isAdmin />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Facilities dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All complaints, AI-triaged and sorted by priority.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ListChecks} label="Total complaints" value={stats.total} tone="primary" />
          <StatCard icon={Clock3} label="Pending" value={stats.pending} tone="warning" />
          <StatCard
            icon={AlertTriangle}
            label="High priority open"
            value={stats.highOpen}
            tone="danger"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resolved this week"
            value={stats.resolvedWeek}
            tone="success"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Select value={fCat} onValueChange={setFCat}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fPri} onValueChange={setFPri}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as "priority" | "date")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="date">Sort: Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {rows === null ? (
          <div className="grid gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            No complaints match these filters.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((c) => (
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
                      <StatusBadge status={c.status as Status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {c.ai_improved_description || c.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <CategoryBadge category={c.ai_category} />
                      {c.location && <span>· {c.location}</span>}
                      {c.student && (
                        <span>· by {c.student.full_name || c.student.email}</span>
                      )}
                      <span>
                        · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "primary" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
