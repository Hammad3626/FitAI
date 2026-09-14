import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const fitnessContextSchema = z
  .object({
    displayName: z.string().max(100).optional(),
    goal: z.string().max(500).optional(),
    weeklyTarget: z.number().int().min(0).max(20).optional(),
    workoutsThisWeek: z.number().int().min(0).max(50).optional(),
    waterCups: z.number().int().min(0).max(30).optional(),
    savedWorkouts: z.array(z.string().max(200)).max(50).optional(),
  })
  .optional();

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  fitnessContext: fitnessContextSchema,
});

const BASE_PROMPT = `You are FitAI, a friendly, evidence-based AI fitness coach inside an AI fitness guidance platform.

RESPONSE FORMAT — ALWAYS follow these rules so answers are scannable, not paragraph blobs:
- NEVER answer with a wall of prose. Default to short bullets, headings, or tables.
- Open with ONE short sentence (max 15 words) summarizing the answer.
- Then break content into clearly labeled markdown sections using \`###\` headings (e.g. \`### Plan\`, \`### Why\`, \`### Tips\`, \`### Safety\`).
- Bullets must be ONE line each, max ~12 words. Bold the key term, then a short explanation. Example: \`- **Protein:** 1.6 g per kg body weight\`.
- Use tables (\`| col | col |\`) for any list with 2+ attributes per item (sets/reps, meals/macros, weekly schedule).
- Numbers, units, and durations get bolded.
- End with a one-line "**Next step:**" telling the user exactly what to do next.
- Keep total length tight — answer the question, no filler, no recap of the question.
- Always include a quick safety note when recommending intense exercise or restrictive diets.
- If a user mentions a medical condition, recommend consulting a professional.
- Tone: motivating, expert, never preachy. No emojis.

WORKOUT GENERATION PROTOCOL — when a user asks for a workout, routine, plan, schedule, or anything that implies "build me something to do":
1. If you are missing ANY critical input (experience level, available equipment, days/week, time per session, injuries, or specific goal), ask 1–3 short clarifying questions FIRST in a single message — do not generate a generic plan blindly.
2. Once you have enough context (or the user says "just give me one"), produce a fully custom routine tailored to THEIR situation, equipment, and time budget. Never paste a stock template.
3. Format every generated routine with this exact markdown structure:
   ### Routine Name
   **Goal:** ... · **Level:** ... · **Duration:** ... min · **Equipment:** ...
   **Warm-up (5 min)**
   - exercise — sets x reps / time
   **Main sets**
   | Exercise | Sets | Reps | Rest |
   |---|---|---|---|
   | ... | ... | ... | ... |
   **Cool-down**
   - ...
   **Coach notes:** progression, form cues, swaps, and a safety reminder.
4. For weekly schedules, return a Mon–Sun table with the focus + a one-line session summary per day, then offer to expand any single day into the full routine format above.
5. Always reference the user's saved goal and weekly progress when relevant. Adapt intensity if they're behind/ahead of target.
6. Diet requests follow the same rule: ask for calories/dietary restrictions if missing, then return a structured day-plan (meals + macros) tailored to their goal.`;

function buildSystemPrompt(ctx: z.infer<typeof fitnessContextSchema>) {
  if (!ctx) {
    return `${BASE_PROMPT}\n\nThe user is not signed in. Encourage them to sign in to get personalized recommendations tied to their goal and saved routines.`;
  }
  const lines: string[] = [
    "",
    "USER PROFILE — tailor every recommendation to this person:",
  ];
  if (ctx.displayName) lines.push(`- Name: ${ctx.displayName}`);
  if (ctx.goal) lines.push(`- Primary fitness goal: "${ctx.goal}"`);
  if (typeof ctx.weeklyTarget === "number")
    lines.push(`- Weekly workout target: ${ctx.weeklyTarget} sessions`);
  if (typeof ctx.workoutsThisWeek === "number")
    lines.push(`- Workouts completed this week: ${ctx.workoutsThisWeek}`);
  if (typeof ctx.waterCups === "number")
    lines.push(`- Water intake today: ${ctx.waterCups} cups (target 8)`);
  if (ctx.savedWorkouts && ctx.savedWorkouts.length > 0)
    lines.push(`- Saved routines: ${ctx.savedWorkouts.join(", ")}`);
  lines.push(
    "",
    "Personalization rules:",
    "- Reference their goal directly when giving workout or diet advice.",
    "- Suggest adjustments based on weekly progress (behind, on-track, or ahead).",
    "- Build on their saved routines when possible instead of suggesting unrelated programs.",
    "- If hydration is low, gently nudge them.",
    "- Keep diet suggestions aligned with the goal (cut/maintain/bulk).",
  );
  return BASE_PROMPT + "\n" + lines.join("\n");
}

function getAiConfig() {
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_COACH_API_KEY;
  if (openaiApiKey) {
    return {
      apiKey: openaiApiKey,
      endpoint: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  if (lovableApiKey) {
    return {
      apiKey: lovableApiKey,
      endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
      model: "google/gemini-3-flash-preview",
    };
  }
  return null;
}

export const chatWithCoach = createServerFn({ method: "POST" })
  .validator((data: unknown) => messageSchema.parse(data))
  .handler(async ({ data }) => {
    const aiConfig = getAiConfig();
    if (!aiConfig) {
      return {
        reply:
          "The AI coach isn't configured yet. (Missing OPENAI_API_KEY.) In the meantime, here's a quick tip: aim for 3 strength sessions and 8,000+ steps per day this week.",
      };
    }

    const systemPrompt = buildSystemPrompt(data.fitnessContext);

    try {
      const res = await fetch(aiConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as {
          error?: { message?: string; code?: string; type?: string };
        } | null;
        console.error("AI gateway error", res.status, errorData);
        if (res.status === 429) {
          if (
            errorData?.error?.code === "credit_balance_exhausted" ||
            errorData?.error?.type === "insufficient_quota"
          ) {
            return {
              reply:
                "OpenAI quota exhausted: Please check your billing or add credits at platform.openai.com.",
            };
          }
          return { reply: "Rate limit reached — please try again in a moment." };
        }
        if (res.status === 402) {
          return { reply: "AI credits exhausted. Add credits in your AI provider settings." };
        }
        if (errorData?.error?.message) {
          return { reply: `AI Coach: ${errorData.error.message}` };
        }
        return { reply: "Sorry, the AI coach is unavailable right now. Try again shortly." };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply =
        json.choices?.[0]?.message?.content ??
        "Hmm, I didn't get a response. Could you rephrase?";
      return { reply };
    } catch (error) {
      console.error("chatWithCoach failed", error);
      return { reply: "Network error reaching the AI coach. Please try again." };
    }
  });

const routineSpecSchema = z.object({
  goal: z.string().max(120).optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  equipment: z.string().max(200).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  timeMin: z.number().int().min(5).max(240).optional(),
  focus: z.string().max(200).optional(),
  injuries: z.string().max(300).optional(),
  intensity: z.enum(["Easy", "Moderate", "Hard"]).optional(),
  style: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const generateCustomRoutine = createServerFn({ method: "POST" })
  .validator((data: unknown) => routineSpecSchema.parse(data))
  .handler(async ({ data }) => {
    const aiConfig = getAiConfig();
    if (!aiConfig) {
      return { title: "Sample Routine", content: "AI not configured. Add OPENAI_API_KEY." };
    }
    const lines: string[] = [];
    if (data.goal) lines.push(`- Goal: ${data.goal}`);
    if (data.level) lines.push(`- Level: ${data.level}`);
    if (data.equipment) lines.push(`- Equipment: ${data.equipment}`);
    if (data.daysPerWeek) lines.push(`- Days/week: ${data.daysPerWeek}`);
    if (data.timeMin) lines.push(`- Time per session: ${data.timeMin} min`);
    if (data.focus) lines.push(`- Focus: ${data.focus}`);
    if (data.injuries) lines.push(`- Injuries / limits: ${data.injuries}`);
    if (data.intensity) lines.push(`- Intensity: ${data.intensity}`);
    if (data.style) lines.push(`- Style: ${data.style}`);
    if (data.notes) lines.push(`- Notes: ${data.notes}`);

    const sys = `${BASE_PROMPT}

You are generating a brand-new, fully personalized workout routine. DO NOT reuse or reference any preset/template routine. Build from scratch using the user's specs.

REQUIRED OUTPUT FORMAT (markdown, nothing else):
### {Catchy routine title}
**Goal:** ... · **Level:** ... · **Duration:** ... min · **Equipment:** ...

**Warm-up (5 min)**
- exercise — sets x reps / time

**Main sets**
| Exercise | Sets | Reps | Rest |
|---|---|---|---|
| ... | ... | ... | ... |

**Cool-down**
- ...

**Coach notes:** progression cues, form, swaps, safety.

The first line MUST be the \`### Title\` heading. Keep it tight and scannable.`;

    const userMsg = `Build a custom routine using these specs:\n${lines.join("\n") || "- (no specs given, build a balanced full-body session)"}`;

    try {
      const res = await fetch(aiConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiConfig.apiKey}` },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userMsg },
          ],
        }),
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as {
          error?: { message?: string; code?: string; type?: string };
        } | null;
        if (res.status === 429) {
          if (
            errorData?.error?.code === "credit_balance_exhausted" ||
            errorData?.error?.type === "insufficient_quota"
          ) {
            return {
              title: "Quota Exhausted",
              content:
                "OpenAI quota exhausted: Please check your billing or add credits at platform.openai.com.",
            };
          }
          return { title: "", content: "Rate limit reached — try again shortly." };
        }
        if (res.status === 402) return { title: "", content: "AI credits exhausted." };
        if (errorData?.error?.message) {
          return { title: "Error", content: errorData.error.message };
        }
        return { title: "", content: "AI coach unavailable right now." };
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content ?? "Could not generate routine.";
      const titleMatch = content.match(/^###\s+(.+)$/m);
      const title = titleMatch?.[1]?.trim().slice(0, 120) || "Custom Routine";
      return { title, content };
    } catch (e) {
      console.error("generateCustomRoutine failed", e);
      return { title: "", content: "Network error. Try again." };
    }
  });
