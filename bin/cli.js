#!/usr/bin/env node

/**
 * herdr-auto-title CLI
 * Dynamic plain-text title updater for Herdr tabs & panes across AI coding agents.
 */

const { runHook } = require("../src/hook-runner");
const { updateHerdrTitle } = require("../src/herdr");
const { extractTitle } = require("../src/title");
const { getStatus, installTarget, uninstallTarget } = require("../src/installers");

const args = process.argv.slice(2);
const command = args[0] || "help";

async function main() {
  switch (command) {
    case "hook": {
      const eventName = args[1] || "PreInvocation";
      await runHook(eventName);
      break;
    }

    case "set": {
      const rawText = args.slice(1).join(" ");
      if (!rawText) {
        console.error("Error: Please provide a title or prompt string.");
        process.exit(1);
      }
      const title = extractTitle(rawText);
      const res = await updateHerdrTitle(title);
      if (res.ok) {
        console.log(`Title set: "${title}"`);
      } else {
        console.warn(`Notice: ${res.error || "Not inside Herdr"}. Title would be: "${title}"`);
      }
      break;
    }

    case "status": {
      console.log("herdr-auto-title agent integration status:\n");
      const statuses = getStatus();
      for (const s of statuses) {
        const mark = s.installed ? "✓ installed" : "✗ not installed";
        console.log(`  ${s.displayName.padEnd(25)} ${mark}`);
      }
      console.log("");
      break;
    }

    case "install": {
      let target = "all";
      for (const arg of args.slice(1)) {
        if (arg.startsWith("--")) {
          target = arg.slice(2);
        } else if (!arg.startsWith("-")) {
          target = arg;
        }
      }

      console.log(`Installing herdr-auto-title hooks for [${target}]...`);
      try {
        const results = installTarget(target);
        for (const r of results) {
          console.log(`  ✓ ${r.name}: installed (${r.path || "ok"})`);
        }
        console.log("\nSuccess! Herdr tabs and panes will now update automatically on prompts.");
      } catch (err) {
        console.error(`Error installing: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case "uninstall": {
      let target = "all";
      for (const arg of args.slice(1)) {
        if (arg.startsWith("--")) {
          target = arg.slice(2);
        } else if (!arg.startsWith("-")) {
          target = arg;
        }
      }

      console.log(`Uninstalling herdr-auto-title hooks for [${target}]...`);
      try {
        const results = uninstallTarget(target);
        for (const r of results) {
          console.log(`  ✓ ${r.name}: ${r.ok ? "uninstalled" : "not found"}`);
        }
        console.log("\nDone.");
      } catch (err) {
        console.error(`Error uninstalling: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case "--version":
    case "-v":
    case "version": {
      const pkg = require("../package.json");
      console.log(`herdr-auto-title v${pkg.version}`);
      break;
    }

    case "--help":
    case "-h":
    case "help":
    default: {
      console.log(`herdr-auto-title — Automatic plain-text tab & pane titles for Herdr TUI

Usage:
  npx herdr-auto-title install [--all|--antigravity|--claude|--codex|--opencode]
  npx herdr-auto-title uninstall [--all|--antigravity|--claude|--codex|--opencode]
  npx herdr-auto-title status
  npx herdr-auto-title set "<prompt or title>"

Commands:
  install       Install hooks into detected coding agent configurations
  uninstall     Remove hooks from coding agent configurations
  status        Check integration status for Antigravity, Claude, Codex, OpenCode
  set           Manually test setting a clean title in the current Herdr session
  hook          Internal hook runner called by agent lifecycle events

Flags:
  --all         Target all supported agents (default)
  --antigravity Target Antigravity CLI (~/.gemini)
  --claude      Target Claude Code (~/.claude)
  --codex       Target OpenAI Codex (~/.codex)
  --opencode    Target OpenCode (~/.config/opencode)
  -v, --version Show version
  -h, --help    Show this help message
`);
      break;
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
