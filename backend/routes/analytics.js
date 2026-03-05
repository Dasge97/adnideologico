const express = require("express");
const db = require("../db");

const router = express.Router();

const SESSION_AXIS_CTE = `
  WITH session_axis_scores AS (
    SELECT
      s.session_id,
      q.axis_id,
      ax.code,
      ax.name AS label,
      SUM(
        (CASE WHEN q.is_reversed THEN -1 ELSE 1 END)
        * ((a.value - 4)::numeric / 3)
        * q.weight
      ) / NULLIF(SUM(q.weight), 0) AS axis_score
    FROM sessions s
    INNER JOIN answers a ON a.session_id = s.session_id
    INNER JOIN questions q ON q.question_id = a.question_id
    INNER JOIN axes ax ON ax.axis_id = q.axis_id
    WHERE s.finished_at IS NOT NULL
    GROUP BY s.session_id, q.axis_id, ax.code, ax.name
  )
`;

async function getSummary() {
  const [profilesResult, meansResult] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total_profiles FROM sessions WHERE finished_at IS NOT NULL`),
    db.query(
      `${SESSION_AXIS_CTE}
       SELECT
         ax.code,
         ax.name AS label,
         COALESCE(AVG(sas.axis_score), 0)::float8 AS mean
       FROM axes ax
       LEFT JOIN session_axis_scores sas ON sas.axis_id = ax.axis_id
       GROUP BY ax.axis_id, ax.code, ax.name
       ORDER BY ax.axis_id`
    ),
  ]);

  return {
    total_profiles: profilesResult.rows[0].total_profiles,
    axis_means: meansResult.rows,
  };
}

async function getTimeseries(days) {
  const parsedDays = Number(days);
  const safeDays = Number.isInteger(parsedDays) ? Math.min(Math.max(parsedDays, 7), 180) : 30;

  const { rows } = await db.query(
    `
    WITH date_range AS (
      SELECT generate_series(
        CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS day
    ),
    per_day AS (
      SELECT DATE(finished_at)::date AS day, COUNT(*)::int AS count
      FROM sessions
      WHERE finished_at IS NOT NULL
      GROUP BY 1
    )
    SELECT
      date_range.day::text AS day,
      COALESCE(per_day.count, 0) AS count,
      SUM(COALESCE(per_day.count, 0)) OVER (ORDER BY date_range.day)::int AS cumulative
    FROM date_range
    LEFT JOIN per_day ON per_day.day = date_range.day
    ORDER BY date_range.day
    `,
    [safeDays]
  );

  return rows;
}

async function getConsensus() {
  const { rows } = await db.query(
    `${SESSION_AXIS_CTE}
     SELECT
       ax.code,
       ax.name AS label,
       COALESCE(STDDEV_POP(sas.axis_score), 0)::float8 AS dispersion
     FROM axes ax
     LEFT JOIN session_axis_scores sas ON sas.axis_id = ax.axis_id
     GROUP BY ax.axis_id, ax.code, ax.name
     ORDER BY ax.axis_id`
  );

  const sorted = [...rows].sort((a, b) => a.dispersion - b.dispersion);
  const mostConsensus = sorted[0] || { code: "", label: "Sin datos", dispersion: 0 };
  const mostDivided = sorted[sorted.length - 1] || { code: "", label: "Sin datos", dispersion: 0 };

  return {
    axes: rows,
    most_consensus: mostConsensus,
    most_divided: mostDivided,
  };
}

async function getTopCombinations(limit) {
  const parsedLimit = Number(limit);
  const safeLimit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 3), 25) : 10;

  const { rows } = await db.query(
    `${SESSION_AXIS_CTE}
     , pivot AS (
       SELECT
         session_id,
         MAX(CASE WHEN code = 'ECON' THEN axis_score END) AS economy,
         MAX(CASE WHEN code = 'LIB' THEN axis_score END) AS liberties,
         MAX(CASE WHEN code = 'CULT' THEN axis_score END) AS culture,
         MAX(CASE WHEN code = 'GLOB' THEN axis_score END) AS global,
         MAX(CASE WHEN code = 'TECH' THEN axis_score END) AS tech,
         MAX(CASE WHEN code = 'ECO' THEN axis_score END) AS ecology
       FROM session_axis_scores
       GROUP BY session_id
     ),
     classified AS (
       SELECT
         CONCAT(
           'ECON', CASE WHEN economy >= 0.25 THEN '+' WHEN economy <= -0.25 THEN '-' ELSE '0' END, ' ',
           'LIB', CASE WHEN liberties >= 0.25 THEN '+' WHEN liberties <= -0.25 THEN '-' ELSE '0' END, ' ',
           'CULT', CASE WHEN culture >= 0.25 THEN '+' WHEN culture <= -0.25 THEN '-' ELSE '0' END, ' ',
           'GLOB', CASE WHEN global >= 0.25 THEN '+' WHEN global <= -0.25 THEN '-' ELSE '0' END, ' ',
           'TECH', CASE WHEN tech >= 0.25 THEN '+' WHEN tech <= -0.25 THEN '-' ELSE '0' END, ' ',
           'ECO', CASE WHEN ecology >= 0.25 THEN '+' WHEN ecology <= -0.25 THEN '-' ELSE '0' END
         ) AS signature
       FROM pivot
     ),
     counted AS (
       SELECT signature, COUNT(*)::int AS count
       FROM classified
       GROUP BY signature
     )
     SELECT
       signature,
       count,
       (count * 100.0 / NULLIF((SELECT COUNT(*) FROM classified), 0))::float8 AS share_pct
     FROM counted
     ORDER BY count DESC, signature ASC
     LIMIT $1`,
    [safeLimit]
  );

  return rows;
}

router.get("/summary", async (_req, res) => {
  try {
    const summary = await getSummary();
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ error: "Failed to compute analytics summary" });
  }
});

router.get("/timeseries", async (req, res) => {
  try {
    const timeseries = await getTimeseries(req.query.days);
    return res.json(timeseries);
  } catch (error) {
    return res.status(500).json({ error: "Failed to compute analytics timeseries" });
  }
});

router.get("/consensus", async (_req, res) => {
  try {
    const consensus = await getConsensus();
    return res.json(consensus);
  } catch (error) {
    return res.status(500).json({ error: "Failed to compute analytics consensus" });
  }
});

router.get("/combinations", async (req, res) => {
  try {
    const combinations = await getTopCombinations(req.query.limit);
    return res.json(combinations);
  } catch (error) {
    return res.status(500).json({ error: "Failed to compute top combinations" });
  }
});

router.get("/overview", async (_req, res) => {
  try {
    const [summary, timeseries, consensus, topCombinations] = await Promise.all([
      getSummary(),
      getTimeseries(30),
      getConsensus(),
      getTopCombinations(10),
    ]);

    return res.json({
      ...summary,
      timeseries,
      consensus,
      top_combinations: topCombinations,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to compute analytics overview" });
  }
});

module.exports = router;
