import { Link, useNavigate } from "@tanstack/react-router";
import { Wrench, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppHeader({
  email,
  isAdmin,
}: {
  email?: string | null;
  isAdmin?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">CampusFix</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {isAdmin ? "Admin console" : "Student portal"}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
