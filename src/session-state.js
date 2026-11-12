/**
 * Lightweight session state cache.
 * Tracks the first-prompt title per conversation/session ID in a temp JSON file
 * so follow-up turns do not overwrite the anchored tab/pane title.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const MAX_SESSIONS = 200;

function getStateFilePath() {
  return (
    process.env.HERDR_AUTO_TITLE_STATE_FILE ||
    path.join(os.tmpdir(), "herdr-auto-title-sessions.json")
  );
}

function readState() {
  try {
    const filePath = getStateFilePath();
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeState(state) {
  try {
    const filePath = getStateFilePath();
    const entries = Object.entries(state);
    if (entries.length > MAX_SESSIONS) {
      entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0));
      state = Object.fromEntries(entries.slice(0, MAX_SESSIONS));
    }
    fs.writeFileSync(filePath, JSON.stringify(state), "utf-8");
  } catch (_) {
    // Ignore cache write errors
  }
}

/**
 * Derive a stable session key from a hook payload and Herdr environment.
 *
 * @param {object} payload
 * @returns {string|null}
 */
function resolveSessionKey(payload = {}) {
  const id =
    payload.conversationId ||
    payload.conversation_id ||
    payload.session_id ||
    payload.sessionID ||
    payload.sessionId ||
    payload.thread_id;

  if (typeof id === "string" && id.trim()) {
    return id.trim();
  }

  const tabId = process.env.HERDR_TAB_ID;
  const paneId = process.env.HERDR_PANE_ID;
  if (tabId || paneId) {
    return `herdr:${tabId || ""}:${paneId || ""}`;
  }

  return null;
}

/**
 * Check if a session already has an anchored title.
 *
 * @param {string|null} sessionKey
 * @returns {string|null}
 */
function getSessionTitle(sessionKey) {
  if (!sessionKey) return null;
  const state = readState();
  return state[sessionKey]?.title || null;
}

/**
 * Record the anchored title for a session.
 *
 * @param {string|null} sessionKey
 * @param {string} title
 */
function setSessionTitle(sessionKey, title) {
  if (!sessionKey || !title) return;
  const state = readState();
  state[sessionKey] = {
    title,
    updatedAt: Date.now()
  };
  writeState(state);
}

module.exports = {
  getStateFilePath,
  resolveSessionKey,
  getSessionTitle,
  setSessionTitle
};
