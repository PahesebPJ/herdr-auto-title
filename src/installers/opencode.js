/**
 * OpenCode integration installer.
 * Deploys an OpenCode plugin that catches message and prompt events.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function getOpenCodePluginDir() {
  const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(configHome, "opencode", "plugins");
}

function getCliExecutablePath() {
  return path.resolve(__dirname, "..", "..", "bin", "cli.js");
}

function isInstalled() {
  const pluginFile = path.join(getOpenCodePluginDir(), "herdr-auto-title.js");
  return fs.existsSync(pluginFile);
}

function install() {
  const pluginDir = getOpenCodePluginDir();
  fs.mkdirSync(pluginDir, { recursive: true });

  const cliPath = getCliExecutablePath();
  const pluginFile = path.join(pluginDir, "herdr-auto-title.js");

  const pluginContent = `// herdr-auto-title plugin for OpenCode
const { spawn } = require("child_process");

module.exports = function (api) {
  if (process.env.HERDR_ENV !== "1") return;

  function handlePrompt(text) {
    if (!text || typeof text !== "string") return;
    const child = spawn("node", ["${cliPath}", "hook", "PreInvocation"], {
      stdio: ["pipe", "ignore", "ignore"],
      env: process.env
    });
    child.stdin.write(JSON.stringify({ prompt: text }) + "\\n");
    child.stdin.end();
  }

  if (api && typeof api.on === "function") {
    api.on("message.created", (msg) => {
      if (msg && msg.role === "user") {
        handlePrompt(msg.content);
      }
    });
    api.on("session.prompt", (data) => {
      handlePrompt(data?.prompt || data);
    });
  }
};
`;

  fs.writeFileSync(pluginFile, pluginContent, "utf-8");
  return { ok: true, path: pluginFile };
}

function uninstall() {
  const pluginFile = path.join(getOpenCodePluginDir(), "herdr-auto-title.js");
  if (fs.existsSync(pluginFile)) {
    fs.rmSync(pluginFile, { force: true });
    return { ok: true };
  }
  return { ok: false, message: "Not installed" };
}

module.exports = {
  name: "opencode",
  displayName: "OpenCode",
  isInstalled,
  install,
  uninstall
};
