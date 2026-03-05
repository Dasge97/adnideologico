# Observability Stack

## Included components

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (`admin` / `admin`)
- Loki: `http://localhost:3100`
- Promtail: ships Docker logs to Loki

## Start stack

```bash
docker compose up -d db backend prometheus loki promtail grafana
```

## Backend metrics endpoint

- `GET /metrics`

Implemented metrics:

- `http_requests_total`
- `http_request_duration_seconds`
- `sessions_started`
- `sessions_finished`
- `answers_submitted`
- `feedback_submitted`

## Dashboard

Grafana auto-loads dashboard:

- `ADN Ideologico - API Observability`

Panels:

- API requests per route
- request latency (p95)
- sessions started / finished
- errors (5xx)
- feedback messages
- Loki logs stream
