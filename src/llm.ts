import { z } from "zod";
import type { ProfileData } from "./github.js";
import type { Timeline } from "./render.js";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");

const MODEL = process.env.LLM_MODEL || "deepseek/deepseek-v4-pro";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const TimelineSchema = z.object({
  summary: z.string(),
  periods: z.array(
    z.object({
      period: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          repo: z.string().optional(),
          description: z.string(),
        }),
      ),
    }),
  ),
});

const SYSTEM = `You are a writing assistant that produces a concise CV-style activity timeline for a software engineer based on their public GitHub commits and repository descriptions.

Goal: produce milestones, not a commit log. Group related commits within a repo into one item summarised in plain language. Examples of correct granularity:
- "Built out the chat UI with Markdown rendering and tool-call safety rails" (good — summarises a cluster of related commits)
- "Fixed typo in README; bumped version 0.7.5; bumped version 0.7.6" (bad — too granular, just lists commits)

Rules:
- 4-7 periods, each grouping a meaningful chunk of time (e.g. "2026 Apr–May", "2026 Q1", "Late 2025"). Order reverse-chronologically.
- 1-3 items per period. Each item is one milestone — typically focused on one repo, summarising a cluster of related work.
- Stay grounded. Do NOT invent technologies, frameworks, integrations, or accomplishments not visible in commit messages or repo descriptions.
- Use the repo's actual nameWithOwner in the "repo" field when an item is about one repo.
- Be specific where data supports it (concrete repo, concrete tech, what shipped). Be general only where data is thin.
- Avoid corporate puffery ("delivered impactful results"). Plain, direct language.
- Title: 3-7 words. Description: 1-2 sentences.
- Summary at top: 2 sentences max, big-picture themes.

You MUST respond with a single JSON object. Output ONLY the JSON, no markdown fences, no commentary. Schema:

{
  "summary": "string",
  "periods": [
    {
      "period": "string (e.g. '2026 Apr–May')",
      "items": [
        {
          "title": "string",
          "repo": "string (optional, owner/name)",
          "description": "string"
        }
      ]
    }
  ]
}`;

function formatPayload(p: ProfileData): string {
  const lines: string[] = [];
  lines.push(`User: @${p.login}`);
  lines.push(
    `Last 12 months: ${p.totals.contributions} total contributions, ${p.totals.commits} commits attributed to public repos, across ${p.repos.length} repositories.`,
  );
  lines.push("");
  lines.push("Repositories with recent commits (highest activity first):");
  lines.push("");

  const reposWithCommits = p.repos.filter((r) => r.recentCommits.length > 0);
  for (const repo of reposWithCommits) {
    const lang = repo.language?.name ?? "—";
    lines.push(`### ${repo.nameWithOwner} (${lang}) — ${repo.totalCommits} commits`);
    if (repo.description) lines.push(`Description: ${repo.description}`);
    const sorted = [...repo.recentCommits].sort((a, b) => b.date.localeCompare(a.date));
    const sample = sorted.slice(0, 40);
    lines.push(`Commit messages (most recent first, ${sample.length} of ${repo.recentCommits.length}):`);
    for (const c of sample) {
      lines.push(`- ${c.date.slice(0, 10)}: ${c.headline}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export async function summarizeTimeline(p: ProfileData): Promise<Timeline> {
  const payload = formatPayload(p);
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: payload },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.3,
  };
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/Jamminroot/jamminroot_profile_cards",
      "X-Title": "Jamminroot Profile Cards",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (json.error) throw new Error(`OpenRouter error: ${json.error.message}`);
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error(`OpenRouter returned no content: ${JSON.stringify(json).slice(0, 500)}`);
  const parsed = TimelineSchema.parse(JSON.parse(extractJson(content)));
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    summary: parsed.summary,
    periods: parsed.periods,
  };
}
