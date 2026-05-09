import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchProfile } from "./github.js";
import { renderHours, renderLanguages, renderMonthly } from "./render.js";

const login = process.env.USERNAME || process.env.GITHUB_USER;
if (!login) throw new Error("USERNAME env var is required");

const data = await fetchProfile(login);
await mkdir(resolve("cards"), { recursive: true });

const outputs = {
  "cards/languages.svg": renderLanguages(data),
  "cards/hours.svg": renderHours(data),
  "cards/monthly.svg": renderMonthly(data),
};

for (const [path, svg] of Object.entries(outputs)) {
  await writeFile(resolve(path), svg, "utf8");
  console.log(`wrote ${path} (${svg.length} bytes)`);
}
