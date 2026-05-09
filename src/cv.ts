import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchProfile } from "./github.js";
import { summarizeTimeline } from "./llm.js";
import { renderCVMarkdown, renderCVSvg } from "./render.js";

const login = process.env.USERNAME || process.env.GITHUB_USER;
if (!login) throw new Error("USERNAME env var is required");

console.log(`fetching profile data for ${login}…`);
const data = await fetchProfile(login);
console.log(`fetched ${data.repos.length} repos`);

console.log("calling LLM to summarise timeline…");
const timeline = await summarizeTimeline(data);
console.log(`got ${timeline.periods.length} periods`);

await mkdir(resolve("cards"), { recursive: true });
await writeFile(resolve("cards/cv.svg"), renderCVSvg(timeline), "utf8");
await writeFile(resolve("CV.md"), renderCVMarkdown(timeline), "utf8");
console.log("wrote cards/cv.svg and CV.md");
