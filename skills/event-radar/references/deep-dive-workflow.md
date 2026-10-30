# Flujo de deep-dive y briefing

Se activa cuando el usuario marca un evento como `deep-dive` (o lo pide explícitamente). Objetivo: que llegue al evento sabiendo quién estará, a quién abordar, qué decir y cuánto le costará, "como si los conociera".

Requisitos: perfil completo y el evento en `events.json`. Si el evento no está verificado en su página oficial, empieza por verificarlo (`sources.md`).

## Pasos

1. **Inteligencia del evento** (fuentes oficiales): agenda/sesiones, lista de expositores, ponentes, patrocinadores, ediciones anteriores (asistencia, perfil de asistentes, galerías, reseñas), precios y deadlines, hotel/bloque, sede y transporte. Registra URL y fecha de consulta de cada dato.
2. **Mapa de personas candidatas.** Reúne todos los nombres públicos de ponentes, expositores y organizadores. Si son más de 40, prioriza por relevancia antes de investigar.
3. **Puntaje de relevancia (0–10) por persona**, con estos pesos orientativos:
   - Cargo coincide con `audience.roles_to_meet`: hasta 4.
   - Empresa en `companies_to_meet` o en `target_industries` y tamaño ≈ `ideal_customer`: hasta 3.
   - Probabilidad de ser decisor/influyente en compras de lo que ofrece el usuario: hasta 2.
   - Potencial como conector (organizador, moderador, ponente de panel donde el usuario podría participar): hasta 1.
   Prioridad: **A** ≥ 8, **B** 6–7, **C** < 6.
4. **Investigar a las prioridades A y B** (por defecto máx. 20 personas; el usuario puede pedir más). Sigue `people-research-rules.md`. Para cada una completa la ficha (`templates/person-card.template.md`).
5. **Quién dijo que va.** Busca en fuentes públicas menciones del tipo "nos vemos en <evento>", "speaking at", "exhibiting", y la propia lista de ponentes/expositores del evento. Registra cada mención con su URL. **Nunca inventes asistentes.** Si no encuentras confirmación, la persona es "candidata", no "confirmada".
6. **Empresas expositoras y patrocinadoras**: por cada una relevante, ficha corta: qué hace, tamaño, por qué encaja con el usuario (cliente / aliado / competidor / referencia), y qué decirle.
7. **Plan de ataque:**
   - Sesiones a las que ir (y a cuáles no), con horarios.
   - Lista objetivo de 5–10 personas con una frase de apertura personalizada y una pregunta útil cada una.
   - Pitch del usuario en 30 segundos, adaptado al evento, usando `company.what_we_do` y `audience.ideal_customer` (retainers/relación a largo plazo si aplica). No inventes casos de éxito ni cifras del usuario: si falta evidencia, usa marcadores `[COMPLETAR: caso real]`.
   - Oportunidad de hablar: si hay call for speakers o paneles y el objetivo `brand` está en el perfil, propón tema, formato y deadline.
8. **Logística y presupuesto.** Costo total estimado (rango) vs. el tope por tier del perfil; viaje, hospedaje, traslado, días fuera. Marca lo estimado como estimado. Considera `geography.minimize_travel` y sugiere alternativas (solo 1 día, online, ir con otro evento).
9. **Recomendación go / no-go / go-condicional** con 3 razones y los riesgos principales.
10. **Seguimiento posterior:** borrador de mensaje de seguimiento genérico (en `reports.language` o el idioma del contacto, solo borradores; **no se envía nada a terceros**).
11. **Guardar:**
    - `dossiers/<id>.md` (plantilla `templates/dossier.template.md`; el script `dossier` genera el esqueleto).
    - `dossiers/<id>.people.json` con las personas (esquema abajo). El comando `contacts` genera el CSV listo para el CRM.
    - Actualiza `events.json`: `status: "deep-dive"` y `dossier_path`. No cambies a `attending` hasta que el usuario diga que se registró.

## Esquema `people.json`

```json
[
  {
    "event_id": "example-retail-expo-2027",
    "name": "Nombre Apellido",
    "title": "VP Operations",
    "company": "Empresa",
    "role_in_event": "speaker | exhibitor | sponsor | organizer | attendee_public",
    "confirmed": true,
    "confirmation_source": "https://...",
    "relevance": 9,
    "priority": "A",
    "why": "Decide compras de tecnología en retail; coincide con roles_to_meet",
    "opener": "Frase de apertura",
    "question": "Pregunta útil",
    "linkedin_url": "https://... (si es público y fue hallado en búsqueda)",
    "sources": ["https://..."],
    "last_checked": "2026-10-29"
  }
]
```

## Calidad

- Cada afirmación sobre una persona lleva fuente. Sin fuente: no la incluyas.
- Etiqueta **confirmada / candidata / sin confirmar** y **fecha de consulta**.
- Mejor 12 fichas verificadas que 30 con datos dudosos.
- Si el evento es online/webinar: adapta (asistentes no visibles; céntrate en ponentes, moderadores, preguntas en vivo y chat).
