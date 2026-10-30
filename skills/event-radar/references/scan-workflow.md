# Flujo del scan (4 fases con el usuario)

Requisito: `profile.yaml` con `onboarding_completed: true`. Si no, ofrece el onboarding y no hagas el scan.

**Principios**
- **El presupuesto nunca descarta un evento**, solo es un aliciente (peso bajo en el puntaje) y una nota de "estiramiento" en el reporte. El usuario decide si hace el esfuerzo.
- **Siempre incluye webinars y eventos online** (`format: webinar`, `online: true`), aunque el perfil no lo pida. Van en su propio grupo.
- El usuario filtra entre fases. Cada fase termina esperando su respuesta; no avances sola salvo en un scan programado, que se detiene en la Fase 1 o la 3 y deja el resultado.
- Primera ejecución: avisa que puede tardar.

```
Fase 1  Lista larga      todo lo que pueda encajar          status: new
Fase 2  Preselección     el usuario elige los que le interesan   → shortlisted
Fase 3  Valoración       costos, asistentes, ponentes, historial → score   → candidate
Fase 4  Selección final  el usuario elige a quién seguir          → watching / deep-dive
        Análisis a fondo (deep-dive-workflow.md)
```

## Fase 1 — Lista larga (todo lo que exista y pueda hacer match)

1. Lee el perfil. Fecha de hoy. Ventana: hoy → hoy + `scan.horizon_months`. Carga `events.json` (o créalo con `schema_version: 1`).
2. Construye consultas por tier con `sources.md` (temas, industrias objetivo, tiers, idiomas, `scan.sources_extra`) **más** una pasada propia de webinars/online.
3. Descubre con búsquedas independientes en paralelo; reparte por tier en subagentes si son muchas. **Sé amplia**: incluye todo lo plausible aunque sea caro, lejano, o de encaje parcial. Descarta solo lo pasado, fuera de ventana, en `topics.exclude` o claramente ajeno.
4. Para cada candidato anota lo mínimo: nombre, URL, fechas, lugar (o `online: true`), formato, tier, y un **encaje rápido** `match: high|medium|low` con `match_reason` de una línea. No hace falta abrir la página oficial todavía.
5. Escríbelos en `incoming.json` y ejecuta:
   ```
   node scripts/event-radar.mjs merge --events <data>/events.json --incoming incoming.json
   node scripts/event-radar.mjs longlist --events <data>/events.json --lang <reports.language> --out <data>/reports/<YYYY-MM-DD>-longlist.md
   ```
6. Muestra la lista larga agrupada (Online / Tier 1 / 2 / 3 / 4) con su encaje. Cuenta cuántos hay y qué fuentes fallaron.

## Fase 2 — Preselección (el usuario)

Pregunta: "¿cuáles te interesan realmente?" (por id o nombre). Con su respuesta:
```
node scripts/event-radar.mjs status --events <data>/events.json --ids id1,id2 --set shortlisted
node scripts/event-radar.mjs status --events <data>/events.json --ids id3,id4 --set skipped
```
Lo que no mencione queda en `new`, no se pierde. Si pide más como los elegidos, vuelve a la Fase 1 con esa orientación.

## Fase 3 — Búsqueda profunda y valoración (solo los `shortlisted`)

1. Verifica cada uno en la página oficial: fechas, venue, precios con fecha límite, organizador, ediciones, asistencia, expositores y ponentes, deadlines, call for speakers. `last_checked` y URL en cada dato; lo no verificable va a `unverified`.
2. Estima el costo total (entrada + vuelo + hotel + comidas + traslado según `budget.covers`), rotulado como estimación. Compáralo con el tope del tier **solo para informar**.
3. Asigna sub-puntajes 0–10 con evidencia (`scoring-rubric.md`), actualiza el `incoming.json` con `scores`, `evidence`, `cost_estimate`, y ejecuta:
   ```
   node scripts/event-radar.mjs merge  --events <data>/events.json --incoming incoming.json
   node scripts/event-radar.mjs score  --events <data>/events.json --goal <objetivo #1> [--liked "..."] [--weights '{...}']
   node scripts/event-radar.mjs report --events <data>/events.json --lang <reports.language> --caps '{"1":150,"2":600,"3":1200,"4":2500}' --out <data>/reports/<YYYY-MM-DD>.md
   ```
   (`--caps` sale de `budget.per_event_max_by_tier`; solo añade la nota "por encima del tope".)
4. Revisa los `watching`/`deep-dive`/`attending`: re-verifica fecha, precio y deadlines y avisa los cambios (`changed_fields` del merge).
5. Entrega en el formato de `reports.deliverable` (`email` corto + Excel: `report --format csv` → .xlsx). El correo automático a su propia dirección sigue las reglas de `reminders-and-automation.md`.

## Fase 4 — Selección final y análisis a fondo

Pregunta cuáles quiere seguir (`watching`) y cuáles analizar a fondo (`deep-dive`):
```
node scripts/event-radar.mjs status --events <data>/events.json --ids ... --set watching|deep-dive
```
Para `deep-dive` sigue `deep-dive-workflow.md`. Aquí el presupuesto tampoco limita: si es caro, dilo y deja la decisión al usuario. Los recordatorios (Fase 4 del plugin) se crean para los seguidos.

## Reglas

- No marques un evento como "recomendado" con datos inventados. Mejor una lista corta y verificada que una larga y dudosa; pero la **lista larga de la Fase 1 sí debe ser amplia**, porque es explícitamente un catálogo para elegir.
- Si una fuente falla o no es accesible, dilo; no la ocultes.
- Un scan programado corre la Fase 1 (y la 3 sobre lo ya `shortlisted`/`watching`) sin interacción: no cambia estados decididos por el usuario y deja el resultado en el canal configurado.
- Si el usuario pide "ranking" directo sin pasar por fases, explica en una línea que pasan por la preselección y ofrece saltar a la Fase 3 con los que él indique.
