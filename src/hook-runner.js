/**
 * Universal hook runner for coding agents.
 * Reads hook payloads on stdin, extracts the user intent,
 * updates Herdr titles in plain text, and exits with `{}` (0 token injection).
 */

const { extractTitle } = require("./title");
const { updateHerdrTitle } = require("./herdr");

/**
 * Read all input from stdin with a safety timeout.
 *
 * @param {number} [timeoutMs=300]
 * @returns {Promise<string>}
 */
function readStdin(timeoutMs = 300) {
  return new Promise((resolve) => {
    let buffer = "";
    let completed = false;

    const timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        resolve(buffer);
      }
    }, timeoutMs);

    process.stdin.setEncoding("utf-8");

    process.stdin.on("data", (chunk) => {
      buffer += chunk;
    });

    process.stdin.on("end", () => {
      if (!completed) {
        completed = true;
        clearTimeout(timer);
        resolve(buffer);
      }
    });

    process.stdin.on("error", () => {
      if (!completed) {
        completed = true;
        clearTimeout(timer);
        resolve(buffer);
      }
    });

    // If stdin is a TTY and has no input, exit early
    if (process.stdin.isTTY) {
      completed = true;
      clearTimeout(timer);
      resolve("");
    }
  });
}

/**
 * Main hook dispatch function.
 *
 * @param {string} [eventName="PreInvocation"]
 */
async function runHook(eventName = "PreInvocation") {
  // Always emit an empty JSON object to stdout so the agent execution continues undisturbed
  const emitAndExit = () => {
    try {
      process.stdout.write("{}\n");
    } catch (_) {}
    process.exit(0);
  };

  try {
    const rawInput = await readStdin();
    let payload = {};

    if (rawInput && rawInput.trim()) {
      try {
        payload = JSON.parse(rawInput);
      } catch (_) {
        payload = { text: rawInput.trim() };
      }
    }

    const event = (payload.hookEventName || eventName || "").toLowerCase();
    const isDone = event.includes("stop") || event.includes("end");

    // Extract prompt from platform-specific payload properties
    let prompt =
      payload.lastUserInput ||
      payload.prompt ||
      payload.user_prompt ||
      payload.message ||
      payload.content ||
      payload.text ||
      "";

    // Handle nested message objects (e.g. OpenAI / OpenCode format)
    if (typeof prompt === "object" && prompt !== null) {
      prompt = prompt.content || prompt.text || "";
    }

    if (prompt && typeof prompt === "string") {
      const title = extractTitle(prompt, { done: isDone });
      await updateHerdrTitle(title);
    } else if (isDone) {
      await updateHerdrTitle("done");
    }
  } catch (_) {
    // Fail-safe: Never block the agent even if something unexpected happens
  }

  emitAndExit();
}

module.exports = {
  readStdin,
  runHook
};
