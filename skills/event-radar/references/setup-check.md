# Revisión de entorno (primera vez y cuando falle algo)

El usuario puede no ser técnico. **Nunca le pidas que abra una terminal ni que instale cosas por su cuenta**: tú revisas, propones y, con su OK, lo haces. Habla en palabras simples ("necesito un programa pequeño llamado Node para hacer los cálculos").

## 1. ¿Está Node.js?

Ejecuta `node --version`.

- **Responde con v18 o más** → listo. Guarda `environment.mode: script` en el perfil.
- **No existe o es menor a v18** → ofrece, en este orden:
  1. **Instalarlo por él** (pide su OK; verás una ventana de permiso, es normal):
     - Windows: `winget install OpenJS.NodeJS.LTS`
     - macOS: `brew install node` (si no hay Homebrew, ve al punto 2)
     - Linux: `sudo apt install nodejs` o el gestor de la distribución
     Después, **cierra y vuelve a abrir** la sesión si `node --version` aún no responde (el sistema necesita recargar), y vuelve a comprobar.
  2. **Descarga manual**: https://nodejs.org (botón "LTS"). Explícale en 3 pasos: descargar, abrir el instalador, siguiente-siguiente-terminar.
  3. **Seguir sin instalar nada** → modo manual (abajo). Es totalmente válido.

Si la instalación falla (sin permisos de administrador, equipo del trabajo), no insistas: pasa al modo manual y cuéntale por qué.

## 2. Modo manual (sin Node)

Mismo flujo y mismas fases; lo que cambia es **quién hace las cuentas**.

| Con script | Modo manual |
|---|---|
| `merge` | Editas `events.json` tú mismo: no dupliques (misma URL **y** mismo nombre, o mismo nombre y año); no pises `status`, `scores`, `evidence`, `outcome`. |
| `score` | Aplica la fórmula de `scoring-rubric.md` (promedio ponderado × 10, penalizaciones, bonus). Muestra el desglose para que se pueda revisar. |
| `longlist`, `report` | Tablas en Markdown con las columnas de siempre. |
| `export` (Excel, `.ics`) | No hay Excel ni `.ics`. Escribe las pestañas **Events / Prices / Timeline / Scores / Contacts** directamente en la hoja de Google con el conector, o entrega CSV como texto si no hay conector. |
| `reminders` | Calcula tú las fechas (6/3/1 meses antes, 2 semanas y 1 semana solo si está registrado, deadlines a 14 y 3 días y el mismo día) y crea los eventos en el calendario con el conector. |
| `crm`, `outcome`, `post-event`, `learn` | Mismas reglas de `crm-and-post-event.md`, hechas a mano. |

En modo manual avisa en una línea: "Sin Node los cálculos los hago yo; son menos reproducibles, así que muéstrame si ves algo raro". Si más adelante el usuario instala Node, vuelve a modo script sin perder nada (los archivos son los mismos).

## 3. Conectores (calendario, correo, hojas)

Revisa en la sesión qué conectores hay (calendario, correo, Drive/Sheets). Para los que falten, explícale **qué ganaría** y cómo activarlos desde la configuración de conectores de Claude; no pidas contraseñas ni claves, y sin conector el plugin sigue funcionando con archivos (ver `delivery-and-sync.md`).

## 4. Dónde se guardan los datos

`~/.event-radar/` (carpeta personal del usuario). Si no se puede escribir ahí, pide una carpeta alternativa y guárdala en el perfil (`data_dir`). Dile siempre dónde quedaron sus archivos.

## 5. Registro

Anota en `profile.yaml` → `environment: { mode: script | manual, checked: <fecha> }` y no vuelvas a preguntar salvo que algo falle.
