const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { ALL_INSTALLERS, getStatus, installTarget, uninstallTarget } = require("../src/installers");

test("installers - registry lists 4 supported agents", () => {
  const names = ALL_INSTALLERS.map((i) => i.name);
  assert.deepEqual(names.sort(), ["antigravity", "claude", "codex", "opencode"].sort());
});

test("installers - mock install and uninstall for antigravity", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "herdr-test-gemini-"));
  const origGemini = process.env.GEMINI_CONFIG_DIR;

  try {
    process.env.GEMINI_CONFIG_DIR = tmpDir;

    // 1. Install
    const installRes = installTarget("antigravity");
    assert.equal(installRes.length, 1);
    assert.equal(installRes[0].name, "antigravity");
    assert.equal(installRes[0].ok, true);

    const pluginDir = path.join(tmpDir, "plugins", "herdr-auto-title");
    assert.ok(fs.existsSync(path.join(pluginDir, "plugin.json")));
    assert.ok(fs.existsSync(path.join(pluginDir, "hooks.json")));

    // 2. Status
    const status = getStatus();
    const agyStatus = status.find((s) => s.name === "antigravity");
    assert.equal(agyStatus.installed, true);

    // 3. Uninstall
    const uninstallRes = uninstallTarget("antigravity");
    assert.equal(uninstallRes[0].ok, true);
    assert.ok(!fs.existsSync(pluginDir));
  } finally {
    process.env.GEMINI_CONFIG_DIR = origGemini;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("installers - mock install and uninstall for claude", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "herdr-test-claude-"));
  const origClaude = process.env.CLAUDE_CONFIG_DIR;

  try {
    process.env.CLAUDE_CONFIG_DIR = tmpDir;

    const installRes = installTarget("claude");
    assert.equal(installRes[0].ok, true);

    const hookScript = path.join(tmpDir, "hooks", "herdr-auto-title.sh");
    assert.ok(fs.existsSync(hookScript));

    const status = getStatus();
    const claudeStatus = status.find((s) => s.name === "claude");
    assert.equal(claudeStatus.installed, true);

    const uninstallRes = uninstallTarget("claude");
    assert.equal(uninstallRes[0].ok, true);
    assert.ok(!fs.existsSync(hookScript));
  } finally {
    process.env.CLAUDE_CONFIG_DIR = origClaude;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("installers - claude writes valid nested hook format and migrates legacy entries", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "herdr-test-claude-fmt-"));
  const origClaude = process.env.CLAUDE_CONFIG_DIR;
  const settingsPath = path.join(tmpDir, "settings.json");
  const readSettings = () => JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  const foreignEntry = { hooks: [{ type: "command", command: "echo other-tool" }] };

  try {
    process.env.CLAUDE_CONFIG_DIR = tmpDir;
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        theme: "dark",
        hooks: {
          UserPromptSubmit: [
            { command: 'node "/old/path/herdr-auto-title/bin/cli.js" hook UserPromptSubmit' },
            foreignEntry
          ]
        }
      })
    );

    installTarget("claude");
    installTarget("claude");

    const settings = readSettings();
    assert.equal(settings.theme, "dark");
    const entries = settings.hooks.UserPromptSubmit;
    assert.equal(entries.length, 2);
    assert.deepEqual(entries[0], foreignEntry);
    for (const entry of entries) {
      assert.ok(Array.isArray(entry.hooks), "every entry must have a hooks array");
      assert.equal(entry.command, undefined);
      for (const h of entry.hooks) assert.equal(h.type, "command");
    }
    assert.match(entries[1].hooks[0].command, /herdr-auto-title.*hook UserPromptSubmit$/);

    uninstallTarget("claude");
    assert.deepEqual(readSettings().hooks.UserPromptSubmit, [foreignEntry]);
  } finally {
    process.env.CLAUDE_CONFIG_DIR = origClaude;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
