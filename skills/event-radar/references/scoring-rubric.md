# Rúbrica de scoring (0–100)

Cada evento recibe 7 sub-puntajes de **0 a 10**. El puntaje final es el promedio ponderado × 10. Los pesos salen del perfil del usuario (ver "Pesos") y el cálculo lo hace `scripts/score.mjs`, **no tú a ojo**: tú asignas los sub-puntajes con evidencia y el script calcula.

## Criterios

| Clave | Criterio | 0 | 5 | 10 |
|---|---|---|---|---|
| `fit` | Alineación con los objetivos del usuario | No toca ninguno de sus objetivos | Toca uno de forma indirecta | Responde directo a su objetivo #1 |
| `audience` | Calidad de audiencia | Público ajeno o no declarado | Mezcla, parte son decisores del perfil | Mayoría decisores del cliente/socio ideal, verificable |
| `people` | Expositores y ponentes relevantes | Ninguno de su lista ni de su perfil | Algunos relevantes | Varios de `companies_to_meet`/`roles_to_meet` confirmados |
| `credibility` | Historia y credibilidad | Primera edición sin respaldo / señales de mala reputación | Edición 2–3, organizador conocido | 5+ ediciones, organizador reconocido, buenas reseñas |
| `cost` | Costo total vs. presupuesto | Excede el máximo por evento | Cerca del máximo | Muy por debajo y con alto retorno esperado |
| `logistics` | Logística | Vuelo largo, visa, muchos días fuera | Un traslado razonable | En su ciudad / sin hotel ni vuelo |
| `timing` | Calendario y deadlines | Choca con fechas bloqueadas / deadline vencido | Fecha ok, poco margen | Fecha libre y early-bird vigente |

## Reglas de asignación

- **Sin evidencia, no hay nota alta.** Si no pudiste verificar un criterio, asigna `5` y marca `unverified: ["<clave>"]`. Nunca inventes asistentes, precios ni reseñas.
- **Guarda la evidencia:** cada sub-puntaje lleva una frase corta y la URL de donde sale (`evidence`).
- **Filtros duros (descartan antes de puntuar):**
  - Fecha ya pasada.
  - Coincide con una fecha bloqueada en `preferences.constraints`.
  - Tema en `topics.exclude`.
  - Costo mínimo estimado > `budget.per_event_max` × 2.
  Registra estos como `status: "filtered"` con `filtered_reason`.
- **Penalizaciones** (se aplican después del promedio, ya codificadas en el script):
  - Deadline de registro vencido pero evento futuro: −5.
  - 3 o más campos críticos sin verificar (fecha, lugar, precio, organizador): −10.
- **Bonus:** evento en la lista `history.liked_events` del usuario o edición nueva de uno que le gustó: +5.

## Pesos

Pesos base (suman 100):

| fit | audience | people | credibility | cost | logistics | timing |
|---|---|---|---|---|---|---|
| 25 | 20 | 15 | 10 | 15 | 10 | 5 |

Ajustes por objetivo #1 del usuario (suma 100 después de normalizar; el script normaliza):

- `customers`: audience +10, people +5, credibility −5, timing −5, cost −5
- `partners`: people +10, audience +5, cost −5, logistics −5, timing −5
- `suppliers`: people +10, fit +5, credibility −5, audience −5, timing −5
- `investors`: audience +10, people +10, cost −10, logistics −5, timing −5
- `learning`: fit +10, credibility +5, people −5, audience −5, timing −5
- `brand`: audience +10, credibility +5, cost −5, people −5, logistics −5
- `hiring`: audience +10, fit +5, credibility −5, cost −5, timing −5

El usuario puede fijar sus propios pesos en `scoring_weights` del perfil; si existe, tiene prioridad.

## Etiquetas por rango

| Puntaje | Etiqueta |
|---|---|
| 85–100 | Imperdible |
| 70–84 | Muy recomendado |
| 60–69 | Vale la pena considerar |
| < 60 | No se reporta (queda en la base) |

El umbral de reporte sale de `scan.min_score_to_report`.

## Costo total estimado

`total = entrada + vuelo + hotel + comidas + traslado local` (según `budget.covers`).
- Entrada: precio real publicado; si hay tramos (early-bird/regular/late), guarda todos con su fecha límite.
- Vuelo/hotel/comidas: **estimación**, rotulada como tal con rango (min–max) y moneda. Si el evento es del Tier 1, vuelo y hotel = 0.
- Si no hay precio publicado: `price_known: false` y no compares contra presupuesto como si fuera exacto.
