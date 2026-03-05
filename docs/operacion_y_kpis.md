# Operacion continua ADN Ideologico

## KPIs base

- `test_start_rate`: sesiones iniciadas / visitas landing.
- `test_completion_rate`: sesiones finalizadas / sesiones iniciadas.
- `share_rate`: usuarios que abren share / sesiones finalizadas.
- `feedback_rate`: feedback enviado / sesiones finalizadas.
- `return_rate_7d`: sesiones con mismo hash anonimo en 7 dias.
- `error_save_answer_rate`: errores en guardado de respuesta / respuestas enviadas.
- `error_finish_rate`: errores en /api/finish / finalizaciones intentadas.

## Backlog priorizado (impacto/esfuerzo)

1. Alta impacto / bajo esfuerzo
- Publicar panel colectivo en landing con CTA.
- Añadir instrumentacion de eventos cliente-servidor.
- Aplicar `bd/neutrality_patch.sql` en todos los entornos.

2. Alta impacto / esfuerzo medio
- Mejorar copy de combinaciones con aprendizaje de feedback real.
- Expandir share card con variantes por red social.
- Añadir pagina de metodologia de scoring.

3. Impacto medio / esfuerzo medio
- Exportar datos anonimizados agregados para analisis externo.
- A/B test de copy en landing y resultados.
- Alertas de salud de backend y DB.

## Ciclo de releases sugerido

- Cadencia quincenal.
- Fase 1 (dia 1-2): refinamiento backlog y definicion de alcance.
- Fase 2 (dia 3-8): desarrollo + pruebas unitarias + E2E criticos.
- Fase 3 (dia 9-10): QA funcional y a11y.
- Fase 4 (dia 11): release y monitoreo de KPIs 24h.
- Fase 5 (dia 12-14): retro y ajuste de backlog.

## Criterios de salida por release

- Build frontend y tests backend en verde.
- Endpoints criticos (`/api/questions`, `/api/answer`, `/api/finish`, `/api/analytics/overview`) operativos.
- Sin regresiones en flujo principal: iniciar, responder, finalizar, compartir, feedback.
- KPIs e incidencias documentados 24h despues del despliegue.
