# Flujo del scan

Requisito: `profile.yaml` con `onboarding_completed: true`. Si no, ofrece el onboarding y no hagas el scan.

## Pasos

1. **Preparar.** Lee el perfil. Fecha de hoy. Ventana: hoy → hoy + `scan.horizon_months`. Carga `events.json` (o créalo con `schema_version: 1`).
2. **Construir consultas** por tier con `sources.md` (temas, industria, competidores, tiers, idiomas, `scan.sources_extra`).
3. **Descubrir.** Búsquedas web independientes en paralelo; si hay muchas, reparte por tier en subagentes. Reúne candidatos con nombre, URL, fecha, ciudad.
4. **Filtro rápido** (sin abrir páginas oficiales): fuera lo pasado, fuera de ventana, en `topics.exclude`, o claramente irrelevante.
5. **Verificar** cada candidato restante en la página oficial: fechas, venue, precios con fechas límite, organizador, ediciones, expositores/ponentes, deadlines. Registra URL y `last_checked`. Lo que no puedas verificar va a `unverified`.
6. **Asignar sub-puntajes** 0–10 con evidencia (`scoring-rubric.md`). Costo total estimado según tier, `budget` y `preferences.travel_style`; vuelo/hotel/comidas rotulados como estimación.
7. **Escribir** los candidatos en un archivo temporal `incoming.json` y ejecutar:
   ```
   node scripts/event-radar.mjs merge  --events <data>/events.json --incoming incoming.json
   node scripts/event-radar.mjs score  --events <data>/events.json --goal <objetivo #1> [--liked "..."] [--weights '{...}']
   node scripts/event-radar.mjs report --events <data>/events.json --min-score <scan.min_score_to_report> --lang <reports.language> --format md --out <data>/reports/<YYYY-MM-DD>.md
   ```
   (`merge` conserva lo que el usuario ya decidió; `score` recalcula todo.)
8. **Revisar `watching` / `deep-dive` / `attending`:** vuelve a verificar fecha, precio y deadlines, y avisa los cambios (el `merge` los reporta en `changed_fields`).
9. **Entregar** en el formato de `reports.deliverable`:
   - `markdown`: el reporte tal cual.
   - `excel`: `report --format csv` → convertir a .xlsx con la herramienta de hojas de cálculo disponible.
   - `word` / `pdf`: a partir del Markdown con las herramientas de documentos disponibles.
   - `email`: resumen corto (top 5 + deadlines) con el reporte adjunto o enlazado; **mostrar el borrador y esperar la aprobación del usuario** salvo que el onboarding haya autorizado el envío automático a su propio correo.
   - `slack` / `notion` / `monday`: solo si el conector existe y el usuario lo configuró; si no, cae a archivo.
10. **Resumen final al usuario** en `reports.language`: cuántos eventos nuevos, cuántos pasaron el umbral, el top 3 con una línea de "por qué", deadlines de los próximos 30 días y qué quedó sin verificar.
11. **Pregunta de selección:** "¿cuáles quieres seguir (`watching`) o analizar a fondo (`deep-dive`)?" Actualiza el `status` solo según lo que responda.

## Reglas

- No marques un evento como "recomendado" con datos inventados. Preferible un reporte corto y verificado que uno largo y dudoso.
- Si una fuente falla o no es accesible, dilo en el resumen; no la ocultes.
- Un scan programado (`scan.frequency`) corre estos mismos pasos sin interacción: no cambia `status` decididos por el usuario y deja el reporte en archivo/canal configurado. La automatización llega en la Fase 4.
- Primera ejecución: avisa que puede tardar, y limita la profundización a los 15–20 mejores candidatos.
