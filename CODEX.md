# CODING NORMS

## Default Stack base

- Backend: Express puerto 3001, db.json
- Frontend: React + Vite puerto 3002
- Tests: Jest y Vitest, cobertura objetivo >= 85%
- Git: ramas prefijo codex-*

## Normas de desarrollo

- Crear carpeta `test/` en backend y frontend.
- Toda funcion nueva debe tener al menos un test asociado.
- Todo endpoint debe tener tests de integracion.
- No hacer cambios sin actualizar tests y documentacion si aplica.
- Validar entradas y manejar errores de forma consistente.
- Mantener estilos y dependencias simples.

## CI

- CI debe correr en cada push y PR.
- Pasos minimos: install, test backend, test frontend, coverage.
- El pipeline debe ejecutar `npm run test:ci` en la raiz.
- Rechazar merges si coverage < 85% o tests fallan.

## Documentacion

- README.md describe instalación, instrucciones de uso, arquitectura, endpoints... (depende del proyecto)
- ROADMAP.md mantiene el plan de trabajo.
