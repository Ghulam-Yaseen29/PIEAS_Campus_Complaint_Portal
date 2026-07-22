import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "admin@campusfix.app";
const ADMIN_PASSWORD = "admin123";
const STUDENT1 = { email: "student1@campusfix.app", password: "student123", name: "Ayesha Khan" };
const STUDENT2 = { email: "student2@campusfix.app", password: "student123", name: "Rahul Verma" };

const DEMO_COMPLAINTS = [
  {
    title: "Sparking wire near washbasin",
    description:
      "theres a wire hanging near the washbasin in the girls washroom 2nd floor and it sparked once when someone touched the wall",
    location: "Academic Block, 2nd Floor Washroom",
    ai_category: "Electrical",
    ai_priority: "High",
    ai_improved_description:
      "An exposed electrical wire is hanging near the washbasin in the 2nd floor washroom of the Academic Block and has sparked upon contact with the wall, posing a serious shock hazard to users.",
    ai_priority_reason: "Exposed live wire near water poses shock risk",
    status: "Pending",
    studentIdx: 0,
  },
  {
    title: "Fan not working",
    description: "the fan in our room is not working since 2 days its so hot we cant study",
    location: "Hostel Block B, Room 214",
    ai_category: "Electrical",
    ai_priority: "Medium",
    ai_improved_description:
      "The ceiling fan in Hostel Block B, Room 214 has been non-functional for two days, making the room uncomfortably hot for studying. Requesting inspection and repair.",
    ai_priority_reason: "Affects comfort, not a safety hazard",
    status: "In Progress",
    studentIdx: 0,
  },
  {
    title: "Wi-Fi extremely slow in library",
    description: "wifi in the library is so slow cant even open google scholar exams next week",
    location: "Central Library, 3rd Floor",
    ai_category: "Internet/Wi-Fi",
    ai_priority: "High",
    ai_improved_description:
      "Wi-Fi connectivity on the 3rd floor of the Central Library is extremely slow, preventing students from accessing academic resources ahead of upcoming examinations.",
    ai_priority_reason: "Impacts many students during exam week",
    status: "Pending",
    studentIdx: 1,
  },
  {
    title: "Water leaking from ceiling",
    description: "water dripping from ceiling in classroom 305 floor is wet risk of slipping",
    location: "Academic Block, Room 305",
    ai_category: "Plumbing/Water",
    ai_priority: "High",
    ai_improved_description:
      "Water is leaking from the ceiling in Academic Block Room 305, causing a wet floor and slipping hazard for students and staff.",
    ai_priority_reason: "Wet floor is a slip and safety hazard",
    status: "In Progress",
    studentIdx: 1,
  },
  {
    title: "Classroom dirty",
    description: "the classroom 201 wasnt cleaned yesterday, dust and papers everywhere",
    location: "Academic Block, Room 201",
    ai_category: "Cleanliness",
    ai_priority: "Low",
    ai_improved_description:
      "Classroom 201 in the Academic Block was not cleaned during the previous cleaning cycle, leaving dust and litter throughout the room.",
    ai_priority_reason: "Cosmetic issue, no safety impact",
    status: "Resolved",
    studentIdx: 0,
  },
  {
    title: "Broken chair in lab",
    description: "one of the chairs in the computer lab is wobbly and the leg is cracked",
    location: "CS Lab 2",
    ai_category: "Furniture",
    ai_priority: "Medium",
    ai_improved_description:
      "A chair in CS Lab 2 has a cracked leg and is unstable when used. It should be replaced or repaired to prevent injury.",
    ai_priority_reason: "Broken chair could cause a fall",
    status: "Pending",
    studentIdx: 1,
  },
];

export const seedDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check idempotency — if there are already complaints, skip.
  const { count } = await supabaseAdmin
    .from("complaints")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return { seeded: false, reason: "already seeded" };
  }

  const ensureUser = async (email: string, password: string, name: string) => {
    // Try to find existing user
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const existing = list?.users?.find((u) => u.email === email);
    if (existing) {
      // Ensure profile + role exist
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: existing.id, full_name: name, email });
      return existing.id;
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    return data.user.id;
  };

  const adminId = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD, "Facilities Admin");
  const s1Id = await ensureUser(STUDENT1.email, STUDENT1.password, STUDENT1.name);
  const s2Id = await ensureUser(STUDENT2.email, STUDENT2.password, STUDENT2.name);

  // Promote admin
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: adminId, role: "admin" }, { onConflict: "user_id,role" });
  // Remove student role from admin so admin sees admin dashboard only
  await supabaseAdmin.from("user_roles").delete().eq("user_id", adminId).eq("role", "student");

  const students = [s1Id, s2Id];
  const rows = DEMO_COMPLAINTS.map((c) => ({
    student_id: students[c.studentIdx],
    title: c.title,
    description: c.description,
    location: c.location,
    ai_category: c.ai_category,
    ai_priority: c.ai_priority,
    ai_improved_description: c.ai_improved_description,
    ai_priority_reason: c.ai_priority_reason,
    ai_processed: true,
    status: c.status,
  }));
  const { error: insErr } = await supabaseAdmin.from("complaints").insert(rows);
  if (insErr) throw new Error(insErr.message);

  return { seeded: true, users: 3, complaints: rows.length };
});
