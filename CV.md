# Recent activity timeline

> Updated 2026-05-09

Recent work spans Telegram automation tooling, an Android + ASP.NET LLM chat backend, Windows productivity tools shipped to the Microsoft Store, and personal infrastructure — dotfiles, profile-card generators, and a YOLO labeling tool built in a day.

## 2026 Apr–May

- **Custom GitHub profile cards generator** *(Jamminroot/jamminroot_profile_cards)* — Built a TypeScript pipeline that pulls GitHub data via GraphQL and renders custom SVG sidebar cards plus an LLM-summarised CV timeline, replacing a third-party action.
- **Clash.Meta API re-exposure** *(Jamminroot/Clash.Meta)* — Re-exposed `ProxiesWithProviders` and `GetProxyNameList` APIs in the Mihomo fork to keep FlClash integration working.

## 2026 Mar

- **Ozwil chat assistant — initial cut** *(Jamminroot/ozwil-api)* — Spun up an Android app + ASP.NET Core backend for an LLM-powered chat assistant. Initial scaffolding plus tool-call safety rails, a Markdown rendering composable, Docker healthcheck setup, and chat UI cleanup.

## 2026 Feb

- **telepilot-2 v0.8.2 release push** *(Jamminroot/n8n-nodes-telepilot-2)* — Shipped a new 'album' trigger, fixed an auth race condition on existing sessions, and modernised CI: bumped n8n test version 1.89 → 2.8.3, added npm 403 retry logic, and cleaned up stale registry config.
- **intag v2 on Microsoft Store** *(Jamminroot/intag)* — Polished the Windows Explorer file-tagging tool through to a v2.4.29 release: added support for additional metadata properties (#26), shipped a privacy policy, and refreshed README/store assets.
- **YOLO labeler — built in a day** *(Jamminroot/yolo-labeler)* — Built a small on-host YOLO image labeling tool from scratch in a single day. Multi-select mark mode, batch delete, Ctrl+Delete shortcuts, flexible YAML resolution.
- **Neovim IDE config** *(Jamminroot/.dotfiles)* — Stood up a personal Neovim setup: migrated to the 0.11+ `vim.lsp.config` API, updated treesitter, added OSC 52 clipboard for SSH sessions, wired up a pre-commit secret-detection hook.

## 2026 Jan

- **telepilot-2 stability work** *(Jamminroot/n8n-nodes-telepilot-2)* — Hardened the TDLib integration: moved session storage to a stable path outside `node_modules`, restored the required `apiId/apiHash` parameters to `tdl.createClient()`, version bumps through 0.7.5–0.7.7.

## Late 2025

- **telepilot-2 fork foundation** *(Jamminroot/n8n-nodes-telepilot-2)* — Forked telepilotco/n8n-nodes-telepilot and stood it up as a maintained package: Debian + Alpine Docker images, README/docs for TelePilot2, initial auth fix work.

---
*Generated from public commit data + LLM summary.*
