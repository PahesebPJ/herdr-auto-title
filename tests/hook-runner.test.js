const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
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
