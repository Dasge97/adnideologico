# Analitica y SQL operativo

## Aplicar patch de neutralidad

Ejecutar despues de `bd/init.sql`:

```bash
psql "$DATABASE_URL" -f bd/neutrality_patch.sql
```

## Endpoints de analitica disponibles

- `GET /api/analytics/summary`
- `GET /api/analytics/timeseries?days=30`
- `GET /api/analytics/consensus`
- `GET /api/analytics/combinations?limit=10`
- `GET /api/analytics/overview`

Todos agregan datos anonimos de sesiones con `finished_at` no nulo.
