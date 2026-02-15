# Wrapper en node.js para Codex Cli de OpenAI

## Funciones Principales

Este módulo proporciona las siguientes funciones principales para interactuar con el CLI de Codex:

- `checkCodexAvailable()`: Verifica si codex está disponible en el sistema y proporciona instrucciones si no lo está.
- `runCodex(codexCmd, targetDir)`: Ejecuta codex en modo interactivo en el directorio especificado.
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

