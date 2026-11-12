const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const cliPath = path.resolve(__dirname, "..", "bin", "cli.js");

test("hook-runner - processes Antigravity payload and exits 0 with {}", () => {
  const payload = JSON.stringify({
    conversationId: "test-conv-123",
    lastUserInput: "/plan Fix database connection pool leak",
    hookEventName: "PreInvocation"
  });

  const res = spawnSync("node", [cliPath, "hook", "PreInvocation"], {
    input: payload,
    encoding: "utf-8"
  });

  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "{}");
});

test("hook-runner - processes Claude Code payload and exits 0 with {}", () => {
  const payload = JSON.stringify({
    prompt: "Refactor auth middleware to use JWT",
    hook_event_name: "UserPromptSubmit"
  });

  const res = spawnSync("node", [cliPath, "hook", "UserPromptSubmit"], {
    input: payload,
    encoding: "utf-8"
  });

  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "{}");
});

test("hook-runner - processes OpenCode nested message payload and exits 0 with {}", () => {
  const payload = JSON.stringify({
    message: {
      role: "user",
      content: "Update README with installation instructions"
    }
  });

  const res = spawnSync("node", [cliPath, "hook", "PreInvocation"], {
    input: payload,
    encoding: "utf-8"
  });

  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "{}");
});

test("hook-runner - anchors title to first prompt, ignores subsequent in same session", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "herdr-test-state-"));
  const stateFile = path.join(tmpDir, "sessions.json");
  
  const env = { ...process.env, HERDR_AUTO_TITLE_STATE_FILE: stateFile, HERDR_ENV: "1" };

  // Prompt 1
  const payload1 = JSON.stringify({ conversationId: "c1", lastUserInput: "Fix auth login" });
  spawnSync("node", [cliPath, "hook", "PreInvocation"], { input: payload1, env });

  // Prompt 2 (should be ignored)
  const payload2 = JSON.stringify({ conversationId: "c1", lastUserInput: "Si, adelante" });
  spawnSync("node", [cliPath, "hook", "PreInvocation"], { input: payload2, env });

  const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  assert.equal(state.c1.title, "Fix auth login");
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
