const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../db");
const answersRoutes = require("../routes/answers");
const sessionRoutes = require("../routes/session");
const feedbackRoutes = require("../routes/feedback");

const VALID_SESSION_ID = "123e4567-e89b-42d3-a456-426614174000";

function invokeRouter(router, { method = "POST", url = "/", body = {} }) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      body,
      headers: {},
      query: {},
      params: {},
      ip: "127.0.0.1",
      path: url,
      originalUrl: url,
      baseUrl: "",
    };

    const response = {
      statusCode: 200,
      payload: undefined,
      headers: {},
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        resolve({ statusCode: this.statusCode, payload, headers: this.headers });
        return this;
      },
    };

    router.handle(req, response, (error) => {
      if (error) return reject(error);
      if (response.payload !== undefined) {
        return resolve({
          statusCode: response.statusCode,
          payload: response.payload,
          headers: response.headers,
        });
      }
      return reject(new Error("Router completed without response payload"));
    });
  });
}

test.afterEach(() => {
  db.query = db.pool.query.bind(db.pool);
});

test("POST /api/answer rejects invalid session UUID", async () => {
  let called = false;
  db.query = async () => {
    called = true;
    return { rows: [], rowCount: 0 };
  };

  const result = await invokeRouter(answersRoutes, {
    method: "POST",
    url: "/",
    body: {
      session_id: "not-a-uuid",
      question_id: 1,
      value: 4,
    },
  });

  assert.equal(result.statusCode, 400);
  assert.match(result.payload.error, /valid UUID/i);
  assert.equal(called, false);
});

test("POST /api/answer blocks writes on finished sessions", async () => {
  let insertCalled = false;

  db.query = async (text) => {
    if (text.includes("FROM sessions WHERE session_id")) {
      return {
        rowCount: 1,
        rows: [{ finished_at: new Date().toISOString() }],
      };
    }
    if (text.includes("FROM questions WHERE question_id")) {
      return {
        rowCount: 1,
        rows: [{ is_active: true }],
      };
    }
    if (text.includes("INSERT INTO answers")) {
      insertCalled = true;
      return { rowCount: 1, rows: [] };
    }

    throw new Error(`Unexpected SQL: ${text}`);
  };

  const result = await invokeRouter(answersRoutes, {
    method: "POST",
    url: "/",
    body: {
      session_id: VALID_SESSION_ID,
      question_id: 1,
      value: 5,
    },
  });

  assert.equal(result.statusCode, 409);
  assert.match(result.payload.error, /already finished/i);
  assert.equal(insertCalled, false);
});

test("POST /api/finish is idempotent for finished sessions", async () => {
  let progressQueryCalled = false;
  let updateCalled = false;

  db.query = async (text) => {
    if (text.includes("SELECT session_id, finished_at")) {
      return {
        rowCount: 1,
        rows: [{ session_id: VALID_SESSION_ID, finished_at: new Date().toISOString() }],
      };
    }
    if (text.includes("FROM axes ax")) {
      return {
        rowCount: 6,
        rows: [
          { code: "ECON", axis_score: "0.1" },
          { code: "LIB", axis_score: "-0.2" },
          { code: "CULT", axis_score: "0.3" },
          { code: "GLOB", axis_score: "0.0" },
          { code: "TECH", axis_score: "0.4" },
          { code: "ECO", axis_score: "-0.1" },
        ],
      };
    }
    if (text.includes("answered_count")) {
      progressQueryCalled = true;
      return { rowCount: 1, rows: [{ answered_count: 36, total_questions: 36 }] };
    }
    if (text.includes("UPDATE sessions")) {
      updateCalled = true;
      return { rowCount: 1, rows: [] };
    }

    throw new Error(`Unexpected SQL: ${text}`);
  };

  const result = await invokeRouter(sessionRoutes, {
    method: "POST",
    url: "/finish",
    body: { session_id: VALID_SESSION_ID },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.economy, 0.1);
  assert.equal(result.payload.liberties, -0.2);
  assert.equal(progressQueryCalled, false);
  assert.equal(updateCalled, false);
});

test("POST /api/feedback validates optional session UUID", async () => {
  let called = false;
  db.query = async () => {
    called = true;
    return { rows: [], rowCount: 0 };
  };

  const result = await invokeRouter(feedbackRoutes, {
    method: "POST",
    url: "/",
    body: {
      session_id: "broken",
      message: "texto",
    },
  });

  assert.equal(result.statusCode, 400);
  assert.match(result.payload.error, /valid UUID/i);
  assert.equal(called, false);
});

test("POST /api/feedback rejects non-existing session", async () => {
  db.query = async (text) => {
    if (text.includes("FROM sessions WHERE session_id")) {
      return { rowCount: 0, rows: [] };
    }
    throw new Error(`Unexpected SQL: ${text}`);
  };

  const result = await invokeRouter(feedbackRoutes, {
    method: "POST",
    url: "/",
    body: {
      session_id: VALID_SESSION_ID,
      message: "texto",
    },
  });

  assert.equal(result.statusCode, 404);
  assert.match(result.payload.error, /Session not found/i);
});
