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
  const exists = settings.hooks.UserPromptSubmit.some((h) => h.command === commandStr);
  if (!exists) {
    settings.hooks.UserPromptSubmit.push({ command: commandStr });
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
          (h) => !h.command || !h.command.includes("herdr-auto-title")
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
