# Cuestionario de onboarding

Reglas de conducción:
- Haz las preguntas por bloques, **máximo 4 por mensaje**. No sueltes todo de golpe.
- Habla en el idioma del usuario (detéctalo del primer mensaje; confírmalo en el Bloque 0).
- Si el usuario pegó la respuesta de su LLM externo (ver `external-llm-prompt.md`), **no repitas** lo ya contestado: muestra un resumen, pide corregir lo dudoso y pregunta solo lo que quedó en `null`.
- Nunca inventes datos. Si algo no está claro, deja `null` y anótalo en "pendientes".
- Al terminar cada bloque, guarda en `profile.yaml` (no esperes al final).
- Cierra con un resumen completo del perfil y pide confirmación antes de marcar el onboarding como terminado.

## Bloque 0 · Arranque
1. ¿En qué idioma prefieres que hablemos y en cuál quieres los **resúmenes/reportes**? (pueden ser distintos)
2. ¿Prefieres responder aquí paso a paso, o pegar la respuesta de otro asistente (ChatGPT, Claude, etc.) usando el prompt de `external-llm-prompt.md`?
3. ¿Dónde guardo tus datos? (por defecto `~/.event-radar/`)

## Bloque 1 · Tú y tu empresa
4. Nombre, rol y empresa. Sitio web si lo tienes.
5. ¿Qué hace tu empresa, a quién le vende y cómo gana dinero? (2–3 frases)
6. Industria, etapa (idea / temprana / crecimiento / establecida) y tamaño del equipo.
7. ¿En qué mercados operas hoy y en cuáles quieres entrar?

## Bloque 2 · Qué buscas en un evento
8. Ordena por prioridad: clientes, socios/distribuidores, proveedores, inversión, aprendizaje, marca/visibilidad, contratación, otro.
9. ¿Qué tendría que pasar para que un evento "valiera la pena"? (ej. 3 reuniones calificadas, 1 proveedor nuevo)
10. ¿Quién es tu cliente ideal? ¿Qué cargos/empresas quieres conocer?
11. ¿Qué competidores o empresas de referencia quieres vigilar (dónde exponen, hablan o asisten)?

## Bloque 3 · Temas y filtros
12. Temas/palabras clave que **sí** te interesan.
13. Temas/formatos que **no** quieres ver.
14. Formatos preferidos: feria con expositores, conferencia, meetup, taller, charla, cumbre. ¿Tamaño: chico, mediano, grande?
15. ¿Idiomas en que puedes asistir a un evento?

## Bloque 4 · Geografía, viaje y presupuesto
16. Tu ciudad base.
17. Define tus 3 radios: **Tier 1** (prioridad, normalmente tu ciudad/área), **Tier 2** (secundario, ej. tu país), **Tier 3** (terciario, internacional).
18. ¿Estás dispuesto a viajar en avión? ¿Cuántos días al año como máximo? ¿Necesitas considerar visas/aduana?
19. Presupuesto por evento y anual, y moneda. ¿Qué cubre (entrada, vuelo, hotel, comidas, traslado)? ¿Lo paga tu empresa?
20. Estilo de viaje (económico / balanceado / cómodo) y si vas solo o con equipo.
21. Restricciones: fechas bloqueadas, accesibilidad, dieta, familia.

## Bloque 5 · Historia
22. Eventos a los que fuiste y te sirvieron (y por qué).
23. Eventos que no valieron la pena (y por qué).

## Bloque 6 · Scan: cadencia y fuentes
24. ¿Cada cuánto quieres que busque eventos nuevos? (semanal, quincenal, mensual u otro) ¿Qué día y hora, y en qué zona horaria?
25. ¿Cuántos meses hacia adelante busco? (por defecto 12)
26. ¿Qué puntaje mínimo (0–100) quieres ver en el reporte? (por defecto 60)
27. ¿Hay calendarios, asociaciones, newsletters o sitios que ya sigas y quieras que revise?

## Bloque 7 · Cómo quieres recibir todo
28. **Entregable**: ¿cómo quieres el reporte? Excel, Word, correo, PDF, Markdown, mensaje en Slack, página en Notion u otro. Se pueden combinar (ej. correo corto + Excel adjunto).
29. Nivel de detalle: corto (solo ranking), medio (ranking + por qué + costo) o profundo.
30. ¿Dónde guardo los archivos generados? (carpeta local, Drive, OneDrive, Dropbox)

## Bloque 8 · Recordatorios
31. ¿Quieres recordatorios? Por defecto: **6, 3 y 1 mes** antes del evento. ¿Los cambias o agregas otros (ej. 2 semanas, 3 días)?
32. ¿Te aviso de deadlines (registro, early-bird, convocatoria de ponentes, hotel en bloque)?
33. ¿Por qué canal? Calendario (Google/Outlook), correo, Slack, Notion, Monday, u otro.
34. ¿Quieres además un resumen periódico de "qué viene"? ¿Cada cuánto?

## Bloque 9 · Contactos (CRM)
35. ¿Ya usas un CRM (HubSpot, Salesforce, Notion, Airtable, Google Sheets…)?
    - **Sí** → ¿cuál? Guardo ahí contactos y seguimiento si hay conector; si no, dejo un archivo listo para importar.
    - **No** → ¿quieres que cree uno simple? (Excel/CSV, Google Sheets, Notion o Airtable)
    - **No quiero** → solo guardo contactos dentro de los briefings.

## Bloque 10 · Herramientas que ya usas
36. ¿Qué usas para calendario, correo, chat y organización (Slack, Teams, Notion, Monday, Asana, ClickUp, Airtable…)?
37. Para cada una que mencione, consulta `connectors.md`, revisa si el conector está disponible en la sesión y propón qué podría hacer ahí. No instales ni autorices nada sin que lo pida: si falta autorización, dile que la haga él mismo desde `/mcp`.

## Cierre
- Muestra el perfil resumido (empresa, objetivos, geografía, presupuesto, cadencia, idioma, entregables, recordatorios, CRM, integraciones).
- Lista **pendientes** (campos `null`).
- Pide confirmación. Solo entonces guarda `onboarding_completed: true`.
- Ofrece correr el primer scan de prueba.
