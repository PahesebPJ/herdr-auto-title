/**
 * Master installer registry.
 */

const antigravity = require("./antigravity");
const claude = require("./claude");
const codex = require("./codex");
const opencode = require("./opencode");

const ALL_INSTALLERS = [antigravity, claude, codex, opencode];

function getInstaller(name) {
  return ALL_INSTALLERS.find((i) => i.name.toLowerCase() === name.toLowerCase());
}

function getStatus() {
  return ALL_INSTALLERS.map((inst) => ({
    name: inst.name,
    displayName: inst.displayName,
    installed: inst.isInstalled()
  }));
}

function installTarget(targetName) {
  if (!targetName || targetName === "all") {
    return ALL_INSTALLERS.map((inst) => ({
      name: inst.name,
      ...inst.install()
    }));
  }
  const inst = getInstaller(targetName);
  if (!inst) {
    throw new Error(`Unknown target agent: ${targetName}`);
  }
  return [{ name: inst.name, ...inst.install() }];
}

function uninstallTarget(targetName) {
  if (!targetName || targetName === "all") {
    return ALL_INSTALLERS.map((inst) => ({
      name: inst.name,
      ...inst.uninstall()
    }));
  }
  const inst = getInstaller(targetName);
  if (!inst) {
    throw new Error(`Unknown target agent: ${targetName}`);
  }
  return [{ name: inst.name, ...inst.uninstall() }];
}

module.exports = {
  ALL_INSTALLERS,
  getInstaller,
  getStatus,
  installTarget,
  uninstallTarget
};
