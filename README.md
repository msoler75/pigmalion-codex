# Wrapper en node.js para Codex Cli de OpenAI

## Funciones Principales

Este módulo proporciona las siguientes funciones principales para interactuar con el CLI de Codex:

- `checkCodexAvailable()`: Verifica si codex está disponible en el sistema y proporciona instrucciones si no lo está.
- `runCodex(codexCmd, targetDir, prompt)`: Ejecuta codex en modo interactivo en el directorio especificado. El parámetro `prompt` es opcional; si no se proporciona, usa un prompt por defecto que indica leer SETUP.md.
- `runCodexPassive(codexCmd, targetDir, prompt, options)`: Ejecuta codex en modo pasivo (no interactivo) con un prompt y retorna el resultado como string. Valida la configuración antes de ejecutar y lanza errores si hay problemas. Opciones incluyen `ephemeral`, `json`, y `outputFile`.
- `validateCodexConfig()`: Valida la configuración de Codex CLI leyendo el archivo `config.toml` y verifica campos como `approval_policy`. Retorna un objeto con `valid` y `message` si hay errores.
- `findCodexFromShell()`: Busca codex basado en el shell detectado.
- `buildCodexProcess(codexCmd, prompt)`: Construye el proceso para ejecutar codex.
- `canRunCodex(codexCmd)`: Verifica si el comando codex puede ejecutarse.

## Funciones Auxiliares

Funciones adicionales para soporte y detección:

- `log(msg)`: Registra un mensaje en la salida estándar.
- `normalizePath(p)`: Normaliza rutas de archivos, especialmente para Windows (convierte rutas MSYS a rutas de Windows).
- `detectShell()`: Detecta el shell del sistema (bash, powershell, cmd, etc.).
- `ensureWindowsExecutable(codexCmd)`: Asegura que el comando sea ejecutable en Windows agregando extensiones si es necesario.
- `resolveCodexJsFromCmd(codexCmd)`: Resuelve la ruta al archivo codex.js desde un comando .cmd.
- `findCodexInBinDir(binDir)`: Busca codex en un directorio bin específico.
- `findCodexFromNpmGlobal()`: Busca codex en la instalación global de npm.
- `findCodexFromNpmPrefix()`: Busca codex usando el prefijo de npm.
- `findCodexFromLocalNodeModules()`: Busca codex en node_modules locales.
- `findCodexFromWhere()`: Busca codex usando el comando 'where' (Windows).
- `findCodexFromWhich()`: Busca codex usando el comando 'which' (Unix).
- `findCodexFromPnpmGlobal()`: Busca codex en la instalación global de pnpm.
- `findCodexFromYarnGlobal()`: Busca codex en la instalación global de yarn.
- `findCodexFromKnownPaths()`: Busca codex en rutas conocidas del sistema.

## Uso

### Ejemplo de runCodexPassive

```javascript
import { runCodexPassive, checkCodexAvailable } from './codex_utils.js';

const codexCmd = checkCodexAvailable();
if (codexCmd) {
  try {
    const result = runCodexPassive(codexCmd, process.cwd(), 'Explica qué es Node.js en una oración.');
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

Esta función valida automáticamente la configuración de Codex antes de ejecutar y retorna el resultado generado por Codex sin requerir interacción del usuario.

