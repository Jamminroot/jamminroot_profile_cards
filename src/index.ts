import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchProfile } from "./github.js";
import { renderProfile, TimelineSchema, type Timeline } from "./render.js";

const login = process.env.USERNAME || process.env.GITHUB_USER;
if (!login) throw new Error("USERNAME env var is required");

const cvJsonPath = resolve("cards/cv.json");
let timeline: Timeline;
try {
  const raw = await readFile(cvJsonPath, "utf8");
  timeline = TimelineSchema.parse(JSON.parse(raw));
} catch {
  timeline = {
    generatedAt: new Date().toISOString().slice(0, 10),
    summary: "Timeline not yet generated. Run the CV workflow to produce it.",
    periods: [],
  };
  console.warn(`no ${cvJsonPath} found — rendering with empty timeline`);
}

const profile = await fetchProfile(login);
await mkdir(resolve("cards"), { recursive: true });
const svg = renderProfile(profile, timeline);
await writeFile(resolve("cards/profile.svg"), svg, "utf8");
console.log(`wrote cards/profile.svg (${svg.length} bytes)`);
