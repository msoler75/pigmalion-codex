# Pigmalion Codex - Wrapper para OpenAI Codex CLI

Un wrapper minimalista y simple para Node.js que facilita el uso del CLI de OpenAI Codex en tus proyectos.

## Características

- ✅ **Auto-detección**: Encuentra automáticamente Codex en tu sistema
- ✅ **Cross-platform**: Funciona en Windows, Linux y macOS
- ✅ **Configurable**: Personaliza la ruta vía variables de entorno
- ✅ **Modo pasivo e interactivo**: Ejecuta comandos de forma automática o interactiva
- ✅ **Validación automática**: Verifica configuración y disponibilidad

## Instalación

```bash
npm install -g @openai/codex-cli
```

Luego configura tu API key:

```bash
codex login
```

## Uso Básico

```javascript
import { runCodexPassive, isCodexAvailable } from './codex_utils.js';

if (!isCodexAvailable()) {
  console.error("Codex no está disponible. Instala con: npm install -g @openai/codex-cli");
  process.exit(1);
}

// Ejecutar en modo pasivo (sin interacción)
const result = await runCodexPassive("Explica qué es Node.js en una oración.", {
  targetDir: "/mi/proyecto",  // opcional, default: process.cwd()
  ephemeral: true,           // opcional
  json: false,               // opcional
  outputFile: null,          // opcional
  fullAuto: true             // opcional
});

console.log(result);
```

## Migración desde v1.x

### ⚠️ Breaking Changes en v2.0.0

La versión 2.0.0 introduce cambios importantes para simplificar la API:

#### Cambios en `runCodexPassive()`
```javascript
// ❌ Antes (v1.x)
const codexCmd = checkCodexAvailable();
const result = runCodexPassive(codexCmd, targetDir, prompt, options);

// ✅ Ahora (v2.0.0)
const result = runCodexPassive(prompt, { targetDir, ...options });
```

#### Cambios en `runCodex()`
```javascript
// ❌ Antes (v1.x)
const codexCmd = checkCodexAvailable();
await runCodex(codexCmd, targetDir, prompt);

// ✅ Ahora (v2.0.0)
await runCodex(prompt, { targetDir });
```

#### Funciones eliminadas
- `checkCodexAvailable()` → Usa `isCodexAvailable()`
- `findCodexFrom*()` → Funciones fusionadas en `findCodex()`
- `buildCodexProcess()` → Eliminada (no usada)
- `resolveCodexJsFromCmd()` → Eliminada (no usada)
- `normalizePath()` → Eliminada (no usada)

#### Nuevas funciones
- `isCodexAvailable()`: Verifica disponibilidad (reemplaza `checkCodexAvailable()`)
- `getCodexPath()`: Obtiene la ruta encontrada
- `findCodex()`: Busca Codex en el sistema

## Funciones Principales

### `isCodexAvailable()`
Verifica si Codex está instalado y disponible en el sistema.

```javascript
import { isCodexAvailable } from './codex_utils.js';

if (isCodexAvailable()) {
  console.log("✅ Codex está listo para usar");
} else {
  console.log("❌ Codex no encontrado");
}
```

### `runCodexPassive(prompt, options)`
Ejecuta Codex en modo pasivo (no interactivo) y retorna el resultado como string.

**Parámetros:**
- `prompt` (string): El prompt para Codex
- `options` (object, opcional): Opciones de configuración

**Opciones disponibles:**
- `targetDir` (string): Directorio de trabajo (default: `process.cwd()`)
- `ephemeral` (boolean): Modo efímero (default: `true`)
- `json` (boolean): Salida en formato JSON (default: `false`)
- `outputFile` (string): Archivo para guardar la salida (default: `null`)
- `fullAuto` (boolean): Modo completamente automático (default: `true`)

**Ejemplo:**
```javascript
const result = await runCodexPassive("Genera un ejemplo de código JavaScript", {
  targetDir: "./mi-proyecto",
  json: true
});
```

### `runCodex(prompt, options)`
Ejecuta Codex en modo interactivo (con interfaz de usuario).

**Parámetros:**
- `prompt` (string): El prompt inicial para Codex
- `options` (object, opcional): Opciones de configuración

**Opciones disponibles:**
- `targetDir` (string): Directorio de trabajo (default: `process.cwd()`)

**Ejemplo:**
```javascript
await runCodex("Ayúdame a refactorizar este código", {
  targetDir: "./src"
});
```

## Configuración

### Variables de Entorno

Puedes personalizar la ruta a Codex estableciendo la variable de entorno `CODEX_CMD`:

```bash
# En .env
CODEX_CMD=/ruta/personalizada/a/codex

# O en terminal
export CODEX_CMD=/usr/local/bin/codex
```

Si no se establece, el wrapper buscará automáticamente en ubicaciones comunes.

## Funciones Auxiliares

### `getCodexPath()`
Retorna la ruta completa al ejecutable de Codex encontrado.

### `findCodex()`
Busca y retorna la ruta a Codex en el sistema.

### `validateCodexConfig()`
Valida la configuración de Codex CLI.

### `log(msg)`
Registra un mensaje en la consola.

## Errores Comunes

- **"Codex no está disponible"**: Asegúrate de tener instalado `@openai/codex-cli` y configurado con `codex login`
- **"Configuración inválida"**: Ejecuta `codex login` para configurar tu API key
- **Errores de PATH**: En Windows, el wrapper busca automáticamente en rutas comunes de npm

## Licencia

MIT

