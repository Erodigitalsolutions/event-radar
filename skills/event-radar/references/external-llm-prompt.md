# Prompt para pegar en otro asistente (ChatGPT, Claude, Gemini…)

Sirve para que la persona responda todo el onboarding en su asistente habitual, donde ya tiene contexto de su negocio, y luego pegue el resultado en Event Radar.

**Instrucciones para el usuario:** copia el bloque de abajo, pégalo en tu asistente, revisa la respuesta y pégala de vuelta en Event Radar.

---

````text
Voy a usar una herramienta que busca eventos (conferencias, ferias, charlas, meetups) alineados con mi empresa. Necesito que respondas el siguiente perfil usando SOLO lo que sepas de mí por nuestras conversaciones previas o por lo que te diga ahora.

Reglas estrictas:
1. No inventes nada. Si no sabes un dato, escribe `null`.
2. Si hay algo importante que no sabes, al final lista "PREGUNTAS PENDIENTES" para que yo las conteste.
3. Responde en un único bloque de código YAML, sin texto antes ni después, salvo la lista de preguntas pendientes.
4. Si dudas entre dos opciones, elige la que mejor se apoye en lo que sabes y márcala con el comentario `# supuesto`.

Perfil a completar:

```yaml
person:
  name:
  role:
  languages: []
company:
  name:
  website:
  what_we_do:            # 2-3 frases
  business_model:        # B2B | B2C | B2B2C | marketplace | agencia | otro
  industry: []
  stage:                 # idea | early | growth | established
  team_size:
  markets: []
  products_services: []
goals:                   # ordenados por prioridad
  - { rank: 1, goal: }   # customers | partners | suppliers | investors | learning | brand | hiring | other
success_definition:      # qué haría que un evento valiera la pena
audience:
  ideal_customer:
  ideal_partner:
  roles_to_meet: []
  companies_to_meet: []
  competitors_to_watch: []
topics:
  include: []
  exclude: []
geography:
  home_base:
  willing_to_fly:
  max_travel_days_per_year:
budget:
  currency:
  per_event_max:
  annual_total:
preferences:
  formats: []            # expo | conference | meetup | workshop | talk | summit
  size:                  # small | medium | large | any
  event_language: []
  travel_style:          # economico | balanceado | comodo
  attends_with:          # solo | equipo
  constraints: []
history:
  liked_events: []
  disliked_events: []
```

PREGUNTAS PENDIENTES:
- (lista aquí lo que no pudiste completar)
````

---

## Cómo procesa Event Radar la respuesta

1. Parsear el YAML. Si viene con texto alrededor, extraer solo el bloque.
2. Mapear a `profile.yaml` (mismas claves que `templates/profile.template.yaml`).
3. Tratar `# supuesto` como **dato no confirmado**: mostrarlo al usuario y pedir confirmación.
4. Los campos que este prompt no cubre (`scan`, `reports`, `reminders`, `crm`, `integrations`, tiers geográficos) **siempre se preguntan** en el skill: Bloques 6–10 del cuestionario.
5. Si el usuario pegó solo texto libre (no YAML), extraer lo posible y confirmar antes de guardar.
