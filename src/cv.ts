import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchProfile } from "./github.js";
import { summarizeTimeline } from "./llm.js";
import { renderCVMarkdown, renderProfile } from "./render.js";

const login = process.env.USERNAME || process.env.GITHUB_USER;
if (!login) throw new Error("USERNAME env var is required");

console.log(`fetching profile data for ${login}…`);
const profile = await fetchProfile(login);
console.log(`fetched ${profile.repos.length} repos`);

console.log("calling LLM to summarise timeline…");
const timeline = await summarizeTimeline(profile);
console.log(`got ${timeline.periods.length} periods`);

await mkdir(resolve("cards"), { recursive: true });
await writeFile(resolve("cards/cv.json"), JSON.stringify(timeline, null, 2), "utf8");
await writeFile(resolve("CV.md"), renderCVMarkdown(timeline), "utf8");
await writeFile(resolve("cards/profile.svg"), renderProfile(profile, timeline), "utf8");
console.log("wrote cards/cv.json, CV.md, cards/profile.svg");
