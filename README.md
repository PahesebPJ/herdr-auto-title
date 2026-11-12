# herdr-auto-title

[![CI](https://github.com/PahesebPJ/herdr-auto-title/actions/workflows/ci.yml/badge.svg)](https://github.com/PahesebPJ/herdr-auto-title/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)](https://www.npmjs.com/package/herdr-auto-title)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero Token Overhead](https://img.shields.io/badge/Token%20Overhead-0%20tokens-success.svg)](#zero-token-overhead)

Automatic, plain-text tab and pane title updater for **[Herdr TUI](https://herdr.dev)** across AI coding agents (**Antigravity CLI**, **Claude Code**, **OpenAI Codex**, **OpenCode**).

---

## 💡 Why herdr-auto-title?

When working inside [Herdr](https://herdr.dev) with multiple AI coding agents or parallel tasks, tabs usually keep generic identifiers (`1`, `2`, or `user@host:path`).

**herdr-auto-title** hooks into your coding agent's prompt lifecycle:
1. Catches the user prompt on submission.
2. Extracts a clean, concise, plain-text summary (stripping filler words, politeness phrases, and slash commands).
3. Immediately renames the active Herdr tab (`herdr tab rename`) and pane (`herdr pane rename`) in real-time.
4. Leaves the agent's context window 100% untouched.

---

## ⚡ Zero Token Overhead

- **Deterministic Local Parsing:** Extraction runs in pure Node.js in `< 2ms` using regex heuristics. **It never calls an LLM API**.
- **Pristine Conversation History:** Hook responses output `{}` directly to stdout. **Zero tokens are injected into your context window**, preserving your budget and context limits.
- **Strict Plain Text:** No emojis, no markdown fences, no ANSI noise.

---

## 📦 Installation

### Option 1: Via npm / npx (Recommended)

Run once to automatically install hooks into all detected agents:

```bash
npx herdr-auto-title install
```

Or install globally:

```bash
npm install -g herdr-auto-title
herdr-auto-title install
```

### Option 2: From GitHub (Clone & Link)

```bash
git clone https://github.com/PahesebPJ/herdr-auto-title.git
cd herdr-auto-title
npm install
node bin/cli.js install
```

### Option 3: Via Herdr Plugin Manager

```bash
herdr plugin install PahesebPJ/herdr-auto-title
```

---

## 🤖 Compatible AI Coding Agents

| Agent | Config Target | Hook Event | Supported |
| :--- | :--- | :--- | :---: |
| **Antigravity CLI (AGY)** | `~/.gemini/config/plugins/herdr-auto-title` | `PreInvocation` & `Stop` | ✅ |
| **Claude Code** | `~/.claude/` | `UserPromptSubmit` | ✅ |
| **OpenAI Codex** | `~/.codex/hooks/` | `UserPromptSubmit` | ✅ |
| **OpenCode** | `~/.config/opencode/plugins/` | `message.created` / `session.prompt` | ✅ |

To install for a specific agent only:

```bash
npx herdr-auto-title install --antigravity
npx herdr-auto-title install --claude
npx herdr-auto-title install --codex
npx herdr-auto-title install --opencode
```

---

## 🔍 Commands & Usage

```bash
# Check status of agent integrations
herdr-auto-title status

# Manually test setting a title in the current Herdr session
herdr-auto-title set "Refactor authentication database pools"

# Uninstall hooks from all agents
herdr-auto-title uninstall

# Show help
herdr-auto-title --help
```

---

## 🛠️ How It Works

```text
User types prompt ──► Agent Lifecycle Hook ──► herdr-auto-title
                                                    │
                                                    ├──► Extract clean plain-text title (<2ms)
                                                    │    (No LLM, 0 token consumption)
                                                    │
                                                    ├──► Herdr UNIX Socket (herdr.sock)
                                                    │    ├── tab.rename  ──► Herdr Tab
                                                    │    └── pane.rename ──► Herdr Pane
                                                    │
                                                    └──► Returns {} to Agent stdout
```

---

## 🧪 Testing

Run the automated test suite (native Node.js test runner, zero dependencies):

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE) © [PahesebPJ](https://github.com/PahesebPJ)
