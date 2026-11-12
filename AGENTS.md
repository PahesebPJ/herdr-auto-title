# AGENTS.md — Instructions for AI Coding Agents

This repository provides **herdr-auto-title**, an automatic plain-text tab and pane title updater for **Herdr TUI**.

Whenever a user submits a prompt, this tool catches the lifecycle event, extracts a concise plain-text label, and updates the Herdr tab and pane names via the local UNIX socket (`herdr.sock`) or CLI.

---

## 🚀 One-Line Installation

If you are asked to install this tool:

### 1. From local clone
```bash
node bin/cli.js install
```

### 2. From npm / npx (remote)
```bash
npx herdr-auto-title install
```

### 3. Via Herdr TUI Plugin Manager
```bash
herdr plugin install PahesebPJ/herdr-auto-title
# or for local link during development:
herdr plugin link .
```

---

## 🔍 Verification

Verify that all target agents are registered:

```bash
node bin/cli.js status
```

Output should show `✓ installed` for the detected agents:
- **Antigravity CLI (AGY)** (`~/.gemini/config/plugins/herdr-auto-title`)
- **Claude Code** (`~/.claude/hooks/herdr-auto-title.sh` & `settings.json`)
- **OpenAI Codex** (`~/.codex/hooks/herdr-auto-title.sh`)
- **OpenCode** (`~/.config/opencode/plugins/herdr-auto-title.js`)

---

## 🧠 Architectural Rules & Token Efficiency

1. **Zero LLM Token Overhead:**
   - Hooks must NEVER call LLM APIs or inject system messages into the conversation trajectory.
   - All hook invocations emit an empty JSON object `{}` to stdout and exit 0 immediately.
2. **Deterministic String Extraction:**
   - Clean, plain text only.
   - Strictly NO emojis, NO markdown noise.
   - Max length: 28–32 characters at word boundaries.
3. **Resilience & Non-Blocking:**
   - If `HERDR_ENV != 1` or the socket is unreachable, the runner silently exits with `{}` to avoid disrupting the agent's primary task.
