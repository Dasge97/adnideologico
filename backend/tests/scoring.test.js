const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildEmptyAxisScores,
  normalizeAnswer,
  toAxisScores,
} = require("../lib/scoring");

test("normalizeAnswer maps 1..7 into -1..1", () => {
  assert.equal(normalizeAnswer(1), -1);
  assert.equal(normalizeAnswer(4), 0);
  assert.equal(normalizeAnswer(7), 1);
});

test("normalizeAnswer supports reversed items", () => {
  assert.equal(normalizeAnswer(7, true), -1);
  assert.equal(normalizeAnswer(1, true), 1);
});

test("buildEmptyAxisScores creates all axes in 0", () => {
  assert.deepEqual(buildEmptyAxisScores(), {
    economy: 0,
    liberties: 0,
    culture: 0,
    global: 0,
    tech: 0,
    ecology: 0,
  });
});

test("toAxisScores maps DB axis codes to API keys", () => {
  const scores = toAxisScores([
    { code: "ECON", axis_score: "0.50" },
    { code: "LIB", axis_score: "-0.25" },
    { code: "TECH", axis_score: null },
  ]);

  assert.deepEqual(scores, {
    economy: 0.5,
    liberties: -0.25,
    culture: 0,
    global: 0,
    tech: 0,
    ecology: 0,
  });
});
