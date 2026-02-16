# 🤖 AGENTS.md - Workflow Automatizado IA

## 🎯 PRINCIPIO FUNDAMENTAL
**Actúa primero, pregunta después solo si es crítico**  
Objetivo: Maximizar velocidad sin sacrificar calidad

---

## 🚀 AUTONOMÍA MÁXIMA

### Reglas de Decisión
```
SI duda <5s → Implementa mejor práctica estándar
SI impacto >1h trabajo → 1 pregunta concreta máximo
SI breaking change → Avisa + propón migración
```

### Comunicación Prohibida
❌ "¿Quieres que...?"  
❌ "¿Prefieres A o B?"  
❌ "¿Dónde pongo...?"  

### Comunicación Correcta
✅ "Implementado X. Tests 92%. Review: /diff"  
✅ "Breaking: API v2. Migración: /docs/MIGRATION.md"  
✅ "Hotfix deployed. Rollback: `git revert abc123`"

---

## ESTRUCTURA
(Según proyecto)
backend/ (3001) | frontend/ (3002) | .github/


# 🧠 STACK INTELIGENTE (AUTO-SELECCIÓN)

## HEURÍSTICAS DECISIÓN STACK (Evalúa + elige mejor)

PROYECTO GRANDE (>10 modelos/usuarios/cruzado): Laravel 11 + Inertia + Vue 3 + MySQL (puerto 3000)
SIMPLE (<1 semana/MVP): Node Express + React Vite (3001/3002)
REALTIME (chat/socket): Node Socket.io + React (3001/3002)
ML/DATA (análisis): Python + FastAPI + Streamlit (8000/3002)
MÓVIL/PWA: Laravel API + React Native

---

## 📁 EJEMPLO DE ESTRUCTURA PROYECTO 

Por defecto, se sigue una estructura modular por capas o pipelines, evitando mezclar responsabilidades.

```
proyecto/
├── backend/          # API + lógica negocio
├── frontend/         # UI + cliente
├── shared/           # types, utils, schemas compartidos
├── tests/            # tests unitarios e integración
├── docs/             # Documentación técnica
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DECISIONS.md  # ADRs importantes
├── .github/
│   ├── workflows/    # CI/CD
├── docker-compose.yml
├── AGENTS.md         # ← ESTE archivo
├── ROADMAP.md        # Plan de trabajo
├── README.md         # Documentación general
└── package.json      # Scripts raíz
```

### Scripts NPM Raíz (Requeridos)
```json
{
  "scripts": {
    "dev": "concurrently 'npm:dev:*'",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "npm i && cd backend && npm i && cd ../frontend && npm i",
    "lint": "prettier --check . && eslint .",
    "format": "prettier --write .",
    "test": "npm run test --workspaces",
    "test:ci": "npm run test:ci --workspaces",
    "build": "npm run build --workspaces"
  }
}
```

---

## 🔄 WORKFLOW GIT

### Branching Strategy
```bash
# Nomenclatura obligatoria
codex-{tipo}-{descripción-corta}-{timestamp}

# Ejemplos
codex-feat-auth-api-20260215-1430
codex-fix-login-bug-20260215-1445
codex-docs-api-spec-20260215-1500
```

### Tipos Válidos
- `feat`: Nueva funcionalidad
- `fix`: Corrección bug
- `refactor`: Refactorización sin cambio comportamiento
- `docs`: Solo documentación
- `test`: Añadir/mejorar tests
- `chore`: Tareas mantenimiento (deps, config)

### Flujo Automático

```bash
1. /diff     # Muestra cambios + impacto
2. /test     # Ejecuta tests + coverage
3. /merge    # Merge si tests >85% + CI pass
```

### Commits
```bash
# Formato: tipo(scope): descripción
feat(auth): add JWT refresh token endpoint
fix(ui): resolve mobile menu overflow
docs(api): update rate limit documentation
```

---

# 🔄 ISSUE WORKFLOW (GitHub Issues nativo - OBLIGATORIO)

## PROCESO AUTOMÁTICO

GitHub Issues → Label: 🔴 bug 🤖 codex | 🟢 feature 🤖 codex
codex /issues → Lista disponibles kanban
codex /next-bug → codex-bug-#12 (auto-branch)
Implementa → /test → coverage >85% → /pr → /close #12


## COMANDOS AGENTES
codex /issues # Lista + kanban status
codex /next-bug # Toma siguiente 🔴 bug
codex /next-feature # Toma siguiente 🟢 feature
codex /assign #15 # Asigna agent a issue
codex /close #12 # Merge + close auto
codex /kanban # Status visual ToDo/InProgress/Done

## BRANCH CONVENCIÓN
🔴 bug → codex-bug-#12-login-crash
🟢 feature → codex-feature-#15-google-oauth
🔵 docs → codex-docs-#18-api-readme

## PRIORIDADES
bug > feature > refactor > docs
GitHub Project: "Codex Kanban" (4 columnas)
Labels auto: 'crash→bug', 'añade→feature', 'docs→docs'

---

## 📚 DOCUMENTACIÓN OBLIGATORIA

Mantener ROADMAP.md siempre activo y actualizado: referencia principal para agentes y consulta humana.

### README.md (Raíz)
```markdown
# Proyecto XYZ

## Quick Start
npm run install:all
npm run dev  # → backend:3001 + frontend:3002

## Architecture
Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Roadmap  (Fases y entregables)
Ver [ROADMAP.md](ROADMAP.md)
```

### backend/README.md
```markdown
# Backend API

## Endpoints
GET  /api/users       # Lista usuarios
POST /api/users       # Crear usuario
...

## Examples
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'
```

### frontend/README.md
```markdown
# Frontend

## Development
npm run dev  # → http://localhost:3002

## Build
npm run build  # → dist/
```

### Inline Code
- JSDoc en funciones públicas
- Comentarios en bloques >15 líneas o lógica compleja
- TODOs con issue: `// TODO(#42): Refactor to use async/await`

---

## ✅ DECISIONES AUTOMÁTICAS

- Al añadir nuevas funciones o testar diferentes parámetros de configuración, siempre crear test particulares para cada escenario. 
- Siempre mantener los tests actualizados de cualquier capa, módulo o servicio del proyecto. 

### Coverage & Quality
```yaml
Tests pass: ✅ Auto-approve
Coverage ≥85%: ✅ Auto-approve
Lint errors: ❌ Block merge
Breaking changes: ⚠️ Require explicit approval
```

### Comandos
```bash
/apply  # Si tests pass → commit
/merge  # Si CI pass + coverage OK → merge to main
/docs   # Genera/actualiza docs antes de merge
```

---

## 🔧 HERRAMIENTAS OPCIONALES

### Browser Automation (si aplica)
- Puppeteer para E2E tests
- Playwright para cross-browser

### MCP Servers (si aplica)
- GitHub MCP: Gestión issues/PRs
- Filesystem MCP: Operaciones archivo
- Database MCP: Queries directo

### Monitoring (producción)
- Sentry (errores)
- Plausible/Umami (analytics ligero)
- Uptime robot (disponibilidad)

---

## 🎓 DECISIONES ARQUITECTÓNICAS

### Cuándo Cambiar Stack
```
JSON DB → PostgreSQL: >1000 registros o queries complejas
Context API → Zustand: >5 contexts o prop drilling
REST → GraphQL: Frontend necesita datos muy específicos
Monolito → Microservicios: >3 dominios independientes
```

### Logging
```javascript
// Desarrollo: console.log OK
// Producción: winston/pino con niveles
logger.info('User created', { userId: 123 });
logger.error('DB connection failed', { error });
```

---

## 🚨 EXCEPCIONES AL WORKFLOW

### Requiere Aprobación Humana
- Cambios en AGENTS.md
- Eliminación datos producción
- Cambios permisos/seguridad
- Refactorización >500 líneas

### Hotfix Critical
```bash
# Branch directo desde main
hotfix-{descripción}-{timestamp}

# Deploy inmediato después de tests
# Notificar en #incidents canal
```

---

## 📖 RECURSOS

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Última actualización:** 2026-02-15  
**Versión:** 1.0  
**Mantenedor:** Equipo + AI Agents
