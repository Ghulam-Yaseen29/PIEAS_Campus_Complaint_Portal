import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerFn } from "@tanstack/react-start";
import { getMyRole } from "@/lib/complaints.functions";
import { seedDemo } from "@/lib/seed.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · CampusFix" },
      { name: "description", content: "Sign in or create an account to report and track campus issues." },
      { property: "og:title", content: "Sign in · CampusFix" },
      { property: "og:description", content: "Access the CampusFix student and admin portals." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const roleFn = useServerFn(getMyRole);
  const runSeed = useServerFn(seedDemo);
  const [loading, setLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPass, setSignInPass] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPass, setSignUpPass] = useState("");

  useEffect(() => {
    runSeed().catch(() => {});
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const r = await roleFn().catch(() => ({ isAdmin: false }));
        navigate({ to: r.isAdmin ? "/admin" : "/dashboard" });
      }
    });
  }, [navigate, roleFn, runSeed]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPass,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const r = await roleFn().catch(() => ({ isAdmin: false }));
    toast.success("Welcome back!");
    navigate({ to: r.isAdmin ? "/admin" : "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPass,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signUpName },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Account created!");
    // Try immediate sign-in (auto-confirm may be enabled).
    const { error: siErr } = await supabase.auth.signInWithPassword({
      email: signUpEmail,
      password: signUpPass,
    });
    if (siErr) {
      toast.info("Check your email to confirm your account, then sign in.");
      setLoading(false);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const quickFill = (email: string, pass: string) => {
    setSignInEmail(email);
    setSignInPass(pass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-soft/60 via-background to-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">CampusFix</span>
        </Link>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6 space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="in-email">Email</Label>
                  <Input
                    id="in-email"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="you@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="in-pass">Password</Label>
                  <Input
                    id="in-pass"
                    type="password"
                    required
                    value={signInPass}
                    onChange={(e) => setSignInPass(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <div className="pt-2">
                <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Demo accounts
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickFill("admin@campusfix.app", "admin123")}
                  >
                    Admin: admin@campusfix.app
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickFill("student1@campusfix.app", "student123")}
                  >
                    Student: student1@campusfix.app
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="up-name">Full name</Label>
                  <Input
                    id="up-name"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="up-email">Email</Label>
                  <Input
                    id="up-email"
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="up-pass">Password</Label>
                  <Input
                    id="up-pass"
                    type="password"
                    minLength={6}
                    required
                    value={signUpPass}
                    onChange={(e) => setSignUpPass(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create student account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
