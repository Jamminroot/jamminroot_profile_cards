import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderCVMarkdown, renderCVSvg, type Timeline } from "../src/render.js";

// Hand-crafted first iteration of the CV, compiled from public commit data.
// The LLM workflow regenerates this in the same shape on manual dispatch.
const timeline: Timeline = {
  generatedAt: new Date().toISOString().slice(0, 10),
  summary:
    "Recent work spans Telegram automation tooling, an Android + ASP.NET LLM chat backend, Windows productivity tools shipped to the Microsoft Store, and personal infrastructure — dotfiles, profile-card generators, and a YOLO labeling tool built in a day.",
  periods: [
    {
      period: "2026 Apr–May",
      items: [
        {
          title: "Custom GitHub profile cards generator",
          repo: "Jamminroot/jamminroot_profile_cards",
          description:
            "Built a TypeScript pipeline that pulls GitHub data via GraphQL and renders custom SVG sidebar cards plus an LLM-summarised CV timeline, replacing a third-party action.",
        },
        {
          title: "Clash.Meta API re-exposure",
          repo: "Jamminroot/Clash.Meta",
          description:
            "Re-exposed `ProxiesWithProviders` and `GetProxyNameList` APIs in the Mihomo fork to keep FlClash integration working.",
        },
      ],
    },
    {
      period: "2026 Mar",
      items: [
        {
          title: "Ozwil chat assistant — initial cut",
          repo: "Jamminroot/ozwil-api",
          description:
            "Spun up an Android app + ASP.NET Core backend for an LLM-powered chat assistant. Initial scaffolding plus tool-call safety rails, a Markdown rendering composable, Docker healthcheck setup, and chat UI cleanup.",
        },
      ],
    },
    {
      period: "2026 Feb",
      items: [
        {
          title: "telepilot-2 v0.8.2 release push",
          repo: "Jamminroot/n8n-nodes-telepilot-2",
          description:
            "Shipped a new 'album' trigger, fixed an auth race condition on existing sessions, and modernised CI: bumped n8n test version 1.89 → 2.8.3, added npm 403 retry logic, and cleaned up stale registry config.",
        },
        {
          title: "intag v2 on Microsoft Store",
          repo: "Jamminroot/intag",
          description:
            "Polished the Windows Explorer file-tagging tool through to a v2.4.29 release: added support for additional metadata properties (#26), shipped a privacy policy, and refreshed README/store assets.",
        },
        {
          title: "YOLO labeler — built in a day",
          repo: "Jamminroot/yolo-labeler",
          description:
            "Built a small on-host YOLO image labeling tool from scratch in a single day. Multi-select mark mode, batch delete, Ctrl+Delete shortcuts, flexible YAML resolution.",
        },
        {
          title: "Neovim IDE config",
          repo: "Jamminroot/.dotfiles",
          description:
            "Stood up a personal Neovim setup: migrated to the 0.11+ `vim.lsp.config` API, updated treesitter, added OSC 52 clipboard for SSH sessions, wired up a pre-commit secret-detection hook.",
        },
      ],
    },
    {
      period: "2026 Jan",
      items: [
        {
          title: "telepilot-2 stability work",
          repo: "Jamminroot/n8n-nodes-telepilot-2",
          description:
            "Hardened the TDLib integration: moved session storage to a stable path outside `node_modules`, restored the required `apiId/apiHash` parameters to `tdl.createClient()`, version bumps through 0.7.5–0.7.7.",
        },
      ],
    },
    {
      period: "Late 2025",
      items: [
        {
          title: "telepilot-2 fork foundation",
          repo: "Jamminroot/n8n-nodes-telepilot-2",
          description:
            "Forked telepilotco/n8n-nodes-telepilot and stood it up as a maintained package: Debian + Alpine Docker images, README/docs for TelePilot2, initial auth fix work.",
        },
      ],
    },
  ],
};

await mkdir(resolve("cards"), { recursive: true });
await writeFile(resolve("cards/cv.svg"), renderCVSvg(timeline), "utf8");
await writeFile(resolve("CV.md"), renderCVMarkdown(timeline), "utf8");
console.log("seed CV written: cards/cv.svg + CV.md");
