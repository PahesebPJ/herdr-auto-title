---
name: herdr-auto-title
description: "Automatically sets clean, plain-text titles for Herdr tabs and panes based on user prompts across AI coding agents."
---

# herdr-auto-title Skill

Use this skill when the user asks to configure, install, check, or manage automatic dynamic titles for Herdr TUI workspaces.

## Commands

- **Check integration status:**
  ```bash
  npx herdr-auto-title status
  ```

- **Install hooks for all agents:**
  ```bash
  npx herdr-auto-title install
  ```

- **Install hook for a specific agent:**
  ```bash
  npx herdr-auto-title install --antigravity
  npx herdr-auto-title install --claude
  npx herdr-auto-title install --codex
  npx herdr-auto-title install --opencode
  ```

- **Set a manual test title:**
  ```bash
  npx herdr-auto-title set "Refactor user authentication service"
  ```

- **Uninstall:**
  ```bash
  npx herdr-auto-title uninstall
  ```
