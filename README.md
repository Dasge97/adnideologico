# ADN Ideologico

Plataforma web para explorar el perfil politico de una persona en 6 ejes (economia, libertades civiles, valores culturales, globalizacion, tecnologia y medio ambiente), sin encasillarla en izquierda/derecha.

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Observabilidad: Prometheus + Grafana + Loki + Promtail
- IA opcional local: Ollama

## Requisitos

- Docker + Docker Compose
- Node.js 20+ (si quieres ejecutar frontend/backend fuera de contenedores)

## Configuracion segura con `.env`

Este repositorio usa variables de entorno en raiz para `docker-compose`.

1. Copia el ejemplo:

```bash
cp .env.example .env
```

2. Ajusta secretos y puertos en `.env` (al menos `POSTGRES_PASSWORD` y `GF_SECURITY_ADMIN_PASSWORD`).

> `.env` esta ignorado por git.

## Levantar todo con Docker

```bash
docker compose up -d
```

Servicios principales:

- Front/backend API: `http://localhost:3001`
- PostgreSQL: `localhost:55432`
- Ollama: `http://localhost:11434`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Loki: `http://localhost:3100`

## Primer uso de IA local (Ollama)

Descargar modelo:

```bash
docker compose up -d ollama
docker exec -it adn_ideologico_ollama ollama pull qwen2.5:7b-instruct
```

Config IA en `.env`:

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_MS`
- `OLLAMA_NUM_PREDICT`

## Desarrollo local (sin Docker para app)

Backend:

```bash
cd backend
npm install
npm test
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Estructura

- `frontend/` interfaz de usuario y flujo del test
- `backend/` API, scoring, narrativa IA, analytics y metrics
- `bd/` SQL de inicializacion y parches de neutralidad
- `observability/` configuraciones de Prometheus/Grafana/Loki

