import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

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

// Ejecuta codex en modo interactivo con un prompt personalizado (opcional)
export async function runCodex(codexCmd, targetDir, prompt) {
  const setupPath = path.join(targetDir, "SETUP.md");

  log("");
  log("Iniciando Codex en modo interactivo...");
  log(`Usando: ${codexCmd}`);
  log("");

  if (!prompt) {
    prompt = `"Lee y sigue estrictamente SETUP.md en: ${setupPath} y luego termina."`;
  }

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