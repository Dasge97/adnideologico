# AI Analysis (Ollama) - Preparado

## Objetivo

Generar narrativa personalizada a partir de un contexto controlado de respuestas y scores,
sin recomendaciones partidistas ni sesgos de persuasion.

## Servicio en Docker

El `docker-compose.yml` incluye:

- `ollama` en `http://localhost:11434`
- `backend` configurado para usar `OLLAMA_BASE_URL=http://ollama:11434`

## Descargar modelo (primer uso)

Con el stack levantado:

```bash
docker compose up -d ollama

docker exec -it adn_ideologico_ollama ollama pull qwen2.5:7b-instruct
```

Opcionalmente puedes cambiar el modelo en `docker-compose.yml` y `backend/.env.example`.

## Endpoint backend preparado

`POST /api/ai-analysis`

Body:

```json
{
  "session_id": "uuid"
}
```

Comportamiento:

- valida UUID y que la sesion exista y este finalizada,
- construye `controlled_context` (reglas + ejes + señales fuertes),
- llama a Ollama,
- devuelve JSON narrativo saneado,
- si Ollama falla, devuelve `analysis.source = "fallback"` con `warning`.

## Variables de entorno relevantes

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_MS`
- `OLLAMA_NUM_PREDICT`

Recomendado en CPU: `OLLAMA_TIMEOUT_MS=120000`.
Para evitar truncado de JSON en salida larga: `OLLAMA_NUM_PREDICT=900`.

## Nota de seguridad narrativa

La IA recibe reglas explicitas de neutralidad y prohibiciones (no recomendar voto, no moralizar).
El scoring numerico sigue siendo determinista en backend; la IA solo redacta narrativa.
