# Entrega y sincronización (se ejecuta sola al cerrar cada fase)

Cada vez que termina una fase del scan que produce algo para el usuario (Fase 3 valoración, Fase 4 selección, y cualquier scan programado), **la entrega no es opcional**: se ejecuta este flujo completo. Lo que el usuario autorizó en el onboarding (`automation.*` en `profile.yaml`) se hace sin volver a preguntar; lo demás, se confirma una vez.

## Paso A · Generar el paquete (siempre)

```
node scripts/event-radar.mjs export --events <data>/events.json [--people <data>/dossiers/people.json] \
  [--existing <contacts-exportados-de-la-hoja.csv>] --out-dir <data>/reports/package \
  --lang <reports.language> --caps '<budget.per_event_max_by_tier como JSON>' [--registered-days 14,7]
```

Genera en `--out-dir`:

| Archivo | Contenido |
|---|---|
| `event-radar.xlsx` | Libro de Excel con las pestañas **Events** (todos los eventos y su estado), **Prices** (cada tramo de precio con fecha límite y días restantes + costo total estimado), **Timeline** (eventos, deadlines y recordatorios ordenados por fecha), **Scores** (7 criterios + evidencia), **Contacts** (si hay personas). Abre en Excel y se convierte en Google Sheets al subirlo a Drive. |
| `crm-sheet.json`, `crm-*.csv` | Las mismas pestañas como filas, para escribir en una hoja existente con un conector de hojas. |
| `report.md`, `report.csv` | Reporte de los valorados, en el idioma del perfil. |
| `reminders.ics` | Calendario importable (plan B si no hay conector de calendario). |
| `digest.md` | Resumen "qué viene". |

## Paso B · Hoja de cálculo (CRM) — `automation.sheet`

1. Si `crm.sheet_id` existe → **actualiza** esa hoja:
   - Primero **lee** la pestaña `Contacts` (el usuario escribe ahí estado, notas y fechas) y guárdala como CSV; vuelve a ejecutar `export --existing <ese csv>` para conservarlas.
   - Reescribe `Events`, `Prices`, `Timeline` y `Scores` completas con `crm-sheet.json` (borra el rango antes) y `Contacts` con el resultado fusionado. Nunca pises `Contacts` sin haberlo leído.
2. Si no existe y `automation.sheet` es `create` (o el usuario dijo "crea uno" en el onboarding) → **créala**, en este orden:
   a. Conector de Drive/Sheets que cree archivos: sube `event-radar.xlsx` convirtiéndolo a hoja de Google (tipo `application/vnd.google-apps.spreadsheet`).
   b. Si el conector solo edita: pide al usuario que cree una hoja vacía y te pase el enlace; llénala con `crm-sheet.json`.
   c. Sin conector: deja `event-radar.xlsx` en `reports.delivery_folder` y explica cómo subirlo (Drive → Nuevo → Subir archivo → abrir con Hojas de cálculo).
   Guarda `crm.sheet_url` y `crm.sheet_id` en el perfil y dile al usuario dónde quedó.
3. Otro CRM (HubSpot, Notion, Airtable…): usa `crm-contacts.csv`/`crm-events.csv` según `connectors.md`.

## Paso C · Calendario y recordatorios — `automation.calendar`

Solo para eventos seguidos (`watching`, `deep-dive`, `attending`), según `reminders.*` del perfil.

1. `node scripts/event-radar.mjs reminders --events … --registered-days … --state <data>/sync-state.json` → pendientes sin duplicar.
2. Crea con el conector de calendario un evento de **día completo** por recordatorio (título `⏰ …`, descripción con URL y detalles) y el evento real con su rango de fechas, en `integrations.calendar`.
3. Vuelve a ejecutar con `--mark-synced`. Si un evento cambia de estado o fecha, actualiza o borra los obsoletos (busca por título/URL; confirma si no estás seguro de que son tuyos).
4. Sin conector: entrega `reminders.ics` e instrucciones de importación.

## Paso D · Correo — `automation.email`

**Orden de preferencia para enviar:** (1) el conector de correo del propio usuario (Gmail, Outlook, su MCP de correo); (2) si no tiene ninguno, el **servicio de correo de Event Radar** (`reports.email_via: relay`; la dirección del servicio ya viene incluida, no hace falta `--relay-url`), descrito abajo; (3) archivos en `delivery_folder`.

### Servicio de correo de Event Radar (sin conector de correo)
Usuarios sin conector reciben su reporte en su correo mediante un servicio pequeño del autor del plugin (`relay/`). Antes de usarlo, **explícale en palabras simples y pide su OK**: "Para enviarte el reporte por correo sin que conectes nada, el correo pasa por un servidor del autor de Event Radar y sale con su cuenta de Resend. Solo se envía a tu propia dirección, no se guarda el contenido en ese servidor (el proveedor de correo conserva un registro del envío) y puedes darte de baja cuando quieras."

1. **Registro (una vez):** `node scripts/event-radar.mjs relay-register --email <su correo>`. Le llega un correo de confirmación; al hacer clic ve su **clave personal**. Pídele que te la pegue y guárdala en `reports.relay_key` (junto con `reports.relay_url` y `reports.email_via: relay`). Nunca imprimas la clave en reportes ni la pongas en el repo.
2. **Envío:** `node scripts/event-radar.mjs relay-send --email <su correo> --key <clave> --subject "…" --text-file <data>/reports/package/digest.md --attach <data>/reports/package/event-radar.xlsx,<data>/reports/package/report.md`. Solo llega a su propia dirección; límite de 30 correos al día y adjuntos de hasta 3 MB (xlsx, csv, md, txt, ics, pdf, json).
3. Si falla (clave inválida, dado de baja, límite), díselo y deja los archivos en `delivery_folder`.
4. Cada correo incluye un enlace para darse de baja. Si el usuario lo pide en el chat, explícale que use ese enlace o que vuelva a registrarse para reactivar.

### Reglas generales de correo
Correo corto al propio usuario (`reports.email_to`): top 5 con su "por qué", próximos deadlines (del `Timeline`), digest y adjuntos (`event-radar.xlsx` y `report.md`, o el enlace a la hoja). Si `reminders.auto_send_to_self` es `true` y el destinatario es **exactamente** `reports.email_to` → se envía sin pedir aprobación. Cualquier otro destinatario, o un cambio de contenido sensible: muestra el borrador primero. Sin conector de correo: deja los archivos en `delivery_folder` y avísalo.

## Paso E · Registro y resumen

- Añade una línea a `<data>/run-log.md`: fecha, fase, qué se creó o actualizó, errores.
- Dile al usuario **qué hiciste y dónde** (enlace de la hoja, cuántos recordatorios creaste, a quién se envió el correo) y qué quedó pendiente por falta de conector o permiso.
- Si un paso falla, continúa con los demás y repórtalo; no lo escondas.

## Qué fase dispara qué

| Fase | A · paquete | B · hoja | C · calendario | D · correo |
|---|---|---|---|---|
| 1 Lista larga | sí | sí (queda en `Events`) | no | solo si es scan programado |
| 3 Valoración | sí | sí | no | sí |
| 4 Selección / cada cambio de estado | sí | sí | sí | opcional |
| Scan programado | sí | sí | sí (nuevos seguidos) | sí |
| Post-evento (`outcome`) | sí | sí | no | no |

## Autorizaciones (`automation` en el perfil)

El onboarding (Bloque 11) pregunta una vez y lo guarda: `sheet` (`create` | `update_only` | `off`), `calendar` (`on` | `off`), `email` (`self_only` | `ask` | `off`). Si el usuario nunca respondió, trata cada valor como `ask`: pregunta una vez, con lo que vas a crear, y guarda la respuesta.
