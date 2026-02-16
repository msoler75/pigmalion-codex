import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync, execSync } from "node:child_process";

// Ensure git is available in PATH for Windows compatibility
if (process.platform === 'win32') {
  const gitPaths = [
    'C:\\Program Files\\Git\\mingw64\\bin',
    'C:\\Program Files\\Git\\cmd',
    'C:\\Program Files\\Git\\bin'
  ];
  for (const gitPath of gitPaths) {
    if (!process.env.PATH.includes(gitPath)) {
      process.env.PATH = `${gitPath};${process.env.PATH}`;
    }
  }
}

// Git executable path for Windows compatibility
// This resolves issue #2: Fix Windows Git PATH compatibility in spawnSync calls
const GIT_CMD = process.platform === 'win32' ? 'C:\\Program Files\\Git\\mingw64\\bin\\git.exe' : 'git';

// Registra un mensaje en la salida estándar
export function log(msg) {
  process.stdout.write(`${msg}\n`);
}

export function normalizePath(p) {
  if (process.platform !== "win32") return p;
  if (!p) return p;
  const msysMatch = p.match(/^\/([a-zA-Z])\/(.*)/);
  if (msysMatch) {
    const drive = msysMatch[1].toUpperCase();
    const rest = msysMatch[2].replace(/\//g, "\\");
    return `${drive}:\\${rest}`;
  }
  return p;
}

// Detecta el shell del sistema
export function detectShell() {
  const env = process.env;
  const shell = (env.SHELL || "").toLowerCase();
  if (shell.includes("bash")) return "bash";
  const psModulePath = (env.PSModulePath || "").toLowerCase();
  if (psModulePath.includes("powershell") || env.PSExecutionPolicyPreference) {
    return "powershell";
  }
  const comspec = (env.COMSPEC || "").toLowerCase();
  if (comspec.includes("cmd.exe")) return "cmd";
  return "unknown";
}

export function ensureWindowsExecutable(codexCmd) {
  if (process.platform !== "win32") return codexCmd;
  if (!codexCmd) return codexCmd;
  const ext = path.extname(codexCmd);
  if (ext) return codexCmd;
  const candidates = [
    `${codexCmd}.cmd`,
    `${codexCmd}.ps1`,
    `${codexCmd}.exe`,
    codexCmd
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return codexCmd;
}

// Verifica si el comando codex puede ejecutarse
export function canRunCodex(codexCmd) {
  if (!codexCmd) return false;
  const ext = path.extname(codexCmd).toLowerCase();
  const useShell =
    process.platform === "win32" && (!ext || ext === ".cmd" || ext === ".ps1");
  const result = spawnSync(codexCmd, ["--version"], {
    stdio: "ignore",
    env: process.env,
    shell: useShell
  });
  if (result.error && result.error.code === "ENOENT") return false;
  if (result.error) return false;
  return true;
}

// Resuelve la ruta al archivo codex.js desde un comando .cmd
export function resolveCodexJsFromCmd(codexCmd) {
  if (!codexCmd.toLowerCase().endsWith(".cmd")) return null;
  const binDir = path.dirname(codexCmd);
  const candidate = path.join(
    binDir,
    "node_modules",
    "@openai",
    "codex",
    "bin",
    "codex.js",
  );
  if (fs.existsSync(candidate)) return candidate;
  return null;
}

// Construye el proceso para ejecutar codex
export function buildCodexProcess(codexCmd, prompt) {
  const codexJs = resolveCodexJsFromCmd(codexCmd);
  if (codexJs) {
    return {
      cmd: process.execPath,
      args: [codexJs],
      options: { shell: false },
    };
  }
  const ext = path.extname(codexCmd).toLowerCase();
  const useShell =
    process.platform === "win32" && (ext === ".cmd" || ext === ".ps1");
  return { cmd: codexCmd, args: [], options: { shell: useShell } };
}


// Valida la configuración de Codex CLI
export function validateCodexConfig() {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');
  
  if (!fs.existsSync(configPath)) {
    return {
      valid: false,
      message: `No se encontró el archivo de configuración de Codex en: ${configPath}. ` +
               `Ejecuta 'codex login' para inicializar la configuración.`
    };
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const lines = configContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('approval_policy')) {
        const match = trimmed.match(/approval_policy\s*=\s*(.+)/);
        if (match) {
          const value = match[1].trim();
          // Remover comillas si las hay
          const cleanValue = value.replace(/^["']|["']$/g, '');
          
          if (cleanValue === 'true' || cleanValue === 'false') {
            return { valid: true };
          } else {
            return {
              valid: false,
              message: `El campo 'approval_policy' en ${configPath} tiene un valor inválido: "${cleanValue}". ` +
                       `Debe ser 'true' o 'false' (sin comillas). Cambia la línea a: approval_policy = true`
            };
          }
        }
      }
    }
    
    // Si no encontró el campo, asumir válido (podría tener valor por defecto)
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      message: `Error al leer el archivo de configuración ${configPath}: ${err.message}`
    };
  }
}


// Busca codex en un directorio bin
export function findCodexInBinDir(binDir) {
  if (!binDir) return null;
  const normalized = normalizePath(binDir);
  const candidates = [
    path.join(normalized, "codex"),
    path.join(normalized, "codex.cmd"),
    path.join(normalized, "codex.ps1"),
    path.join(normalized, "codex.exe")
  ];
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

// Busca codex en la instalación global de npm
export function findCodexFromNpmGlobal() {
  const npmPrefix = spawnSync("npm", ["prefix", "-g"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (npmPrefix.status !== 0 || !npmPrefix.stdout) {
    return null;
  }
  const prefix = npmPrefix.stdout.trim();
  const direct = findCodexInBinDir(prefix);
  if (direct) return direct;
  return findCodexInBinDir(path.join(prefix, "bin"));
}

// Busca codex usando el prefijo de npm
export function findCodexFromNpmPrefix() {
  const npmPrefix = spawnSync("npm", ["prefix", "-g"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (npmPrefix.status === 0 && npmPrefix.stdout) {
    const prefix = npmPrefix.stdout.trim();
    const found = findCodexInBinDir(prefix);
    if (found) return found;
    const foundBin = findCodexInBinDir(path.join(prefix, "bin"));
    if (foundBin) return foundBin;
  }

  const npmConfigPrefix = spawnSync("npm", ["config", "get", "prefix"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (npmConfigPrefix.status === 0 && npmConfigPrefix.stdout) {
    const prefix = npmConfigPrefix.stdout.trim();
    const found = findCodexInBinDir(prefix);
    if (found) return found;
    const foundBin = findCodexInBinDir(path.join(prefix, "bin"));
    if (foundBin) return foundBin;
  }

  return null;
}

// Busca codex en node_modules locales
export function findCodexFromLocalNodeModules() {
  const localBin = path.join(process.cwd(), "node_modules", ".bin");
  return findCodexInBinDir(localBin);
}

// Busca codex usando el comando 'where' (Windows)
export function findCodexFromWhere() {
  const whereResult = spawnSync("where", ["codex"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (whereResult.status !== 0 || !whereResult.stdout) {
    return null;
  }
  const lines = whereResult.stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return lines[0];
}

// Busca codex usando el comando 'which' (Unix)
export function findCodexFromWhich() {
  const whichResult = spawnSync("which", ["codex"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (whichResult.status !== 0 || !whichResult.stdout) {
    return null;
  }
  const lines = whichResult.stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const first = normalizePath(lines[0]);
  const hasExt = path.extname(first).length > 0;
  if (hasExt && fs.existsSync(first)) return first;
  const candidates = [
    `${first}.cmd`,
    `${first}.ps1`,
    `${first}.exe`,
    first
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Busca codex basado en el shell detectado
export function findCodexFromShell() {
  const shell = detectShell();
  if (shell === "bash") return findCodexFromWhich();
  if (shell === "powershell" || shell === "cmd") return findCodexFromWhere();
  return null;
}

// Busca codex en la instalación global de pnpm
export function findCodexFromPnpmGlobal() {
  const pnpmBin = spawnSync("pnpm", ["bin", "-g"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (pnpmBin.status !== 0 || !pnpmBin.stdout) {
    return null;
  }
  return findCodexInBinDir(pnpmBin.stdout.trim());
}

// Busca codex en la instalación global de yarn
export function findCodexFromYarnGlobal() {
  const yarnBin = spawnSync("yarn", ["global", "bin"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: process.env
  });
  if (yarnBin.status !== 0 || !yarnBin.stdout) {
    return null;
  }
  return findCodexInBinDir(yarnBin.stdout.trim());
}

// Busca codex en rutas conocidas del sistema
export function findCodexFromKnownPaths() {
  const bins = [];
  if (process.env.npm_config_prefix) {
    bins.push(process.env.npm_config_prefix);
    bins.push(path.join(process.env.npm_config_prefix, "bin"));
  }
  if (process.env.npm_prefix) {
    bins.push(process.env.npm_prefix);
    bins.push(path.join(process.env.npm_prefix, "bin"));
  }
  if (process.env.npm_config_global_prefix) {
    bins.push(process.env.npm_config_global_prefix);
    bins.push(path.join(process.env.npm_config_global_prefix, "bin"));
  }
  if (process.env.APPDATA) {
    bins.push(path.join(process.env.APPDATA, "npm"));
    bins.push(path.join(process.env.APPDATA, "Yarn", "bin"));
  }
  if (process.env.LOCALAPPDATA) {
    bins.push(path.join(process.env.LOCALAPPDATA, "Yarn", "bin"));
    bins.push(path.join(process.env.LOCALAPPDATA, "npm"));
  }
  if (process.env.PNPM_HOME) {
    bins.push(process.env.PNPM_HOME);
  }
  if (process.env.YARN_GLOBAL_FOLDER) {
    bins.push(process.env.YARN_GLOBAL_FOLDER);
    bins.push(path.join(process.env.YARN_GLOBAL_FOLDER, "bin"));
  }

  for (const binDir of bins) {
    const found = findCodexInBinDir(binDir);
    if (found) return found;
  }
  return null;
}

// Verifica si codex está disponible en el sistema
export function checkCodexAvailable() {
  const candidates = [
    findCodexFromShell(),
    findCodexFromLocalNodeModules(),
    findCodexFromNpmGlobal(),
    findCodexFromNpmPrefix(),
    findCodexFromPnpmGlobal(),
    findCodexFromYarnGlobal(),
    findCodexFromWhere(),
    findCodexFromWhich(),
    findCodexFromKnownPaths()
  ];
  for (const candidate of candidates) {
    const resolved = ensureWindowsExecutable(candidate);
    if (canRunCodex(resolved)) return resolved;
  }

  const result = spawnSync("codex", ["--version"], {
    stdio: "ignore",
    env: process.env,
    shell: false
  });
  if (!result.error && result.status === 0) {
    return "codex";
  }
  if (result.error && result.error.code !== "ENOENT") {
    return null;
  }

  log("");
  log("No se encontro el comando 'codex' en PATH ni en npm/pnpm/yarn global.");
  log("Instalacion recomendada:");
  log("- Instala el CLI de Codex con el metodo oficial segun tu entorno.");
  log("- Verifica que el comando `codex` quede disponible en PATH.");
  log("- Luego vuelve a ejecutar `npx pigmalion-setup`.");
  return null;
}




// Ejecuta codex en modo pasivo con un prompt y retorna el resultado
// fullAuto: si es true, se ejecuta sin pedir confirmación (equivalente a --full-auto)
export function runCodexPassive(codexCmd, targetDir, prompt, options = {}) {
  // Validar configuración antes de ejecutar
  const configCheck = validateCodexConfig();
  if (!configCheck.valid) {
    throw new Error(`Configuración de Codex inválida: ${configCheck.message}`);
  }

  const { ephemeral = true, json = false, outputFile = null, fullAuto = true } = options;
  
  log("");
  log("Ejecutando Codex en modo pasivo...");
  log(`Usando: ${codexCmd}`);
  log(`Prompt: ${prompt}`);
  log("");

  prompt = preparePrompt(prompt);

  // Construye el comando completo
  let fullCommand = `${codexCmd} exec`;
  if (ephemeral) fullCommand += ' --ephemeral';
  if (json) fullCommand += ' --json';
  if (outputFile) fullCommand += ` --output-last-message "${outputFile}"`;
  fullCommand += ` "${prompt}"`;

  try {
    let result;
    if (process.platform === 'win32' && codexCmd.toLowerCase().endsWith('.cmd')) {
      // En Windows, usar cmd.exe con args separados para evitar escaping issues
      const args = ['/c', codexCmd, 'exec'];
      if (ephemeral) args.push('--ephemeral');
      if (json) args.push('--json');
      if (fullAuto) args.push('--full-auto');
      if (outputFile) args.push('--output-last-message', outputFile);
      args.push(prompt);

      result = spawnSync('cmd.exe', args, {
        cwd: targetDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
      });
    } else {
      // Para otros casos, usar spawnSync sin shell
      const args = [codexCmd, 'exec'];
      if (ephemeral) args.push('--ephemeral');
      if (json) args.push('--json');
      if (fullAuto) args.push('--full-auto');
      if (outputFile) args.push('--output-last-message', outputFile);
      args.push(prompt);

      result = spawnSync(codexCmd, args.slice(1), {  // args[0] es el comando, args.slice(1) son los args
        cwd: targetDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
        shell: false
      });
    }

    if (result.error) {
      throw new Error(`Error al ejecutar Codex: ${result.error.message}`);
    }

    if (result.status !== 0) {
      throw new Error(`Codex terminó con error (código ${result.status}): ${result.stderr}`);
    }

    // Retorna el resultado (stdout)
    const output = result.stdout.trim();
    log(`Resultado obtenido: ${output.substring(0, 100)}...`); // Log resumido
    return output;
  } catch (err) {
    log(`Error en runCodexPassive: ${err.message}`);
    throw err;
  }
}


// Ejecuta codex en modo interactivo con un prompt personalizado (opcional)
export async function runCodex(codexCmd, targetDir, prompt) {  

  log("");
  log("Iniciando Codex en modo interactivo...");
  log(`Usando: ${codexCmd}`);
  log("");

  prompt = preparePrompt(prompt);

  const ext = path.extname(codexCmd).toLowerCase();
  const useShell = process.platform === "win32" && (ext === ".cmd" || ext === ".ps1");

  const child = spawn(codexCmd, [prompt], {
    stdio: 'inherit',
    shell: useShell,
    cwd: targetDir
  });

  return new Promise((resolve) => {
    child.on('close', (code) => {
      log(`Codex terminó con código ${code}.`);
      resolve();
    });
    child.on('error', (err) => {
      log(`Error al iniciar Codex: ${err.message}`);
      resolve();
    });
  });
}


// hay que unir todas las lineas del prompt en una sola
export function preparePrompt(prompt) {
  return prompt.split('\n').map(line => line.trim()).join('<br>');
}