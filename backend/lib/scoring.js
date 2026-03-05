const AXIS_CODE_TO_KEY = {
  ECON: "economy",
  LIB: "liberties",
  CULT: "culture",
  GLOB: "global",
  TECH: "tech",
  ECO: "ecology",
};

function buildEmptyAxisScores() {
  return {
    economy: 0,
    liberties: 0,
    culture: 0,
    global: 0,
    tech: 0,
    ecology: 0,
  };
}

function normalizeAnswer(value, isReversed = false) {
  const normalized = (Number(value) - 4) / 3;
  return isReversed ? normalized * -1 : normalized;
}

function toAxisScores(axisRows) {
  const result = buildEmptyAxisScores();

  for (const row of axisRows) {
    const key = AXIS_CODE_TO_KEY[row.code];
    if (!key) continue;
    result[key] = row.axis_score === null ? 0 : Number(row.axis_score);
  }

  return result;
}

module.exports = {
  AXIS_CODE_TO_KEY,
  buildEmptyAxisScores,
  normalizeAnswer,
  toAxisScores,
};
