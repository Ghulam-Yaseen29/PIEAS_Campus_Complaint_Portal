import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateInput = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(4000),
  location: z.string().max(300).default(""),
  ai_category: z.string(),
  ai_priority: z.enum(["High", "Medium", "Low"]),
  ai_improved_description: z.string(),
  ai_priority_reason: z.string(),
  ai_processed: z.boolean().default(true),
});

export type ComplaintRow = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  location: string;
  photo_url: string | null;
  ai_category: string;
  ai_priority: "High" | "Medium" | "Low";
  ai_improved_description: string;
  ai_priority_reason: string;
  ai_processed: boolean;
  status: "Pending" | "In Progress" | "Resolved";
  created_at: string;
  updated_at: string;
  student?: { full_name: string; email: string } | null;
};

export const createComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("complaints")
      .insert({
        student_id: userId,
        title: data.title,
        description: data.description,
        location: data.location,
        ai_category: data.ai_category,
        ai_priority: data.ai_priority,
        ai_improved_description: data.ai_improved_description,
        ai_priority_reason: data.ai_priority_reason,
        ai_processed: data.ai_processed,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as ComplaintRow;
  });

export const listMyComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ComplaintRow[];
  });

export const listAllComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Verify admin
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Fetch student profiles
    const studentIds = Array.from(new Set((data ?? []).map((c) => c.student_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (data ?? []).map((c) => ({
      ...c,
      student: map.get(c.student_id) ?? null,
    })) as ComplaintRow[];
  });

export const getComplaint = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", row.student_id)
      .maybeSingle();
    return { ...row, student: profile ?? null } as ComplaintRow;
  });

export const updateComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["Pending", "In Progress", "Resolved"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { error } = await supabase
      .from("complaints")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    return { isAdmin: roles.includes("admin"), roles };
  });
