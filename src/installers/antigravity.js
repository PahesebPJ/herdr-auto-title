/**
 * Antigravity CLI plugin installer.
 * Deploys an Antigravity plugin with PreInvocation and Stop lifecycle hooks.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function getAntigravityPluginDir() {
  const geminiConfig = process.env.GEMINI_CONFIG_DIR || path.join(os.homedir(), ".gemini", "config");
  return path.join(geminiConfig, "plugins", "herdr-auto-title");
}

function getCliExecutablePath() {
  return path.resolve(__dirname, "..", "..", "bin", "cli.js");
}

function isInstalled() {
  const pluginDir = getAntigravityPluginDir();
  return fs.existsSync(path.join(pluginDir, "plugin.json")) &&
         fs.existsSync(path.join(pluginDir, "hooks.json"));
}

function install() {
  const pluginDir = getAntigravityPluginDir();
  fs.mkdirSync(pluginDir, { recursive: true });

  const cliPath = getCliExecutablePath();

  const pluginManifest = {
    name: "herdr-auto-title",
    description: "Dynamic plain-text titles for Herdr tabs and panes with zero token overhead",
    version: "0.1.0"
  };

  const hooksConfig = {
    "herdr-auto-title": {
      PreInvocation: [
        {
          type: "command",
          command: `node "${cliPath}" hook PreInvocation`
        }
      ],
      Stop: [
        {
          type: "command",
          command: `node "${cliPath}" hook Stop`
        }
      ]
    }
  };

  fs.writeFileSync(path.join(pluginDir, "plugin.json"), JSON.stringify(pluginManifest, null, 2) + "\n", "utf-8");
  fs.writeFileSync(path.join(pluginDir, "hooks.json"), JSON.stringify(hooksConfig, null, 2) + "\n", "utf-8");

  return { ok: true, path: pluginDir };
}

function uninstall() {
  const pluginDir = getAntigravityPluginDir();
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    return { ok: true, removed: pluginDir };
  }
  return { ok: false, message: "Not installed" };
}

module.exports = {
  name: "antigravity",
  displayName: "Antigravity CLI (AGY)",
  isInstalled,
  install,
  uninstall
};
