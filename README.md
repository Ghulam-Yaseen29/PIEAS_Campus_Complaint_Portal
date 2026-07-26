# 🛠️ CampusFix

**Report once. AI analyses, prioritises, and transforms your complaint into action..**

🔗 **Live app:** [https://campus-complain-portal.lovable.app/auth](https://campus-complain-portal.lovable.app/auth)

---

## a. What It Does & The Problem It Solves

CampusFix is a web app where students report campus issues — a broken fan, no Wi-Fi, a water leak, a dirty classroom — in plain language. An AI model automatically categorizes the complaint, assigns a priority, and rewrites vague descriptions into clear, actionable reports.

**The problem:** students have no single place to report campus issues — reports get lost in WhatsApp groups or told to the wrong person. Facilities staff have no way to tell an urgent safety issue apart from a minor one without reading every message manually.

**Who it's for:**
- **Students** — report and track issues in one place instead of a group chat.
- **Facilities/admin staff** — get a triaged, prioritized dashboard instead of unstructured complaints.

---

## b. Live App

👉 **[https://campus-complain-portal.lovable.app/auth](https://campus-complain-portal.lovable.app/auth)**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campusfix.app` | `admin123` |
| Student | `student@campusfix.app` | `student123` |

---

## c. Features

**Student**
- Sign up / log in
- Submit a complaint: title, description and location.
- See AI-generated category, priority, and improved description before final submit
- View complaint history with live status: Pending → In Progress → Resolved
- Open any complaint for full detail

**Admin**
- Dedicated dashboard showing all complaints from all students
- Stats overview: total, pending, high-priority open, resolved this week
- Filter by category, priority, status; sort by urgency or date
- View original text side-by-side with AI-improved version
- Update complaint status, timestamped

**Everywhere**
- Color-coded priority badges (🔴 High / 🟡 Medium / 🟢 Low)
- Fully responsive, mobile-first
- Toast confirmations on every action

---

## d. The AI Feature

Every complaint submission triggers a live call to Google Gemini (`gemini-2.5-flash`), run server-side through a Supabase Edge Function. The model does three jobs in one call:

1. **Categorizes** into: Electrical, Internet/Wi-Fi, Plumbing/Water, Cleanliness, Furniture, Security, Noise, Other
2. **Assigns priority** — High / Medium / Low — based on safety risk, people affected, and urgency
3. **Rewrites the description** into a clear, professional report — without inventing facts

The student sees the AI's read on their complaint before it's finalized. The admin sees both the original and improved versions side by side.

**System prompt used:**
You are an AI assistant embedded in a campus facilities complaint system called CampusFix.
Your job is to process a single student complaint and return ONLY a valid JSON object — no
markdown, no commentary, no code fences.

You will receive:

title: a short string the student typed
description: a free-text description of the problem, which may be vague, informal, or
contain spelling mistakes
location: the building/room the student provided (may be empty)

You must return a JSON object with exactly these fields:
{
"category": one of ["Electrical", "Internet/Wi-Fi", "Plumbing/Water", "Cleanliness",
"Furniture", "Security", "Noise", "Other"],
"priority": one of ["High", "Medium", "Low"],
"improved_description": a string,
"priority_reason": a short string (max 20 words) explaining the priority decision
}

Rules for CATEGORY:

Pick the single best-fit category. If genuinely ambiguous or none fit, use "Other".
Base the decision on both title and description together.

Rules for PRIORITY:

"High": safety hazards, electrical sparks/exposed wires, water leaks that could cause
flooding or electrical danger, broken locks/security issues, complete loss of critical
service (e.g. no internet during exam week, no water in a hostel), anything affecting
many people or posing injury risk.
"Medium": issues that affect comfort or usability but are not urgent or dangerous
(e.g. slow Wi-Fi, a wobbly desk, a flickering light, a dirty but usable room).
"Low": minor, cosmetic, or single-person inconvenience issues (e.g. small stain,
aesthetic complaint, non-blocking noise).
If unsure between two levels, choose the higher one when safety is even plausibly
implicated, and the lower one otherwise.

Rules for IMPROVED_DESCRIPTION:

Rewrite in clear, neutral, professional English suitable for a maintenance work order.
Keep it factual. NEVER invent details (exact times, names, causes) that weren't stated
or clearly implied by the student.
If the student's original description is very short or vague (e.g. "fan not working"),
expand it into a complete sentence using only what can reasonably be inferred, and note
the location if provided. Do not fabricate specifics.
Keep it to 1–3 sentences. No bullet points. No greetings, no "Dear Sir".

Rules for PRIORITY_REASON:

One short clause, e.g. "Exposed wiring poses shock risk" or "Cosmetic issue, no safety
impact".

Output ONLY the JSON object. Do not wrap it in markdown code fences. Do not add any text
before or after the JSON.
**Example:**

Input:
```json
{
  "title": "sparking wire near washbasin",
  "description": "theres a wire hanging near the washbasin in the girls washroom 2nd floor and it sparked once when someone touched the wall",
  "location": "Academic Block, 2nd Floor Washroom"
}
```

Output:
```json
{
  "category": "Electrical",
  "priority": "High",
  "improved_description": "An exposed electrical wire is hanging near the washbasin in the 2nd floor washroom of the Academic Block and has sparked upon contact with the wall, posing a serious shock hazard to users.",
  "priority_reason": "Exposed live wire near water poses shock risk"
}
```

**Fallback:** if the AI call fails, the complaint still saves with category "Other", priority "Medium", and the original description, flagged internally as not AI-processed.

---

## e. Tools, Services & AI Models Used

| Purpose | Tool |
|---|---|
| App scaffolding & UI | Lovable |
| AI complaint processing | Google Gemini API (`gemini-2.5-flash`) |
| Auth & database | Supabase (Auth + Postgres) |
| Server-side AI calls | Supabase Edge Functions |
| Hosting / deployment | Lovable publish (`*.lovable.app`) |
| Version control | Git + GitHub |
| Prompt engineering | Claude |

---

## f. Screenshots

**Login Page:**<img width="1282" height="648" alt="login page" src="https://github.com/user-attachments/assets/340879c3-81ba-4bbd-9c84-b1a18547020a" />

**Admin Dashboard:**<img width="1358" height="724" alt="Admin" src="https://github.com/user-attachments/assets/89e18cef-3356-4657-8d3b-7ea49aa0f295" />

**Student Dashboard:**<img width="1365" height="724" alt="student" src="https://github.com/user-attachments/assets/0b4dcfd4-440d-4fef-b3c6-feffd5e110b0" />

**AI Feature:**<img width="1291" height="708" alt="AI" src="https://github.com/user-attachments/assets/66df291d-5dee-4257-bd02-f2a1a4c940de" />


---

## g. How to Run Locally

```bash
git clone https://github.com/your-username/campusfix.git
cd campusfix
npm install
```

Create a `.env` file:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Add your Gemini key as a Supabase secret (Project Settings → Edge Functions → Secrets):
GEMINI_API_KEY=your_gemini_api_key
Run:
```bash
npm run dev
```

App runs at `http://localhost:5173`.

> Gemini API key is never committed or exposed client-side — it's read server-side via Supabase secrets.
