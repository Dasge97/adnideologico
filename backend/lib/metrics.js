const COUNTER_DEFS = {
  http_requests_total: {
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status_code"],
  },
  sessions_started: {
    help: "Total started sessions",
    labelNames: [],
  },
  sessions_finished: {
    help: "Total finished sessions",
    labelNames: [],
  },
  answers_submitted: {
    help: "Total submitted answers",
    labelNames: [],
  },
  feedback_submitted: {
    help: "Total submitted feedback messages",
    labelNames: [],
  },
};

const HISTOGRAM_DEFS = {
  http_request_duration_seconds: {
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  },
};

const counters = new Map();
const histograms = new Map();

for (const [name] of Object.entries(COUNTER_DEFS)) {
  const store = new Map();
  if (COUNTER_DEFS[name].labelNames.length === 0) {
    store.set("", { entries: [], value: 0 });
  }
  counters.set(name, store);
}
for (const [name] of Object.entries(HISTOGRAM_DEFS)) {
  histograms.set(name, {
    buckets: HISTOGRAM_DEFS[name].buckets,
    values: new Map(),
  });
}

function normalizeLabels(def, labels = {}) {
  return def.labelNames.map((label) => [label, String(labels[label] ?? "")]);
}

function labelsToKey(entries) {
  return entries.map(([k, v]) => `${k}=${v}`).join("|");
}

function formatLabels(entries) {
  if (entries.length === 0) return "";
  const escaped = entries.map(([k, v]) => `${k}="${String(v).replace(/\\/g, "\\\\").replace(/\"/g, '\\\"')}"`);
  return `{${escaped.join(",")}}`;
}

function incCounter(name, labels = {}, value = 1) {
  const def = COUNTER_DEFS[name];
  if (!def) return;

  const entries = normalizeLabels(def, labels);
  const key = labelsToKey(entries);
  const bucket = counters.get(name);
  bucket.set(key, {
    entries,
    value: (bucket.get(key)?.value || 0) + value,
  });
}

function observeHistogram(name, labels = {}, value) {
  const def = HISTOGRAM_DEFS[name];
  if (!def || typeof value !== "number" || Number.isNaN(value)) return;

  const entries = normalizeLabels(def, labels);
  const key = labelsToKey(entries);
  const histogram = histograms.get(name);
  const current = histogram.values.get(key) || {
    entries,
    sum: 0,
    count: 0,
    bucketCounts: new Array(def.buckets.length).fill(0),
  };

  current.sum += value;
  current.count += 1;
  def.buckets.forEach((limit, index) => {
    if (value <= limit) current.bucketCounts[index] += 1;
  });

  histogram.values.set(key, current);
}

function renderCounter(name, def) {
  const lines = [
    `# HELP ${name} ${def.help}`,
    `# TYPE ${name} counter`,
  ];

  const values = counters.get(name);
  for (const { entries, value } of values.values()) {
    lines.push(`${name}${formatLabels(entries)} ${value}`);
  }

  return lines.join("\n");
}

function renderHistogram(name, def) {
  const lines = [
    `# HELP ${name} ${def.help}`,
    `# TYPE ${name} histogram`,
  ];

  const histogram = histograms.get(name);
  for (const sample of histogram.values.values()) {
    let cumulative = 0;
    def.buckets.forEach((limit, index) => {
      cumulative += sample.bucketCounts[index];
      lines.push(`${name}_bucket${formatLabels([...sample.entries, ["le", String(limit)]])} ${cumulative}`);
    });

    lines.push(`${name}_bucket${formatLabels([...sample.entries, ["le", "+Inf"]])} ${sample.count}`);
    lines.push(`${name}_sum${formatLabels(sample.entries)} ${sample.sum}`);
    lines.push(`${name}_count${formatLabels(sample.entries)} ${sample.count}`);
  }

  return lines.join("\n");
}

function renderMetrics() {
  const sections = [];

  for (const [name, def] of Object.entries(COUNTER_DEFS)) {
    sections.push(renderCounter(name, def));
  }
  for (const [name, def] of Object.entries(HISTOGRAM_DEFS)) {
    sections.push(renderHistogram(name, def));
  }

  return `${sections.filter(Boolean).join("\n\n")}\n`;
}

module.exports = {
  incCounter,
  observeHistogram,
  renderMetrics,
};
