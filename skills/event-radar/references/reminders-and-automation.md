# Recordatorios y automatización (Fase 4)

Todo sale de `profile.yaml` (`reminders`, `scan`, `reports`) y del `status` de cada evento. Nada se envía a terceros: solo al propio usuario.

## Qué recordatorios se generan

| Quién | Cuándo | Fuente en el perfil |
|---|---|---|
| Eventos en seguimiento (`watching`, `deep-dive`, `attending`) | N meses antes del inicio | `reminders.offsets_months` (por defecto 6, 3, 1) |
| Todos los seguidos | N días antes | `reminders.extra_offsets_days` |
| **Solo `attending`** (registrado) | N días antes | `reminders.registered_only_offsets_days` (ej. 14, 7) |
| Deadline de registro (no aplica si ya está registrado) | 14 y 3 días antes y el mismo día | `reminders.deadline_alerts` |
| Deadline de call for speakers | 14 y 3 días antes y el mismo día | idem |
| Fin de cada tramo de precio (early-bird) | 14 y 3 días antes y el mismo día | idem |

Los recordatorios cuya fecha ya pasó **no se crean** (aunque el evento sea futuro). Si el usuario acaba de seguir un evento a 4 meses, el aviso de "6 meses" se omite, y debe decírsele.

## Comando del script (determinista)

```
node scripts/event-radar.mjs reminders --events <data>/events.json \
  --offsets-months 6,3,1 --registered-days 14,7 [--extra-days 30] [--deadline-days 14,3] \
  --window-days 60 --state <data>/sync-state.json [--mark-synced] [--out file.json]

node scripts/event-radar.mjs ics    --events <data>/events.json --registered-days 14,7 --out <data>/reports/reminders.ics
node scripts/event-radar.mjs digest --events <data>/events.json --window-days 60 --lang en --out <data>/reports/digest-YYYY-MM.md
```

- `--state` guarda qué recordatorios ya se crearon (clave `evento|tipo|offset|fecha`) para **no duplicar** en el calendario. Sin `--mark-synced` solo filtra; con él, marca como sincronizados los que devuelve.
- `ics` genera un calendario importable con los eventos seguidos y sus recordatorios (aviso a las 9:00 del día). Es el plan B si no hay conector de calendario.

## Sincronizar con Google Calendar (u Outlook)

1. Comprueba que el conector exista en la sesión (ToolSearch "calendar"). Si requiere autorización, dile al usuario que la haga él mismo desde `/mcp`; no pidas tokens.
2. `reminders --state ... ` → lista de pendientes.
3. Crea un evento de **día completo** por recordatorio (título `⏰ …`, descripción con URL y detalles) y los eventos reales (con su rango de fechas). Calendario destino: el configurado en `integrations.calendar`.
4. Tras confirmar que se crearon, vuelve a correr con `--mark-synced`.
5. Si el usuario cambia el estado de un evento (por ejemplo, `attending`) o la fecha cambia: vuelve a correr, crea los nuevos y **actualiza o borra** los obsoletos (busca por título/URL antes de borrar; confirma con el usuario si no estás seguro de cuáles son tuyos).
6. Sin conector: entrega el `.ics` y explica cómo importarlo.

El permiso del usuario de crear estos eventos en su propio calendario viene de `reminders.channels` en el onboarding; no hace falta pedirlo cada vez, pero sí **dile qué creaste**.

## Correo (reporte mensual + digest)

- Destino: `reports.email_to`. Contenido corto (top 5 con su "por qué", próximos deadlines y el digest "qué viene") + Excel adjunto (`report --format csv` convertido a .xlsx).
- Si `reminders.auto_send_to_self: true` y el destinatario es **exactamente** `reports.email_to` → puede enviarse sin pedir aprobación. Cualquier otro destinatario o cambio de contenido sensible: mostrar borrador primero.
- Conectores posibles: Gmail, el MCP de correo del usuario (por ejemplo `ero-mail`), Resend. Usa el que `integrations.email` indique y que esté disponible.
- Si no hay conector que pueda enviar: deja el reporte en `delivery_folder` y avísalo.

## Scan programado

Cadencia: `scan.frequency` y `scan.day_and_time` (ej. "first Monday, 08:00", zona `scan.timezone`).

Prompt para la tarea programada (adáptalo al usuario):

```
Run Event Radar's monthly scan. Read ~/.event-radar/profile.yaml and follow skills/event-radar/references/scan-workflow.md.
Do not change event statuses the user set. When finished:
1) generate report (language from profile) and the CSV -> xlsx,
2) generate digest, 3) sync new reminders to the calendar (reminders-and-automation.md),
4) email the short report + attachment to reports.email_to (auto_send_to_self applies),
5) append a line to ~/.event-radar/run-log.md with date, events added, errors.
If a step fails, continue with the rest and report the failure in the email.
```

Opciones para programarlo (propón la que exista en la sesión; **pide confirmación antes de crear una tarea persistente**, porque queda corriendo en el equipo o en la nube del usuario):

1. Herramienta de tareas programadas de la sesión (`scheduled-tasks` / routines). Si la tarea corre local, el equipo debe estar encendido a esa hora.
2. Cron o Task Scheduler del sistema invocando `claude -p "<prompt>"`.
3. Sin automatización: el usuario dice "corre el scan de este mes".

Regla del primer lunes: si el mes empieza en lunes-festivo o el equipo estaba apagado, la ejecución se pospone al siguiente arranque; registra el retraso en `run-log.md`.

## Resumen "qué viene"

El `digest` entra en el correo mensual (`reminders.digest_frequency: monthly`). Si el usuario eligió otra frecuencia, programa una tarea aparte con solo `reminders` + `digest`.

## Calidad

- Antes de crear algo en calendario o enviar un correo, verifica fechas en `events.json` (si `last_checked` tiene más de 30 días, vuelve a comprobar la página del evento).
- Avisa siempre cuando un deadline cambie o un evento se cancele.
- Zona horaria del perfil para cualquier hora; los eventos de día completo no tienen hora.
