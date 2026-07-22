import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Send, RefreshCw } from "lucide-react";
import { analyzeComplaint, type AiResult } from "@/lib/ai.functions";
import { createComplaint } from "@/lib/complaints.functions";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriorityBadge, CategoryBadge } from "@/components/PriorityBadge";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "New Complaint · CampusFix" },
      { name: "description", content: "Submit a new campus issue. AI will categorize and prioritize it before you confirm." },
    ],
  }),
  component: NewComplaint,
});

type Step = "form" | "review";

function NewComplaint() {
  const analyze = useServerFn(analyzeComplaint);
  const create = useServerFn(createComplaint);
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<AiResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return toast.error("Title must be at least 3 characters.");
    if (description.trim().length < 10)
      return toast.error("Description must be at least 10 characters.");
    setLoading(true);
    try {
      const result = await analyze({ data: { title, description, location } });
      setAi(result);
      setStep("review");
      if (!result.ai_processed) {
        toast.warning("AI unavailable — using safe defaults. You can still submit.");
      }
    } catch (err) {
      toast.error((err as Error).message || "AI failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!ai) return;
    setLoading(true);
    try {
      const row = await create({
        data: {
          title,
          description,
          location,
          ai_category: ai.category,
          ai_priority: ai.priority,
          ai_improved_description: ai.improved_description,
          ai_priority_reason: ai.priority_reason,
          ai_processed: ai.ai_processed,
        },
      });
      toast.success("Complaint submitted!");
      navigate({ to: "/complaint/$id", params: { id: row.id } });
    } catch (err) {
      toast.error((err as Error).message || "Failed to submit.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to my complaints
        </Link>

        {step === "form" && (
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Report an issue</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe it however feels natural. Our AI will clean it up before you submit.
            </p>

            <form onSubmit={handleAnalyze} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  minLength={3}
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fan not working"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">What's going on?</Label>
                <Textarea
                  id="desc"
                  required
                  minLength={10}
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem in your own words…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <Input
                  id="loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Building / room, e.g. Hostel Block B, Room 214"
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                <Sparkles className="h-4 w-4" />
                {loading ? "Analyzing…" : "Analyze with AI"}
              </Button>
            </form>
          </div>
        )}

        {step === "review" && ai && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Here's how we classified your report
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={ai.priority} />
                <CategoryBadge category={ai.category} />
              </div>
              {ai.priority_reason && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Why:</span> {ai.priority_reason}
                </p>
              )}

              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Improved description
                  </div>
                  <p className="mt-1 rounded-lg bg-card p-3 leading-relaxed">
                    {ai.improved_description}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your original words
                  </div>
                  <p className="mt-1 rounded-lg border border-dashed border-border p-3 text-muted-foreground">
                    {description}
                  </p>
                </div>
                {location && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Location:</span> {location}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Edit & re-analyze
              </Button>
              <Button onClick={handleConfirm} disabled={loading} className="flex-1 gap-2">
                <Send className="h-4 w-4" />
                {loading ? "Submitting…" : "Confirm & submit"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
