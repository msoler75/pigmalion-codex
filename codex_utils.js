import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync, execSync } from "node:child_process";

// Codex executable path for Windows compatibility
var CODEX_CMD = process.env.CODEX_CMD ||
  (process.platform === 'win32' ? 'C:\\Users\\msole\\AppData\\Roaming\\npm\\codex.cmd' : 'codex');

// Encuentra y verifica la ruta a codex
export function findCodex() {
  // Primero intentar la ruta configurada
  if (CODEX_CMD && canRunCodex(ensureWindowsExecutable(CODEX_CMD))) {
    return ensureWindowsExecutable(CODEX_CMD);
  }

  // Buscar en ubicaciones comunes
  const candidates = [];

  // Desde shell
  const shell = detectShell();
  if (shell === "bash") {
    const whichResult = spawnSync("which", ["codex"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (whichResult.status === 0 && whichResult.stdout) {
      candidates.push(whichResult.stdout.trim());
    }
  } else if (shell === "powershell" || shell === "cmd") {
    const whereResult = spawnSync("where", ["codex"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (whereResult.status === 0 && whereResult.stdout) {
      candidates.push(...whereResult.stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
    }
  }

  // Desde npm global
  const npmPrefix = spawnSync("npm", ["prefix", "-g"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (npmPrefix.status === 0 && npmPrefix.stdout) {
    const prefix = npmPrefix.stdout.trim();
    candidates.push(path.join(prefix, "codex"), path.join(prefix, "bin", "codex"));
  }

  // Desde node_modules locales
  candidates.push(path.join(process.cwd(), "node_modules", ".bin", "codex"));

  // Rutas conocidas
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, "npm", "codex"));
  }

  // Verificar cada candidato
  for (const candidate of candidates) {
    const resolved = ensureWindowsExecutable(candidate);
    if (canRunCodex(resolved)) {
      return resolved;
    }
  }

  // Último intento con 'codex' simple
  if (canRunCodex(ensureWindowsExecutable("codex"))) {
    return ensureWindowsExecutable("codex");
  }

  return null;
}

// Obtiene la ruta a codex, buscando si es necesario
let _cachedCodexPath = null;
export function getCodexPath() {
  if (_cachedCodexPath === null) {
    _cachedCodexPath = findCodex();
  }
  return _cachedCodexPath;
}

// Verifica si codex está disponible
export function isCodexAvailable() {
  return getCodexPath() !== null;
}

// Registra un mensaje en la salida estándar
export function log(msg) {
  process.stdout.write(`${msg}\n`);
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

// Construye los argumentos para ejecutar codex
function buildCodexArgs(options = {}) {
  const { ephemeral = true, json = false, outputFile = null, fullAuto = true } = options;
  const args = ['exec'];

  if (ephemeral) args.push('--ephemeral');
  if (json) args.push('--json');
  if (fullAuto) args.push('--full-auto');
  if (outputFile) args.push('--output-last-message', outputFile);

  return args;
}

// Ejecuta un comando y retorna el resultado
function executeCommand(cmd, args, options = {}) {
  const { cwd = process.cwd(), encoding = 'utf8' } = options;
  const isWindowsCmd = process.platform === 'win32' && cmd.toLowerCase().endsWith('.cmd');

  if (isWindowsCmd) {
    return spawnSync('cmd.exe', ['/c', cmd, ...args], {
      cwd,
      encoding,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });
  } else {
    return spawnSync(cmd, args, {
      cwd,
      encoding,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      shell: false
    });
  }
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


// Ejecuta codex en modo pasivo con un prompt y retorna el resultado
// options: { targetDir, ephemeral, json, outputFile, fullAuto }
export function runCodexPassive(prompt, options = {}) {
  const codexCmd = getCodexPath();
  if (!codexCmd) {
    throw new Error("Codex no está disponible en el sistema. Para instalarlo globalmente, ejecuta: npm install -g @openai/codex-cli");
  }

  const { targetDir = process.cwd(), ephemeral = true, json = false, outputFile = null, fullAuto = true } = options;

  // Validar configuración antes de ejecutar
  const configCheck = validateCodexConfig();
  if (!configCheck.valid) {
    throw new Error(`Configuración de Codex inválida: ${configCheck.message}`);
  }

  log("");
  log("Ejecutando Codex en modo pasivo...");
  log(`Usando: ${codexCmd}`);
  log(`Prompt: ${prompt}`);
  log("");

  const processedPrompt = preparePrompt(prompt);
  const args = buildCodexArgs({ ephemeral, json, outputFile, fullAuto });
  args.push(processedPrompt);

  const result = executeCommand(codexCmd, args, { cwd: targetDir });

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
}


// Ejecuta codex en modo interactivo con un prompt personalizado
// options: { targetDir }
export async function runCodex(prompt, options = {}) {
  const codexCmd = getCodexPath();
  if (!codexCmd) {
    throw new Error("Codex no está disponible en el sistema. Para instalarlo globalmente, ejecuta: npm install -g @openai/codex-cli");
  }

  const { targetDir = process.cwd() } = options;

  log("");
  log("Iniciando Codex en modo interactivo...");
  log(`Usando: ${codexCmd}`);
  log("");

  const processedPrompt = preparePrompt(prompt);
  const ext = path.extname(codexCmd).toLowerCase();
  const useShell = process.platform === "win32" && (ext === ".cmd" || ext === ".ps1");

  const child = spawn(codexCmd, [processedPrompt], {
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