import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  location: z.string().max(300).optional().default(""),
});

const CATEGORIES = [
  "Electrical",
  "Internet/Wi-Fi",
  "Plumbing/Water",
  "Cleanliness",
  "Furniture",
  "Security",
  "Noise",
  "Other",
] as const;
const PRIORITIES = ["High", "Medium", "Low"] as const;

export type AiResult = {
  category: (typeof CATEGORIES)[number];
  priority: (typeof PRIORITIES)[number];
  improved_description: string;
  priority_reason: string;
  ai_processed: boolean;
};

const SYSTEM_PROMPT = `You are an AI assistant embedded in a campus facilities complaint system called CampusFix.
Your job is to process a single student complaint and return ONLY a valid JSON object — no
markdown, no commentary, no code fences.

You will receive:
- title: a short string the student typed
- description: a free-text description of the problem, which may be vague, informal, or
  contain spelling mistakes
- location: the building/room the student provided (may be empty)

You must return a JSON object with exactly these fields:
{
  "category": one of ["Electrical", "Internet/Wi-Fi", "Plumbing/Water", "Cleanliness",
                       "Furniture", "Security", "Noise", "Other"],
  "priority": one of ["High", "Medium", "Low"],
  "improved_description": a string,
  "priority_reason": a short string (max 20 words) explaining the priority decision
}

Rules for CATEGORY:
- Pick the single best-fit category. If genuinely ambiguous or none fit, use "Other".
- Base the decision on both title and description together.

Rules for PRIORITY:
- "High": safety hazards, electrical sparks/exposed wires, water leaks that could cause
  flooding or electrical danger, broken locks/security issues, complete loss of critical
  service (e.g. no internet during exam week, no water in a hostel), anything affecting
  many people or posing injury risk.
- "Medium": issues that affect comfort or usability but are not urgent or dangerous
  (e.g. slow Wi-Fi, a wobbly desk, a flickering light, a dirty but usable room).
- "Low": minor, cosmetic, or single-person inconvenience issues (e.g. small stain,
  aesthetic complaint, non-blocking noise).
- If unsure between two levels, choose the higher one when safety is even plausibly
  implicated, and the lower one otherwise.

Rules for IMPROVED_DESCRIPTION:
- Rewrite in clear, neutral, professional English suitable for a maintenance work order.
- Keep it factual. NEVER invent details (exact times, names, causes) that weren't stated
  or clearly implied by the student.
- If the student's original description is very short or vague (e.g. "fan not working"),
  expand it into a complete sentence using only what can reasonably be inferred, and note
  the location if provided. Do not fabricate specifics.
- Keep it to 1–3 sentences. No bullet points. No greetings, no "Dear Sir".

Rules for PRIORITY_REASON:
- One short clause, e.g. "Exposed wiring poses shock risk" or "Cosmetic issue, no safety
  impact".

Output ONLY the JSON object. Do not wrap it in markdown code fences. Do not add any text
before or after the JSON.`;

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function fallback(desc: string): AiResult {
  return {
    category: "Other",
    priority: "Medium",
    improved_description: desc,
    priority_reason: "AI unavailable, defaulted",
    ai_processed: false,
  };
}

export const analyzeComplaint = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<AiResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return fallback(data.description);

    const userMsg = JSON.stringify({
      title: data.title,
      description: data.description,
      location: data.location ?? "",
    });

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[ai] gateway ${res.status}: ${body}`);
        return fallback(data.description);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(stripFences(content));

      const category = CATEGORIES.includes(parsed.category) ? parsed.category : "Other";
      const priority = PRIORITIES.includes(parsed.priority) ? parsed.priority : "Medium";

      return {
        category,
        priority,
        improved_description:
          typeof parsed.improved_description === "string" && parsed.improved_description.trim()
            ? parsed.improved_description.trim()
            : data.description,
        priority_reason:
          typeof parsed.priority_reason === "string" ? parsed.priority_reason.trim() : "",
        ai_processed: true,
      };
    } catch (err) {
      console.error("[ai] error", err);
      return fallback(data.description);
    }
  });
