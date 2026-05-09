import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

const port = Number(process.env.PORT) || 3737;
const root = resolve("cards");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>profile cards preview</title>
<style>
  :root { color-scheme: light; }
  body { background: #ffffff; color: #1f2328; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; margin: 0; padding: 32px; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin: 0 auto 24px; max-width: 1100px; }
  h1 { margin: 0; font-size: 18px; font-weight: 600; }
  .meta { color: #656d76; font-size: 12px; }
  main { max-width: 1100px; margin: 0 auto; }
  img { display: block; max-width: 100%; height: auto; }
  h2 { font-weight: 500; margin: 24px 0 8px; color: #656d76; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; }
  details { margin-top: 24px; max-width: 1100px; margin-left: auto; margin-right: auto; }
  summary { cursor: pointer; color: #656d76; font-size: 12px; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 8px; overflow: auto; font-size: 12px; }
  button { background: #f6f8fa; color: #1f2328; border: 1px solid #d0d7de; padding: 4px 10px; font-size: 12px; border-radius: 6px; cursor: pointer; }
  button:hover { background: #eaeef2; }
</style>
</head>
<body>
<header>
  <h1>profile cards preview</h1>
  <span class="meta"><button onclick="location.reload()">reload</button></span>
</header>
<main>
  <h2>cards/profile.svg — combined image embedded in profile README</h2>
  <img src="/profile.svg" alt="combined profile card">
</main>
<details><summary>cards/cv.json (timeline source of truth)</summary><pre id="json"></pre></details>
<details><summary>CV.md (markdown view)</summary><pre id="md"></pre></details>
<script>
fetch("/cv.json").then(r => r.text()).then(t => document.getElementById("json").textContent = t);
fetch("/CV.md").then(r => r.text()).then(t => document.getElementById("md").textContent = t);
</script>
</body>
</html>`;

const types: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".md": "text/markdown",
  ".json": "application/json",
};

createServer(async (req, res) => {
  try {
    const url = (req.url || "/").split("?")[0];
    if (url === "/" || url === "/index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    if (url === "/CV.md") {
      const data = await readFile(resolve("CV.md"));
      res.writeHead(200, { "content-type": "text/markdown; charset=utf-8" });
      res.end(data);
      return;
    }
    const file = resolve(root, "." + url);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
