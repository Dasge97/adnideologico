# Observabilidad ADN Ideologico

Guia completa para usar y entender la observabilidad del proyecto.

## Arquitectura general

Flujo de datos:

1. `backend` expone metricas en `GET /metrics` (formato Prometheus).
2. `prometheus` hace scrape de esas metricas periodicamente.
3. `promtail` recoge logs de contenedores Docker.
4. `loki` almacena y consulta logs.
5. `grafana` visualiza metricas (Prometheus) y logs (Loki) en dashboards.

Servicios:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Loki: `http://localhost:3100`
- Promtail: agente de envio de logs (sin UI)

## Arranque y verificacion inicial

Levantar stack:

```bash
docker compose up -d db backend prometheus loki promtail grafana
```

Comprobar estado:

```bash
docker compose ps
```

Ver logs rapidos:

```bash
docker compose logs -f backend prometheus loki promtail grafana
```

## Prometheus (metricas)

Prometheus sirve para almacenar y consultar series temporales del backend.

URL:

- `http://localhost:9090`

### Que debe estar funcionando

En `Status -> Targets`:

- job `backend` en estado `UP`
- job `prometheus` en estado `UP`

Si `backend` aparece `DOWN`, revisar:

- backend levantado
- ruta `GET /metrics`
- red docker y nombre del servicio

### Metricas implementadas en este proyecto

- `http_requests_total`
- `http_request_duration_seconds` (histograma)
- `sessions_started`
- `sessions_finished`
- `answers_submitted`
- `feedback_submitted`

### Queries PromQL utiles

Trafico API por ruta y metodo:

```promql
sum by (method, path) (rate(http_requests_total[5m]))
```

Errores 5xx por segundo:

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
```

Latencia p95 por ruta:

```promql
histogram_quantile(0.95, sum by (le, path) (rate(http_request_duration_seconds_bucket[5m])))
```

Sesiones iniciadas/finalizadas:

```promql
sessions_started
sessions_finished
```

Actividad del test:

```promql
answers_submitted
feedback_submitted
```

### Ejemplos practicos (Prometheus)

Ejemplo 1: detectar subida de errores tras un deploy.

```promql
sum(rate(http_requests_total{status=~"5.."}[10m]))
```

Si pasa de ~0 a valores sostenidos, hay regresion.

Ejemplo 2: endpoint mas lento ahora mismo.

```promql
topk(5, histogram_quantile(0.95, sum by (le, path) (rate(http_request_duration_seconds_bucket[5m]))))
```

## Grafana (dashboards y exploracion)

Grafana es la capa visual para metricas y logs.

URL:

- `http://localhost:3000`

Credenciales:

- definidas por `.env` en raiz (`GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD`)

### Provisioning en este repo

Grafana carga automaticamente:

- data source Prometheus
- data source Loki
- dashboard `ADN Ideologico - API Observability`

### Dashboard incluido: como leerlo

Paneles principales:

- API requests por ruta: volumen y endpoints calientes.
- request latency (p95): experiencia real del usuario.
- sessions started / finished: embudo basico del test.
- errors (5xx): estabilidad del backend.
- feedback messages: actividad del canal de feedback.
- logs stream (Loki): eventos en crudo.

### Uso recomendado diario

1. Abre dashboard principal.
2. Revisa primero `errors (5xx)`.
3. Revisa `latency p95` en el mismo rango temporal.
4. Si hay degradacion, abre `Explore` con Loki para correlacionar logs.

### Ejemplos practicos (Grafana)

Ejemplo 1: validar que el test esta activo.

1. Selecciona ultimos `15m`.
2. Mira panel de requests por ruta.
3. Deben aparecer picos en `/api/session`, `/api/answer`, `/api/finish`.

Ejemplo 2: investigar lentitud en analisis IA.

1. En dashboard, revisa latencia p95 de `/api/ai-analysis`.
2. Si sube, abre `Explore` con Loki.
3. Filtra por `ai_analysis_fallback` o `timeout`.

## Loki (almacen de logs)

Loki guarda logs con etiquetas y permite consultas LogQL.

URL:

- `http://localhost:3100`

Normalmente no se usa su UI directa; se consulta desde Grafana Explore.

### Consultas LogQL utiles

Todos los logs del backend:

```logql
{container="adn_ideologico_backend"}
```

Solo requests HTTP:

```logql
{container="adn_ideologico_backend"} |= "\"message\":\"http_request\""
```

Warnings (incluye fallback IA):

```logql
{container="adn_ideologico_backend"} |= "\"level\":\"warn\""
```

Fallback de analisis IA:

```logql
{container="adn_ideologico_backend"} |= "ai_analysis_fallback"
```

Timeouts de Ollama:

```logql
{container="adn_ideologico_backend"} |= "Ollama timeout"
```

Requests 5xx del backend:

```logql
{container="adn_ideologico_backend"} |= "\"status\":500"
```

### Que buscar cuando algo falla

- timeouts (`Ollama timeout`)
- parseos invalidos JSON (`Unterminated string`, `Unexpected token`)
- picos de `status` 5xx en logs estructurados

### Ejemplos practicos (Loki)

Ejemplo 1: confirmar que una peticion uso fallback IA.

```logql
{container="adn_ideologico_backend"} |= "ai_analysis_fallback" |= "session_id"
```

Ejemplo 2: correlacionar un 500 con su endpoint.

```logql
{container="adn_ideologico_backend"} |= "\"message\":\"http_request\"" |= "\"status\":500"
```

## Promtail (ingestion de logs)

Promtail es el agente que:

- lee logs de Docker en el host
- aplica etiquetas
- envia a Loki

No tiene panel propio. Se valida indirectamente:

1. contenedor `promtail` en `Up`
2. Loki recibe entradas nuevas
3. queries en Grafana Explore devuelven logs recientes

Si no llegan logs:

- revisar mounts en `docker-compose` (`/var/lib/docker/containers`, `docker.sock`)
- revisar `observability/loki/promtail-config.yml`
- revisar conectividad `promtail -> loki`

### Ejemplo practico (Promtail)

Comprobar que promtail esta enviando:

```bash
docker compose logs --tail=100 promtail
```

Debes ver lineas de envio sin errores de conexion a Loki.

## Runbook rapido (incidente)

1. Grafana dashboard: detectar ventana temporal del incidente.
2. Prometheus: confirmar error rate y latencia.
3. Loki: filtrar logs backend en esa ventana.
4. Identificar causa:
- DB
- IA/Ollama
- endpoint concreto
5. Aplicar fix y vigilar recuperacion en p95 + errores.

## Ejemplo completo de investigacion

Caso: usuarios reportan que el resultado final tarda mucho.

1. Grafana dashboard: en `request latency (p95)` detectas subida en `/api/ai-analysis`.
2. Prometheus query:

```promql
histogram_quantile(0.95, sum by (le, path) (rate(http_request_duration_seconds_bucket{path="/api/ai-analysis"}[10m])))
```

3. Loki query:

```logql
{container="adn_ideologico_backend"} |= "/api/ai-analysis" |= "duration_ms"
```

4. Confirmas si hubo `ai_analysis_fallback` o `Ollama timeout`.
5. Ajustas `OLLAMA_TIMEOUT_MS` / `OLLAMA_NUM_PREDICT` y validas mejora en 15-30 min.

## Archivos de configuracion en este repo

- `observability/prometheus/prometheus.yml`
- `observability/loki/loki-config.yml`
- `observability/loki/promtail-config.yml`
- `observability/grafana/provisioning/datasources/datasources.yml`
- `observability/grafana/provisioning/dashboards/dashboards.yml`
- `observability/grafana/dashboards/adn-ideologico-observability.json`
