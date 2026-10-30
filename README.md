# Event Radar

Plugin/skill de [Claude Code](https://claude.com/claude-code) que encuentra eventos relevantes para tu empresa (conferencias, ferias, charlas, meetups), los puntúa según tu perfil, te prepara para asistir y te recuerda los deadlines.

> Fuentes públicas únicamente. Nunca paga ni te registra. Funciona sin conectores.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Onboarding, perfil, preferencias de entrega / recordatorios / CRM / conectores | ✅ |
| 2 | Scan por tiers geográficos, scoring y reporte (md / csv → excel, word, correo) | ✅ |
| 3 | Deep-dive y briefing de expositores y asistentes (fuentes públicas) | ✅ |
| 4 | Recordatorios 6/3/1 meses, deadlines, calendario, digest y scan programado | ⏳ |
| 5 | CRM, post-evento, aprendizaje por feedback | ⏳ |

## Uso rápido

1. Instala el plugin (o copia `skills/event-radar` a tu carpeta de skills).
2. Pídele a Claude: **"configura mi Event Radar"**.
   - Opcional: responde el cuestionario en otro asistente con [el prompt externo](skills/event-radar/references/external-llm-prompt.md) y pega el YAML.
3. Pídele: **"busca eventos"**. Hace el scan, puntúa y entrega el reporte en el formato y el idioma que elegiste.

Tus datos (perfil, base de eventos, reportes) viven en `~/.event-radar/`, no en este repo.

## Cómo funciona el scoring

Siete criterios de 0 a 10 (alineación, audiencia, ponentes, credibilidad, costo, logística, timing), con pesos según tu objetivo #1. El modelo asigna los sub-puntajes **con evidencia y URL**; el cálculo es determinista en [`event-radar.mjs`](skills/event-radar/scripts/event-radar.mjs). Detalles en [scoring-rubric.md](skills/event-radar/references/scoring-rubric.md).

## Script

Node ≥ 18, sin dependencias:

```bash
node skills/event-radar/scripts/event-radar.mjs merge  --events events.json --incoming nuevos.json
node skills/event-radar/scripts/event-radar.mjs score  --events events.json --goal customers
node skills/event-radar/scripts/event-radar.mjs report --events events.json --min-score 60 --lang es --out reporte.md
node skills/event-radar/scripts/event-radar.mjs dossier --events events.json --id <event-id> --people people.json --out dossier.md
node skills/event-radar/scripts/event-radar.mjs contacts --people people.json --events events.json --min-priority B --out contactos.csv
```

Hay datos ficticios de prueba en [`examples/`](examples/incoming.example.json).

## Estructura

```
.claude-plugin/plugin.json
skills/event-radar/
├─ SKILL.md
├─ references/   cuestionario, prompt externo, conectores, fuentes, rúbrica, esquema, flujo de scan
├─ templates/    profile.template.yaml
└─ scripts/      event-radar.mjs
examples/        datos ficticios
```

## Principios

- **Públicas, no privadas:** nada de scraping de sesiones ni LinkedIn privado.
- **Sin pagos:** da el enlace y la fecha límite; tú te registras.
- **Sin invención:** lo no verificado se marca como tal, con fuente y fecha de consulta.
- **Neutral:** no asume ciudad, industria, idioma ni herramientas; todo sale del perfil.

## Licencia

MIT
