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
  header { display: flex; align-items: baseline; justify-content: space-between; margin: 0 auto 24px; max-width: 1000px; }
  h1 { margin: 0; font-size: 18px; font-weight: 600; }
  .meta { color: #656d76; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 280px; gap: 24px; max-width: 1000px; margin: 0 auto; }
  .left img, .right img { display: block; max-width: 100%; height: auto; }
  .right img { margin-bottom: 16px; }
  h2 { font-weight: 500; margin: 0 0 8px; color: #656d76; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; }
  .md { background: #f6f8fa; padding: 24px; border: 1px solid #d0d7de; border-radius: 8px; line-height: 1.5; font-size: 14px; }
  .md h1 { font-size: 18px; margin: 0 0 12px; }
  .md h2 { font-size: 12px; color: #0969da; text-transform: none; letter-spacing: 0; margin: 24px 0 8px; }
  .md ul { padding-left: 20px; margin: 8px 0; }
  .md li { margin: 6px 0; color: #1f2328; }
  .md em { color: #656d76; }
  .md code { background: #eaeef2; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  .md hr { border: 0; border-top: 1px solid #d0d7de; margin: 16px 0; }
  button { background: #f6f8fa; color: #1f2328; border: 1px solid #d0d7de; padding: 4px 10px; font-size: 12px; border-radius: 6px; cursor: pointer; }
  button:hover { background: #eaeef2; }
  .row { margin-bottom: 24px; }
  details { margin-top: 24px; max-width: 1000px; margin-left: auto; margin-right: auto; }
  summary { cursor: pointer; color: #7d8590; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>profile cards preview</h1>
  <span class="meta"><button onclick="location.reload()">reload</button></span>
</header>
<div class="grid">
  <div class="left">
    <h2>cv.svg — embedded image</h2>
    <img src="/cv.svg" alt="CV timeline">
  </div>
  <div class="right">
    <h2>sidebar cards</h2>
    <img src="/languages.svg" alt="languages">
    <img src="/hours.svg" alt="hours">
    <img src="/monthly.svg" alt="monthly">
  </div>
</div>
<details><summary>CV.md (markdown source, rendered)</summary><div id="md" class="md"></div></details>
<script>
fetch("/CV.md").then(r => r.text()).then(text => {
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^&gt; (.+)$/gm, "<p><em>$1</em></p>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>")
    .replace(/\\*([^*]+?)\\*/g, "<em>$1</em>")
    .replace(/\`([^\`]+)\`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\\/li>\\s*)+/gs, m => "<ul>" + m + "</ul>");
  document.getElementById("md").innerHTML = html;
});
</script>
</body>
</html>`;

const types: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".md": "text/markdown",
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
