/**
 * Herdr client bridge.
 * Communicates with the running Herdr session via UNIX domain socket
 * or CLI fallback to rename tabs and panes in real time.
 */

const net = require("node:net");
const { execSync } = require("node:child_process");

/**
 * Check if the current process is running inside Herdr.
 *
 * @returns {boolean}
 */
function isInsideHerdr() {
  return process.env.HERDR_ENV === "1";
}

/**
 * Send a JSON-RPC request to Herdr's UNIX socket.
 *
 * @param {string} socketPath - Path to herdr.sock
 * @param {string} method - Socket API method (e.g. 'tab.rename')
 * @param {object} params - Method parameters
 * @param {number} [timeoutMs=300] - Request timeout
 * @returns {Promise<object>}
 */
function sendSocketRequest(socketPath, method, params, timeoutMs = 300) {
  return new Promise((resolve, reject) => {
    if (!socketPath) {
      return reject(new Error("Missing HERDR_SOCKET_PATH"));
    }

    const client = net.createConnection({ path: socketPath });
    let resolved = false;
    let rawData = "";

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.destroy();
        reject(new Error("Socket request timed out"));
      }
    }, timeoutMs);

    client.on("connect", () => {
      const payload = {
        id: `herdr-auto-title:${Date.now()}`,
        method,
        params
      };
      client.write(JSON.stringify(payload) + "\n");
    });

    client.on("data", (chunk) => {
      rawData += chunk.toString("utf-8");
      if (rawData.includes("\n")) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          client.end();
          try {
            const parsed = JSON.parse(rawData.trim().split("\n")[0]);
            resolve(parsed);
          } catch (err) {
            resolve({ ok: true, raw: rawData });
          }
        }
      }
    });

    client.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    client.on("close", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ ok: true });
      }
    });
  });
}

/**
 * Update the title of the current Herdr tab and pane.
 *
 * @param {string} title - Plain-text title to set
 * @param {object} [options]
 * @param {string} [options.tabId] - Override HERDR_TAB_ID
 * @param {string} [options.paneId] - Override HERDR_PANE_ID
 * @param {string} [options.socketPath] - Override HERDR_SOCKET_PATH
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function updateHerdrTitle(title, options = {}) {
  if (!isInsideHerdr()) {
    return { ok: false, error: "Not inside Herdr environment" };
  }

  const tabId = options.tabId || process.env.HERDR_TAB_ID;
  const paneId = options.paneId || process.env.HERDR_PANE_ID;
  const socketPath = options.socketPath || process.env.HERDR_SOCKET_PATH;

  // 1. Emit OSC 0 terminal title sequence to terminal via stderr (keeps stdout pure JSON for agent hooks)
  try {
    process.stderr.write(`\x1b]0;${title}\x07`);
  } catch (_) {}

  let tabRenamed = false;
  let paneRenamed = false;

  // 2. Try direct UNIX domain socket communication (fastest, ~1ms)
  if (socketPath) {
    if (tabId) {
      try {
        await sendSocketRequest(socketPath, "tab.rename", { tab_id: tabId, label: title });
        tabRenamed = true;
      } catch (_) {}
    }
    if (paneId) {
      try {
        await sendSocketRequest(socketPath, "pane.rename", { pane_id: paneId, label: title });
        paneRenamed = true;
      } catch (_) {}
    }
  }

  // 3. Fallback to Herdr CLI if socket is unavailable or failed
  if ((!tabRenamed && tabId) || (!paneRenamed && paneId)) {
    try {
      if (!tabRenamed && tabId) {
        execSync(`herdr tab rename "${tabId}" "${title.replace(/"/g, '\\"')}"`, {
          stdio: "ignore",
          timeout: 500
        });
      }
      if (!paneRenamed && paneId) {
        execSync(`herdr pane rename "${paneId}" "${title.replace(/"/g, '\\"')}"`, {
          stdio: "ignore",
          timeout: 500
        });
      }
    } catch (_) {}
  }

  return { ok: true, title };
}

module.exports = {
  isInsideHerdr,
  sendSocketRequest,
  updateHerdrTitle
};
