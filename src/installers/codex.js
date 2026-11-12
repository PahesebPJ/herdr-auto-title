/**
 * OpenAI Codex CLI integration installer.
 * Deploys hook script and configuration for Codex.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function getCodexDir() {
  return process.env.CODEX_CONFIG_DIR || path.join(os.homedir(), ".codex");
}

function getCliExecutablePath() {
  return path.resolve(__dirname, "..", "..", "bin", "cli.js");
}

function isInstalled() {
  const codexDir = getCodexDir();
  const hookScript = path.join(codexDir, "hooks", "herdr-auto-title.sh");
  return fs.existsSync(hookScript);
}

function install() {
  const codexDir = getCodexDir();
  const hooksDir = path.join(codexDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });

  const cliPath = getCliExecutablePath();
  const hookScript = path.join(hooksDir, "herdr-auto-title.sh");

  const scriptContent = `#!/bin/sh
# herdr-auto-title hook for OpenAI Codex CLI
if [ "\${HERDR_ENV:-}" = "1" ]; then
  exec node "${cliPath}" hook UserPromptSubmit
fi
`;

  fs.writeFileSync(hookScript, scriptContent, { mode: 0o755 });

  // Update ~/.codex/config.json if applicable
  const configPath = path.join(codexDir, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      config.hooks = config.hooks || {};
      config.hooks.UserPromptSubmit = hookScript;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
    } catch (_) {}
  }

  return { ok: true, path: hookScript };
}

function uninstall() {
  const codexDir = getCodexDir();
  const hookScript = path.join(codexDir, "hooks", "herdr-auto-title.sh");
  let removed = false;

  if (fs.existsSync(hookScript)) {
    fs.rmSync(hookScript, { force: true });
    removed = true;
  }

  const configPath = path.join(codexDir, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.hooks && config.hooks.UserPromptSubmit === hookScript) {
        delete config.hooks.UserPromptSubmit;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
      }
    } catch (_) {}
  }

  return { ok: removed };
}

module.exports = {
  name: "codex",
  displayName: "OpenAI Codex",
  isInstalled,
  install,
  uninstall
};
