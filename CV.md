# Recent activity timeline

> Updated 2026-06-01

Built an automated CV/portfolio pipeline driven by GitHub activity, and maintained a custom n8n node for Telegram automation, fixing auth races and CI stability.

## 2026 May

- **CV profile pipeline with heatmap and timeline** *(Jamminroot/Jamminroot)* — Developed an automated SVG/markdown CV pipeline that generates activity heatmaps, timeline blockquotes, and project cards from GitHub commits, including a PDF with a hidden AI-scanner prompt.
- **Repo weighting, filtering, and LLM integration** *(Jamminroot/Jamminroot)* — Added REPO_WEIGHTS config for importance weighting, EXCLUDED_REPOS_REGEX filtering, private repo discovery, and LLM payload injection to enforce coverage of top repos in generated CV content.

## 2026 Feb

- **CI fixes for n8n 2.x compatibility** *(Jamminroot/n8n-nodes-telepilot-2)* — Upgraded CI test environment from n8n 1.89.0 to 2.8.3, added retry logic for transient npm 403 errors, and removed stale npm and Verdaccio registry configs.
- **Auth race condition and session fixes** *(Jamminroot/n8n-nodes-telepilot-2)* — Fixed auth race condition causing unexpected authorization states, improved session progression handling, and moved TDLib storage to a stable path outside node_modules.

## 2026 Jan

- **New album trigger for TelePilot2** *(Jamminroot/n8n-nodes-telepilot-2)* — Added a new 'album' trigger to the TelePilot2 n8n node and restored required apiId/apiHash params for tdl.createClient().

## 2025 Sep

- **Docker deployment for n8n with TelePilot2** *(Jamminroot/n8n-nodes-telepilot-2)* — Added Debian-based and Alpine Linux Docker deployment support for n8n with the TelePilot2 node, along with updated documentation.

---
*Generated from public commit data + LLM summary.*
