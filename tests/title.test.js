const test = require("node:test");
const assert = require("node:assert/strict");
const { extractTitle, EMOJI_REGEX } = require("../src/title");

test("extractTitle - strips slash commands", () => {
  const input = "/plan Create auth module";
  const result = extractTitle(input);
  assert.equal(result, "Create auth module");
  assert.ok(!result.includes("/plan"));
});

test("extractTitle - strictly strips all emojis", () => {
  const input = "🚀 🐛 Fix login button ⚡ on dashboard 🔥";
  const result = extractTitle(input);
  assert.equal(result, "Fix login button on dashboard");
  assert.equal(EMOJI_REGEX.test(result), false);
});

test("extractTitle - removes conversational filler in Spanish", () => {
  assert.equal(
    extractTitle("Por favor ayuda a corregir el bug en el checkout"),
    "Corregir el bug en el checkout"
  );
  assert.equal(
    extractTitle("Quiero que implementes la rotación de tokens", { maxLength: 50 }),
    "Implementes la rotación de tokens"
  );
  assert.equal(
    extractTitle("Podrías por favor crear un test de integración", { maxLength: 50 }),
    "Crear un test de integración"
  );
});

test("extractTitle - removes conversational filler in English", () => {
  assert.equal(
    extractTitle("Please could you fix the database connection timeout"),
    "Fix the database connection"
  );
  assert.equal(
    extractTitle("I need you to update the documentation for api"),
    "Update the documentation for api"
  );
  assert.equal(
    extractTitle("Help me to implement caching in redis"),
    "Implement caching in redis"
  );
});

test("extractTitle - truncates at word boundaries within maxLength", () => {
  const longPrompt = "Refactor the legacy monolithic user session authentication handler and database pools";
  const result = extractTitle(longPrompt, { maxLength: 32 });
  assert.ok(result.length <= 32);
  assert.ok(!result.endsWith(" "));
  // Word boundary truncation should preserve clean words
  assert.equal(result, "Refactor the legacy monolithic");
});

test("extractTitle - formats done state properly in plain text", () => {
  const input = "Fix memory leak";
  const result = extractTitle(input, { done: true });
  assert.equal(result, "done: fix memory leak");
  assert.equal(EMOJI_REGEX.test(result), false);
});

test("extractTitle - handles empty, null or undefined input safely", () => {
  assert.equal(extractTitle(""), "task");
  assert.equal(extractTitle(null), "idle");
  assert.equal(extractTitle(undefined), "idle");
  assert.equal(extractTitle("", { done: true }), "done");
});
