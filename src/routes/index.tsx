import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wrench, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { seedDemo } from "@/lib/seed.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusFix — Report campus issues, get them fixed faster" },
      {
        name: "description",
        content:
          "CampusFix lets students report campus infrastructure issues in plain language. AI classifies, prioritizes, and rewrites reports so facilities staff can act faster.",
      },
      { property: "og:title", content: "CampusFix — Report campus issues, get them fixed faster" },
      {
        property: "og:description",
        content: "CampusFix lets students report campus infrastructure issues in plain language. AI classifies, prioritizes, and rewrites reports so facilities staff can act faster.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const runSeed = useServerFn(seedDemo);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    // Idempotent seed on first visit (fire-and-forget).
    runSeed().catch(() => {});
  }, [runSeed]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary-soft/40 to-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">CampusFix</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="pt-16 pb-24 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> AI-triaged campus reports
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Report campus issues in plain English.
              <span className="text-primary"> Get them fixed faster.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Broken fan, no Wi-Fi, water leak? Type it how you'd tell a friend. CampusFix
              categorizes, prioritizes, and cleans up your report so facilities staff can act
              immediately.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                <Button size="lg" className="gap-2">
                  {signedIn ? "Open dashboard" : "Get started"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Admin sign in
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Demo: <code className="rounded bg-muted px-1.5 py-0.5">admin@campusfix.app</code> /{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">admin123</code>
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "AI categorization",
                body: "Every report is classified into Electrical, Wi-Fi, Plumbing, Cleanliness, Furniture, Security, Noise or Other.",
              },
              {
                icon: ShieldCheck,
                title: "Smart prioritization",
                body: "High-risk issues like exposed wiring or leaks are flagged before cosmetic complaints.",
              },
              {
                icon: Wrench,
                title: "Clear work orders",
                body: "Vague messages are rewritten into 1-3 sentence work orders your facilities team can act on.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        CampusFix · University final project
      </footer>
    </div>
  );
}
