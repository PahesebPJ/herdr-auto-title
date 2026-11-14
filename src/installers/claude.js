/**
 * Claude Code integration installer.
 * Deploys hook script and settings configuration for Claude Code.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
}

function getCliExecutablePath() {
  return path.resolve(__dirname, "..", "..", "bin", "cli.js");
}

function isOwnCommand(cmd) {
  return typeof cmd === "string" && cmd.includes("herdr-auto-title");
}

function isLegacyEntry(entry) {
  return !!entry && !Array.isArray(entry.hooks) && isOwnCommand(entry.command);
}

function entryHasCommand(entry, predicate) {
  if (!entry) return false;
  if (predicate(entry.command)) return true;
  return Array.isArray(entry.hooks) && entry.hooks.some((h) => h && predicate(h.command));
}

function isInstalled() {
  const claudeDir = getClaudeDir();
  const hookScript = path.join(claudeDir, "hooks", "herdr-auto-title.sh");
  return fs.existsSync(hookScript);
}

function install() {
  const claudeDir = getClaudeDir();
  const hooksDir = path.join(claudeDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });

  const cliPath = getCliExecutablePath();
  const hookScript = path.join(hooksDir, "herdr-auto-title.sh");

  const scriptContent = `#!/bin/sh
# herdr-auto-title hook for Claude Code
if [ "\${HERDR_ENV:-}" = "1" ]; then
  exec node "${cliPath}" hook UserPromptSubmit
fi
`;

  fs.writeFileSync(hookScript, scriptContent, { mode: 0o755 });

  // Update ~/.claude/settings.json if it exists or create it
  const settingsPath = path.join(claudeDir, "settings.json");
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch (_) {}
  }

  settings.hooks = settings.hooks || {};
  settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit || [];

  const commandStr = `node "${cliPath}" hook UserPromptSubmit`;
  const entries = settings.hooks.UserPromptSubmit;
  // Drop flat `{ command }` entries written by <=0.1.2; Claude Code rejects them.
  const cleaned = entries.filter((entry) => !isLegacyEntry(entry));
  const exists = cleaned.some((entry) => entryHasCommand(entry, (cmd) => cmd === commandStr));
  if (!exists) {
    cleaned.push({ hooks: [{ type: "command", command: commandStr }] });
  }
  if (!exists || cleaned.length !== entries.length) {
    settings.hooks.UserPromptSubmit = cleaned;
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
    } catch (_) {}
  }

  return { ok: true, path: hookScript };
}

function uninstall() {
  const claudeDir = getClaudeDir();
  const hookScript = path.join(claudeDir, "hooks", "herdr-auto-title.sh");
  let removed = false;

  if (fs.existsSync(hookScript)) {
    fs.rmSync(hookScript, { force: true });
    removed = true;
  }

  const settingsPath = path.join(claudeDir, "settings.json");
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      if (settings.hooks && Array.isArray(settings.hooks.UserPromptSubmit)) {
        settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter(
          (entry) => !entryHasCommand(entry, isOwnCommand)
        );
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
      }
    } catch (_) {}
  }

  return { ok: removed };
}

module.exports = {
  name: "claude",
  displayName: "Claude Code",
  isInstalled,
  install,
  uninstall
};
