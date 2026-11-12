const test = require("node:test");
const assert = require("node:assert/strict");
const { isInsideHerdr, updateHerdrTitle } = require("../src/herdr");

test("herdr - isInsideHerdr returns true when HERDR_ENV=1", () => {
  const origEnv = process.env.HERDR_ENV;
  try {
    process.env.HERDR_ENV = "1";
    assert.equal(isInsideHerdr(), true);

    delete process.env.HERDR_ENV;
    assert.equal(isInsideHerdr(), false);
  } finally {
    process.env.HERDR_ENV = origEnv;
  }
});

test("herdr - updateHerdrTitle gracefully returns error when outside Herdr", async () => {
  const origEnv = process.env.HERDR_ENV;
  try {
    delete process.env.HERDR_ENV;
    const res = await updateHerdrTitle("Test Title");
    assert.equal(res.ok, false);
    assert.match(res.error, /Not inside Herdr/);
  } finally {
    process.env.HERDR_ENV = origEnv;
  }
});
