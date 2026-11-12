/**
 * Core title extraction and synthesis engine.
 * Deterministic, 0-token overhead string parser that transforms
 * raw conversational prompts into concise, plain-text labels.
 */

// Regular expression to strip all emoji characters
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;

// Slash commands commonly used in coding agents
const SLASH_COMMANDS_REGEX = /^\s*\/[a-zA-Z0-9_-]+\s+/;

// Conversational introductory phrases in Spanish and English (politeness, fillers)
const FILLER_PATTERNS = [
  // Spanish fillers & greetings
  /^(?:hola\s*[,!.]?\s*)/i,
  /^(?:oye\s*[,!.]?\s*)/i,
  /^(?:actualmente\s*,?\s*)/i,
  /^(?:por\s+favor\s*,?\s*)/i,
  /^(?:ay[uú]dame\s+(?:a|con|en)\s+)/i,
  /^(?:ayuda\s+(?:a|con|en)\s+)/i,
  /^(?:quiero\s+que\s+(?:hagas\s+|procedas\s+a\s+)?)/i,
  /^(?:quiero\s+)/i,
  /^(?:necesito\s+que\s+(?:hagas\s+|procedas\s+a\s+)?)/i,
  /^(?:necesito\s+)/i,
  /^(?:podr[ií]as\s+(?:por\s+favor\s+)?)/i,
  /^(?:puedes\s+(?:por\s+favor\s+)?)/i,
  /^(?:vamos\s+a\s+)/i,
  /^(?:me\s+gustar[ií]a\s+(?:que\s+)?)/i,

  // English fillers & greetings
  /^(?:(?:hi|hello|hey)\s*[,!.]?\s*)/i,
  /^(?:please\s*,?\s*)/i,
  /^(?:could\s+you\s+(?:please\s+)?)/i,
  /^(?:can\s+you\s+(?:please\s+)?)/i,
  /^(?:would\s+you\s+(?:please\s+)?)/i,
  /^(?:i\s+(?:want|need)\s+you\s+to\s+)/i,
  /^(?:i\s+(?:want|need)\s+to\s+)/i,
  /^(?:help\s+me\s+(?:to\s+|with\s+)?)/i,
  /^(?:let'?s\s+)/i
];

/**
 * Clean and summarize a user prompt into a short plain-text label.
 *
 * @param {string} prompt - Raw input prompt
 * @param {object} [options]
 * @param {number} [options.maxLength=32] - Maximum string length
 * @param {boolean} [options.done=false] - Format as finished task
 * @returns {string} Plain-text title
 */
function extractTitle(prompt, options = {}) {
  const maxLength = options.maxLength || 32;
  const isDone = Boolean(options.done);

  if (prompt === null || prompt === undefined || typeof prompt !== "string") {
    return isDone ? "done" : "idle";
  }

  if (prompt.trim() === "") {
    return isDone ? "done" : "task";
  }

  // 1. Strip markdown code fences, comments and XML/HTML tags
  let text = prompt
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .trim();

  // 2. Remove slash command if present (e.g. /plan, /goal)
  text = text.replace(SLASH_COMMANDS_REGEX, "").trim();

  // 3. Remove leading emojis
  text = text.replace(EMOJI_REGEX, "").trim();

  // 4. Strip conversational filler patterns iteratively
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of FILLER_PATTERNS) {
      if (pattern.test(text)) {
        text = text.replace(pattern, "").trim();
        changed = true;
      }
    }
  }

  // 5. Remove any remaining emojis anywhere in the text (strict plain-text rule)
  text = text.replace(EMOJI_REGEX, "");

  // 6. Clean whitespace and quotes
  text = text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!text) {
    return isDone ? "done" : "task";
  }

  // 7. Capitalize first character
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // 8. Truncate at word boundary if it exceeds maxLength
  if (text.length > maxLength) {
    const cut = text.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.6) {
      text = cut.slice(0, lastSpace).trim();
    } else {
      text = cut.trim();
    }
  }

  // Remove trailing punctuation marks
  text = text.replace(/[,;:\-\s]+$/, "").trim();

  if (isDone) {
    return `done: ${text.toLowerCase()}`;
  }

  return text;
}

module.exports = {
  extractTitle,
  EMOJI_REGEX
};
