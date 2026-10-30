# CRM, post-evento y aprendizaje (Fase 5)

Todo sale de `profile.yaml` (`crm`, `integrations`, `learning`). Nada se envía a terceros: los mensajes de seguimiento son **borradores** que envía el usuario.

## 1. CRM simple

Dos pestañas, generadas por el script a partir de `events.json` y `people.json`:

| Pestaña | Contenido | Quién la edita |
|---|---|---|
| `Events` | Una fila por evento no `new`: fechas, tier, score, estado, deadline, resultado (rating, leads, reuniones, costo real) | Solo el script (los resultados entran con `outcome`) |
| `Contacts` | Una fila por persona: evento, prioridad, cargo, por qué, fuente pública + columnas de seguimiento | Script (datos) y **usuario** (columnas de seguimiento) |

Columnas del usuario en `Contacts`: `status`, `last_contact_date`, `followup_date`, `next_step`, `notes`. Estados: `to-contact → contacted → replied → meeting → opportunity → won | lost | no-response | not-relevant`.

```
node scripts/event-radar.mjs crm --events <data>/events.json --people <data>/dossiers/people.json \
  [--existing contacts-exportado-de-la-hoja.csv] --out-dir <data>/reports/crm
```

Genera `crm-events.csv`, `crm-contacts.csv` y `crm-sheet.json` (`{tabs: {Events: [[...]], Contacts: [[...]]}}`, filas listas para subir con una API de hojas).

- La clave de cada contacto es `event_id|nombre normalizado`. Con `--existing`, el script **conserva lo que el usuario escribió en la hoja** (estado, fechas, notas) y solo refresca los datos de investigación. Las filas que existen solo en la hoja (contactos que el usuario añadió) se mantienen.
- Sin `--existing`, `followup_date` se rellena si el evento está `attending`/`attended`: fin del evento + 2 días (A), 5 (B), 10 (C).

### Sincronizar con la hoja (según `crm.create_as` / `integrations.workspace`)

1. **Primera vez, Google Sheets:** crea una hoja nueva con las dos pestañas. Opciones, en orden: (a) conector de Drive/Sheets que permita crear (convierte el CSV a hoja); (b) si el conector solo edita, pide al usuario que cree una hoja vacía y te pase el enlace; (c) entrega los CSV y explica el import. **Pide confirmación antes de crear archivos en su Drive** y dile dónde quedó. Guarda la URL en `crm.sheet_url`.
2. **Siguientes veces:** lee la pestaña `Contacts` de la hoja → guárdala como CSV → `crm --existing …` → vuelve a escribir las dos pestañas con `crm-sheet.json`. Nunca sobrescribas sin haber leído primero la hoja.
3. **Otro CRM** (HubSpot, Notion, Airtable, Monday…): `connectors.md`. Usa `crm-contacts.csv` como fuente; mapea `company`, `name`, `title`, `status`, `notes`; no importes datos que no pasaron las reglas de `people-research-rules.md`.
4. Sin conector: los CSV abren en Excel/Sheets sin más.

## 2. Después del evento

Cuando el evento termina (o el usuario dice "ya fui a X" / "no fui"):

1. `post-event --events … --id <id> --people … --lang en --out <data>/reports/post-<id>.md` → lista de personas a seguir con fecha límite por prioridad y checklist.
2. Pregunta al usuario por **su** experiencia, no la inventes: ¿asististe?, valoración 1–5, leads, reuniones, oportunidades, costo real (y moneda), ¿volverías?, notas. Si no fue: ¿por qué (razón corta)?
3. `outcome --events … --id <id> --decision attended|skipped [--rating 1-5 --leads N --meetings N --opportunities N --cost-actual N --currency CAD --would-return yes|no --reason … --notes …]`. Pasa el estado a `attended`/`skipped` (a partir de ahí el score ya no lo toca y salen de los recordatorios).
4. Redacta **borradores** de seguimiento (uno por contacto A/B, tono del usuario, referencia concreta a la charla o conversación real). Muéstralos; no envíes nada sin aprobación expresa.
5. Actualiza el CRM (sección 1).

No marques a nadie como "contactado" ni "reunión" sin que el usuario lo diga.

## 3. Aprendizaje por feedback

```
node scripts/event-radar.mjs learn --events <data>/events.json --goal <objetivo #1> [--min-events 3]
```

Entrega: ROI por moneda (costo por lead y por reunión), series que le gustaron (`liked_arg`) y las que no, razones por las que descarta eventos, correlación de cada criterio con su valoración y **pesos sugeridos** (ajuste máximo ±5 puntos sobre el peso base, solo con ≥ `min_rated_events` eventos valorados con puntajes).

Reglas:
- **Es una propuesta.** Enséñasela al usuario con los números. Solo con su OK escribe `learning.liked_series` y `learning.weights_override` en el perfil y úsalos en los siguientes `score --liked … --weights …`.
- Con pocos datos, dilo: "aún no hay suficiente historial", y no toques los pesos.
- Correlación no es causalidad: con 3–5 eventos son indicios. Dilo.
- Si las razones de descarte se repiten (p. ej. "caro", "lejos"), sugiere ajustar filtros del perfil (presupuesto por tier, distancia) en vez de pesos.

## Calidad

- Los resultados son datos que da el usuario; cítalos tal cual.
- Costos reales y contactos son datos de negocio del usuario: viven en `<data>`, nunca en el repo.
- Respeta `people-research-rules.md` también en el CRM: guarda solo datos profesionales públicos y la fuente; borra a quien lo pida.
