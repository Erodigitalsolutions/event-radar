# Esquema de `events.json`

```json
{
  "schema_version": 1,
  "events": [
    {
      "id": "example-expo-2027",
      "name": "Example Expo",
      "url": "https://organizer.example/expo",
      "start_date": "2027-03-10",
      "end_date": "2027-03-12",
      "city": "Ciudad",
      "country": "País",
      "venue": "Centro de Convenciones",
      "tier": 1,
      "format": "expo",
      "organizer": "Organizador S.A.",
      "editions": 8,
      "description": "Una línea",
      "status": "new",
      "confidence": "high",
      "prices": [
        { "label": "Early-bird", "amount": 199, "currency": "USD", "until": "2027-01-15" },
        { "label": "Regular", "amount": 299, "currency": "USD", "until": "2027-03-01" }
      ],
      "registration_deadline": "2027-03-01",
      "call_for_speakers_deadline": null,
      "cost_estimate": { "currency": "USD", "min": 199, "max": 450, "price_known": true },
      "scores": { "fit": 8, "audience": 7, "people": 6, "credibility": 9, "cost": 8, "logistics": 10, "timing": 7 },
      "evidence": {
        "fit": { "note": "Tema central coincide con el objetivo #1", "url": "https://organizer.example/expo/about" }
      },
      "unverified": [],
      "sources": ["https://organizer.example/expo"],
      "first_seen": "2026-10-29",
      "last_checked": "2026-10-29"
    }
  ]
}
```

## Campos

- `tier`: 1 a 4 (los eventos online suelen ir en el tier 1 si el usuario así lo define), según `geography` del perfil.
- `format`: `expo | conference | meetup | workshop | talk | summit | webinar | other`.
- `status`: `new → shortlisted → candidate → watching → deep-dive → attending → attended`; o `filtered | skipped | cancelled`.
  - `new`: en la lista larga (Fase 1), sin puntuar.
  - `shortlisted`: el usuario lo preseleccionó (Fase 2).
  - `candidate`: valorado y puntuado por el script (Fase 3), esperando la selección final.
  - `watching`/`deep-dive`/`attending`/`skipped`/`attended`: decisiones del usuario (`attended`/`skipped` los fija `outcome`). **No los cambies tú sin que él lo diga.**
  - `filtered`: descartado por filtro duro (`filtered_reason`).
- `online`: `true` para webinars y eventos virtuales (se agrupan aparte en `longlist`). `match`: `high|medium|low` y `match_reason`: encaje rápido de la Fase 1.
- `confidence`: `high` (página oficial del organizador) | `medium` | `low` (solo agregador).
- `scores`: 0–10 por criterio de `scoring-rubric.md`. `null` si no se evaluó.
- `evidence[k]`: justificación corta + URL. Sin evidencia no se sube de 5.
- `unverified`: claves de criterio o campos que no se pudieron comprobar.
- `outcome` (lo escribe `outcome`, datos del usuario): `{decision, rating 1-5, leads, meetings, opportunities, cost_actual, currency, would_return, reason, notes, recorded_at}`.
- Campos que escribe el **script** (no a mano): `score`, `label`, `score_notes`, `status` (new→candidate / filtered por pasado).

## Qué hace cada comando del script

`scripts/event-radar.mjs`:

| Comando | Qué hace |
|---|---|
| `merge --events events.json --incoming nuevos.json` | Une eventos nuevos sin duplicar (por URL o nombre+año). No pisa `status`, `scores`, `evidence` ni `first_seen`. Reporta cambios de fecha/lugar/deadline. |
| `longlist --events events.json [--status new,shortlisted] [--lang] [--format md|csv] [--out f]` | Lista larga agrupada (Online / Tier 1..4) con encaje; base de la preselección. |
| `status --events events.json --ids a,b --set <estado>` | Cambia el estado de varios eventos (preselección, seguir, descartar). |
| `score --events events.json --goal <objetivo> [--weights JSON] [--liked "A,B"]` | Calcula `score` y `label` (pasa `new`/`shortlisted` con scores a `candidate`). Descarta eventos pasados. Aplica penalizaciones/bonus de la rúbrica. |
| `report --events events.json [--min-score 0] [--caps '{"1":150}'] --format md|csv --lang es|en --out archivo` | Reporte de todos los valorados (`--caps` solo añade la nota de estiramiento). Para otros idiomas: genera en `en` o `es` y traduce. |
| `dossier --events events.json --id <id> [--people people.json] [--lang en\|es] [--out file]` | Esqueleto del briefing con datos del evento y personas; lo demás queda como "TO COMPLETE" para que lo rellene la investigación. |
| `contacts --people people.json [--events events.json] [--min-priority A\|B\|C] [--out file.csv]` | CSV de contactos ordenado por prioridad, listo para el CRM. |
| `reminders --events events.json [--offsets-months 6,3,1] [--registered-days 14,7] [--extra-days N] [--deadline-days 14,3] [--window-days N] [--state f --mark-synced]` | Lista los recordatorios y alertas de deadline de eventos seguidos, sin duplicar los ya sincronizados. |
| `ics --events events.json --out file.ics` | Calendario importable con eventos seguidos y recordatorios. |
| `crm --events events.json --people people.json [--existing hoja.csv] [--out-dir d]` | Genera pestañas `Events` y `Contacts` (CSV + `crm-sheet.json`). Con `--existing` conserva lo que el usuario editó en la hoja. |
| `outcome --events events.json --id <id> --decision attended|skipped [--rating --leads --meetings --opportunities --cost-actual --currency --would-return --reason --notes]` | Registra el resultado del usuario y pasa el evento a `attended`/`skipped`. |
| `post-event --events events.json --id <id> [--people f] [--lang] [--out f]` | Checklist post-evento y contactos a seguir con fecha límite por prioridad. |
| `learn --events events.json [--goal g] [--min-events 3] [--out f]` | ROI, series que gustaron, razones de descarte y pesos sugeridos (solo propuesta). |
| `digest --events events.json [--window-days 60] [--lang en\|es] [--out file.md]` | Resumen "qué viene". |

Los reportes en Excel/Word/PDF se producen a partir del CSV/Markdown con las herramientas de documentos disponibles.
