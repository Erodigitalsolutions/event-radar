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
- `status`: `new → candidate → watching → deep-dive → attending`; o `filtered | skipped | cancelled`.
  - `new`: recién descubierto, sin puntuar.
  - `candidate`: puntuado por el script.
  - `watching`/`deep-dive`/`attending`/`skipped`: decisiones del usuario. **No los cambies tú sin que él lo diga.**
  - `filtered`: descartado por filtro duro (`filtered_reason`).
- `confidence`: `high` (página oficial del organizador) | `medium` | `low` (solo agregador).
- `scores`: 0–10 por criterio de `scoring-rubric.md`. `null` si no se evaluó.
- `evidence[k]`: justificación corta + URL. Sin evidencia no se sube de 5.
- `unverified`: claves de criterio o campos que no se pudieron comprobar.
- Campos que escribe el **script** (no a mano): `score`, `label`, `score_notes`, `status` (new→candidate / filtered por pasado).

## Qué hace cada comando del script

`scripts/event-radar.mjs`:

| Comando | Qué hace |
|---|---|
| `merge --events events.json --incoming nuevos.json` | Une eventos nuevos sin duplicar (por URL o nombre+año). No pisa `status`, `scores`, `evidence` ni `first_seen`. Reporta cambios de fecha/lugar/deadline. |
| `score --events events.json --goal <objetivo> [--weights JSON] [--liked "A,B"]` | Calcula `score` y `label`. Descarta eventos pasados. Aplica penalizaciones/bonus de la rúbrica. |
| `report --events events.json --min-score 60 --format md\|csv --lang es\|en --out archivo` | Genera el reporte. Para otros idiomas: genera en `en` o `es` y traduce el contenido. |
| `dossier --events events.json --id <id> [--people people.json] [--lang en\|es] [--out file]` | Esqueleto del briefing con datos del evento y personas; lo demás queda como "TO COMPLETE" para que lo rellene la investigación. |
| `contacts --people people.json [--events events.json] [--min-priority A\|B\|C] [--out file.csv]` | CSV de contactos ordenado por prioridad, listo para el CRM. |

Los reportes en Excel/Word/PDF se producen a partir del CSV/Markdown con las herramientas de documentos disponibles.
