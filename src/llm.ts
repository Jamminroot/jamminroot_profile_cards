import type { ProfileData } from "./github.js";
import { TimelineSchema, type Timeline } from "./render.js";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");

const MODEL = process.env.LLM_MODEL || "deepseek/deepseek-v4-pro";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM = `You produce a CV-style activity timeline for a software engineer based on their public GitHub commits and repository descriptions. Your output is consumed by a templated SVG renderer, so adherence to the schema and to the detail rules below is critical.

# Detail level (strict)

- Output 4-7 PERIODS, each grouping a meaningful chunk of time. Examples of good period labels: "2026 Apr–May", "2026 Q1", "Late 2025", "2024 H2".
- Each period contains 1-3 ITEMS. An item is one milestone — typically scoped to one repository, summarising a CLUSTER of related commits.
- Each item has:
  * title (3-7 words) — a noun-phrase headline summarising the cluster
  * repo (optional, "owner/name") — set when the item is about one specific repo
  * description (1-2 plain sentences, max ~30 words) — what was built, fixed, or shipped, grounded in commit messages and the repo description
- Order periods reverse-chronologically (most recent first).

# Grouping rules

- Cluster commits to the same repo within ~2 weeks into ONE item. Do not list per-commit.
- SKIP routine maintenance (lone version bumps, README typo fixes, formatting commits) unless that's the only activity in a period worth mentioning.
- A second item in the same period for the same repo is allowed ONLY if it covers a clearly distinct workstream (e.g., "frontend redesign" vs "auth migration").

# Grounding rules

- Stay grounded in the data. Do NOT invent technologies, frameworks, integrations, version numbers, or accomplishments not visible in commit messages or repo descriptions.
- Use the repo's actual nameWithOwner in the "repo" field.
- Be specific where data supports it (concrete repo, concrete tech, what shipped). Be general only where data is thin.
- Avoid corporate puffery ("delivered impactful results"). Plain, direct language.

# Worked example

Input commits:
\`\`\`
### myorg/myapp (TypeScript) — 12 commits
Description: Internal admin dashboard for billing operations.
Commit messages (most recent first):
- 2026-04-15: feat: add OAuth login flow with Auth0
- 2026-04-14: fix: CSRF middleware ordering
- 2026-04-12: feat: cache JWT validation result
- 2026-04-10: chore: bump version 0.3.2
- 2026-04-09: docs: README typo
- 2026-04-08: feat: add /admin/users page with search
- 2026-04-07: feat: add user search backend endpoint
- 2026-04-05: refactor: extract auth middleware
\`\`\`

Good output for this cluster (one period, two items):
\`\`\`json
{
  "period": "2026 Apr",
  "items": [
    {
      "title": "Auth flow with OAuth + JWT caching",
      "repo": "myorg/myapp",
      "description": "Built the user login flow on Auth0 OAuth, cached JWT validation results, and fixed CSRF middleware ordering as part of the auth refactor."
    },
    {
      "title": "Admin user search page",
      "repo": "myorg/myapp",
      "description": "Added an /admin/users page with search and the supporting backend search endpoint."
    }
  ]
}
\`\`\`

Bad outputs to avoid:
- One item per commit ("Bumped version 0.3.2", "Fixed README typo") — too granular
- "Improved myapp" — too vague, no concrete content
- "Delivered enterprise-grade authentication infrastructure" — corporate puffery

# Output format

Output a SINGLE JSON object. No markdown fences. No commentary. Schema:

{
  "summary": "string, 2 sentences max, big-picture themes across all periods",
  "periods": [
    {
      "period": "string",
      "items": [
        { "title": "string", "repo": "string (optional)", "description": "string" }
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
  const raw = JSON.parse(extractJson(content));
  return TimelineSchema.parse({
    generatedAt: new Date().toISOString().slice(0, 10),
    ...raw,
  });
}
