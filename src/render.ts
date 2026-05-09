import type { ProfileData, ContributionDay, RepoData } from "./github.js";

const CARD_W = 280;

const STYLE = `
  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }
  .bg { fill: #ffffff; }
  .panel { fill: #f6f8fa; }
  .border { stroke: #d0d7de; }
  .fg { fill: #1f2328; }
  .muted { fill: #656d76; }
  .accent { fill: #0969da; }
  .accent2 { fill: #1f883d; }
  .accent-stroke { stroke: #0969da; }
  @media (prefers-color-scheme: dark) {
    .bg { fill: #0d1117; }
    .panel { fill: #161b22; }
    .border { stroke: #30363d; }
    .fg { fill: #e6edf3; }
    .muted { fill: #7d8590; }
    .accent { fill: #58a6ff; }
    .accent2 { fill: #3fb950; }
    .accent-stroke { stroke: #58a6ff; }
  }
`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function wrapText(text: string, maxChars: number, maxLines = 99): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur.length === 0) {
      cur = w;
      continue;
    }
    if (cur.length + 1 + w.length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const used = lines.join(" ").length;
    if (text.length > used) lines[lines.length - 1] = trunc(lines[lines.length - 1], maxChars);
  }
  return lines;
}

function svg(width: number, height: number, label: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">
  <style>${STYLE}</style>
  <rect class="bg" x="0" y="0" width="${width}" height="${height}" rx="8" ry="8"/>
  ${body}
</svg>`;
}

function cardTitle(title: string, x = 16, y = 24): string {
  return `<text class="muted" x="${x}" y="${y}" font-size="10" letter-spacing="0.1em">${esc(title.toUpperCase())}</text>`;
}

// ---------- Languages card ----------

function aggregateLanguages(repos: RepoData[]): { name: string; color: string; count: number }[] {
  const map = new Map<string, { color: string; count: number }>();
  for (const r of repos) {
    if (!r.language) continue;
    const cur = map.get(r.language.name) ?? { color: r.language.color || "#0969da", count: 0 };
    cur.count += r.totalCommits;
    map.set(r.language.name, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, color: v.color, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export function renderLanguages(p: ProfileData): string {
  const langs = aggregateLanguages(p.repos).slice(0, 6);
  const total = langs.reduce((s, l) => s + l.count, 0) || 1;
  const headerH = 36;
  const rowH = 28;
  const height = headerH + langs.length * rowH + 16;

  const out: string[] = [];
  out.push(cardTitle("languages by commit"));

  const x = 16;
  const innerW = CARD_W - x * 2;
  langs.forEach((l, i) => {
    const y = headerH + i * rowH;
    const pct = ((l.count / total) * 100).toFixed(0);
    const barW = (l.count / total) * innerW;
    out.push(
      `<text class="fg" x="${x}" y="${y + 12}" font-size="11">${esc(trunc(l.name, 18))}</text>`,
      `<text class="muted" x="${x + innerW}" y="${y + 12}" font-size="10" text-anchor="end">${l.count} · ${pct}%</text>`,
      `<rect class="panel" x="${x}" y="${y + 16}" width="${innerW}" height="6" rx="3" ry="3"/>`,
      `<rect x="${x}" y="${y + 16}" width="${barW}" height="6" rx="3" ry="3" fill="${l.color}"/>`,
    );
  });

  return svg(CARD_W, height, "Top languages by commit", out.join(""));
}

// ---------- Active hours card ----------

function buildHourCounts(repos: RepoData[]): { hours: number[]; total: number; peak: number } {
  const hours = new Array(24).fill(0);
  let total = 0;
  for (const r of repos) {
    for (const c of r.recentCommits) {
      const d = new Date(c.date);
      if (Number.isNaN(d.getTime())) continue;
      hours[d.getUTCHours()]++;
      total++;
    }
  }
  let peak = 0;
  for (let h = 0; h < 24; h++) if (hours[h] > hours[peak]) peak = h;
  return { hours, total, peak };
}

export function renderHours(p: ProfileData): string {
  const { hours, total, peak } = buildHourCounts(p.repos);
  const max = Math.max(1, ...hours);
  const height = 200;
  const x0 = 16;
  const innerW = CARD_W - x0 * 2;
  const barAreaY = 44;
  const barAreaH = 110;
  const baseY = barAreaY + barAreaH;
  const gap = 1;
  const bw = (innerW - gap * 23) / 24;

  const out: string[] = [];
  out.push(cardTitle("commits by hour (utc)"));
  out.push(
    `<text class="muted" x="${CARD_W - x0}" y="24" font-size="9" text-anchor="end">${total} commits</text>`,
  );

  for (let h = 0; h < 24; h++) {
    const ratio = hours[h] / max;
    const bh = ratio * (barAreaH - 4);
    const by = baseY - bh;
    const bx = x0 + h * (bw + gap);
    const isPeak = h === peak && hours[h] > 0;
    const cls = isPeak ? "accent2" : "accent";
    out.push(
      `<rect class="${cls}" x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="1.5" ry="1.5" opacity="${(0.55 + ratio * 0.45).toFixed(2)}"/>`,
    );
  }

  for (const h of [0, 6, 12, 18]) {
    const lx = x0 + h * (bw + gap) + bw / 2;
    out.push(
      `<text class="muted" x="${lx}" y="${baseY + 12}" font-size="9" text-anchor="middle">${h.toString().padStart(2, "0")}</text>`,
    );
  }

  if (total > 0) {
    out.push(
      `<text class="muted" x="${x0}" y="${height - 16}" font-size="10">peak hour</text>`,
      `<text class="fg" x="${CARD_W - x0}" y="${height - 16}" font-size="11" text-anchor="end" font-weight="600">${peak.toString().padStart(2, "0")}:00 UTC</text>`,
    );
  } else {
    out.push(
      `<text class="muted" x="${CARD_W / 2}" y="${baseY / 2 + 16}" font-size="11" text-anchor="middle">no public commit data</text>`,
    );
  }

  return svg(CARD_W, height, "Commits by hour of day", out.join(""));
}

// ---------- Monthly activity card ----------

function monthlyBuckets(days: ContributionDay[]): { label: string; count: number }[] {
  const now = new Date();
  const buckets: { label: string; count: number; key: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    buckets.push({ label, count: 0, key });
  }
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const d of days) {
    const key = d.date.slice(0, 7);
    const b = map.get(key);
    if (b) b.count += d.count;
  }
  return buckets;
}

export function renderMonthly(p: ProfileData): string {
  const months = monthlyBuckets(p.contributionDays);
  const max = Math.max(1, ...months.map((m) => m.count));
  const height = 180;
  const x0 = 16;
  const innerW = CARD_W - x0 * 2;
  const barAreaY = 44;
  const barAreaH = 100;
  const baseY = barAreaY + barAreaH;
  const gap = 4;
  const bw = (innerW - gap * 11) / 12;

  const out: string[] = [];
  out.push(cardTitle("monthly contributions"));
  out.push(
    `<text class="muted" x="${CARD_W - x0}" y="24" font-size="9" text-anchor="end">last 12 months</text>`,
  );

  months.forEach((m, i) => {
    const ratio = m.count / max;
    const bh = ratio * (barAreaH - 6);
    const by = baseY - bh;
    const bx = x0 + i * (bw + gap);
    out.push(
      `<rect class="accent2" x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" ry="2" opacity="${(0.55 + ratio * 0.45).toFixed(2)}"/>`,
      `<text class="muted" x="${bx + bw / 2}" y="${baseY + 12}" font-size="8" text-anchor="middle">${m.label[0]}</text>`,
    );
  });

  const total = months.reduce((s, m) => s + m.count, 0);
  out.push(
    `<text class="muted" x="${x0}" y="${height - 16}" font-size="10">total</text>`,
    `<text class="fg" x="${CARD_W - x0}" y="${height - 16}" font-size="11" text-anchor="end" font-weight="600">${total.toLocaleString()}</text>`,
  );

  return svg(CARD_W, height, "Monthly contributions", out.join(""));
}

// ---------- CV / Timeline ----------

export type TimelineItem = {
  title: string;
  repo?: string;
  description: string;
};

export type TimelinePeriod = {
  period: string;
  items: TimelineItem[];
};

export type Timeline = {
  generatedAt: string;
  summary: string;
  periods: TimelinePeriod[];
};

const CV_W = 600;
const CV_PAD = 28;

export function renderCVSvg(t: Timeline): string {
  const sections: string[] = [];
  let y = CV_PAD;

  sections.push(
    `<text class="fg" x="${CV_PAD}" y="${y + 14}" font-size="16" font-weight="700">Recent activity</text>`,
    `<text class="muted" x="${CV_W - CV_PAD}" y="${y + 14}" font-size="10" text-anchor="end">updated ${esc(t.generatedAt)}</text>`,
  );
  y += 32;

  if (t.summary) {
    const lines = wrapText(t.summary, 72, 4);
    lines.forEach((line, i) => {
      sections.push(
        `<text class="muted" x="${CV_PAD}" y="${y + i * 18}" font-size="12">${esc(line)}</text>`,
      );
    });
    y += lines.length * 18 + 12;
  }

  const railX = CV_PAD + 70;
  const dotR = 4;
  for (const period of t.periods) {
    const periodY = y + 14;
    sections.push(
      `<text class="accent" x="${CV_PAD}" y="${periodY}" font-size="11" font-weight="600">${esc(period.period)}</text>`,
      `<circle class="accent" cx="${railX}" cy="${periodY - 4}" r="${dotR}"/>`,
    );
    const periodStartY = y;
    y += 22;

    for (let idx = 0; idx < period.items.length; idx++) {
      const item = period.items[idx];
      const titleY = y + 12;
      sections.push(
        `<text class="fg" x="${railX + 16}" y="${titleY}" font-size="13" font-weight="600">${esc(trunc(item.title, 48))}</text>`,
      );
      if (item.repo) {
        sections.push(
          `<text class="muted" x="${CV_W - CV_PAD}" y="${titleY}" font-size="10" text-anchor="end">${esc(trunc(item.repo, 36))}</text>`,
        );
      }
      const descLines = wrapText(item.description, 64, 4);
      descLines.forEach((line, i) => {
        sections.push(
          `<text class="muted" x="${railX + 16}" y="${titleY + 16 + i * 16}" font-size="11">${esc(line)}</text>`,
        );
      });
      y += 18 + descLines.length * 16 + 10;
    }

    sections.push(
      `<line class="border" x1="${railX}" y1="${periodStartY + 14}" x2="${railX}" y2="${y - 4}" stroke-width="1"/>`,
    );
    y += 10;
  }

  y += 10;
  sections.push(
    `<text class="muted" x="${CV_PAD}" y="${y}" font-size="9">generated from public commit data + LLM summary</text>`,
  );
  y += CV_PAD;

  return svg(CV_W, y, "Recent activity timeline", sections.join("\n  "));
}

export function renderCVMarkdown(t: Timeline): string {
  const lines: string[] = [];
  lines.push(`# Recent activity timeline`);
  lines.push("");
  lines.push(`> Updated ${t.generatedAt}`);
  lines.push("");
  if (t.summary) {
    lines.push(t.summary);
    lines.push("");
  }
  for (const period of t.periods) {
    lines.push(`## ${period.period}`);
    lines.push("");
    for (const item of period.items) {
      const repoSuffix = item.repo ? ` *(${item.repo})*` : "";
      lines.push(`- **${item.title}**${repoSuffix} — ${item.description}`);
    }
    lines.push("");
  }
  lines.push(`---`);
  lines.push(`*Generated from public commit data + LLM summary.*`);
  lines.push("");
  return lines.join("\n");
}
