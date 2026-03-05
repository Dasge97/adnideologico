# Testing Guide - ADN Ideologico

Esta guia explica como esta organizado el testeo del proyecto, que cubre cada capa y como ejecutar pruebas de forma fiable.

## Vision general

El proyecto tiene 3 capas de validacion:

1. Backend unitario y de rutas (Node test runner).
2. Frontend E2E basico (Playwright).
3. Pruebas manuales de API (`test.rest`) para flujos completos.

Objetivo practico:

- detectar regresiones de logica de scoring
- validar reglas de negocio criticas en endpoints
- verificar que la experiencia basica en navegador sigue viva

## 1) Backend tests (node:test)

Ubicacion:

- `backend/tests/scoring.test.js`
- `backend/tests/routes.test.js`

### Que cubren

`scoring.test.js`:

- normalizacion de respuestas (1..7 -> -1..1)
- items invertidos
- estructura inicial de ejes
- mapeo de codigos DB (`ECON`, `LIB`, etc.) a formato API

`routes.test.js`:

- validacion de UUID en endpoints sensibles
- bloqueo de respuestas en sesiones finalizadas
- idempotencia de `POST /api/finish`
- validaciones de feedback

### Como ejecutarlos

```bash
npm --prefix backend test
```

### Como interpretar resultados

- `pass`: la logica actual es consistente con reglas esperadas.
- `fail`: hay regresion o cambio de contrato en backend.
- si falla un test de rutas, revisa validaciones de entrada y codigos HTTP.

## 2) Frontend E2E (Playwright)

Ubicacion:

- `frontend/e2e/basic-flow.spec.ts`
- config: `frontend/playwright.config.ts`

### Que cubre hoy

- carga landing
- existencia del mensaje principal
- accion `Ver ejemplo`
- apertura de pantalla de resultado de ejemplo

No cubre todavia el flujo completo de 36 respuestas.

### Como ejecutarlo

```bash
npm --prefix frontend test:e2e
```

El config levanta automaticamente un server preview:

- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4173`

### Requisitos

- dependencias frontend instaladas
- navegadores de Playwright instalados

Si falta Chromium:

```bash
npx --prefix frontend playwright install
```

## 3) Pruebas manuales de API (`test.rest`)

Archivo:

- `test.rest`

### Que permite validar

- health
- creacion de sesion
- carga de preguntas
- envio completo de respuestas
- finalizacion de test
- endpoints de observabilidad

### Como usarlo

1. Arranca backend/db (`docker compose up -d db backend`).
2. Abre `test.rest` en VS Code con REST Client.
3. Ejecuta bloques en orden (usa `create_session.session_id` en siguientes requests).

Ideal para debugging funcional rapido sin pasar por UI.

## Flujo recomendado de validacion antes de merge

1. Ejecutar backend tests:

```bash
npm --prefix backend test
```

2. Ejecutar build frontend:

```bash
npm --prefix frontend run build
```

3. Ejecutar E2E basico:

```bash
npm --prefix frontend test:e2e
```

4. Si tocaste rutas o payloads, pasar `test.rest` en los endpoints afectados.

## Que NO esta cubierto aun (gaps)

- cobertura E2E completa del flujo real 36/36 respuestas
- escenarios de error frontend en red inestable
- tests especificos de narrativa IA (shape/estilo)
- tests de observabilidad (smoke de targets/datasources)

## Sugerencia de crecimiento de testing

Prioridad alta:

1. E2E de flujo completo: landing -> test -> finish -> resultado.
2. Test de contrato para `POST /api/ai-analysis` (schema fijo).
3. Smoke test docker-compose para verificar `backend`, `prometheus`, `grafana`, `loki`.

