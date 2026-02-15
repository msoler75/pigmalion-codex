import { runCodexPassive, checkCodexAvailable, validateCodexConfig } from './codex_utils.js';

// Suprimir warnings de deprecation para una salida limpia
process.noDeprecation = true;

const codexCmd = checkCodexAvailable();
if (!codexCmd) {
  console.error('Codex no está disponible. Asegúrate de que esté instalado y en PATH.');
  process.exit(1);
}

// Verificar configuración antes de proceder
const configCheck = validateCodexConfig();
if (!configCheck.valid) {
  console.error('Error de configuración de Codex:', configCheck.message);
  process.exit(1);
}

const prompt = 'What is Node.js in one sentence?';
const targetDir = process.cwd();

console.log('Iniciando prueba de runCodexPassive...');
console.log(`Prompt: ${prompt}`);

try {
  const result = runCodexPassive(codexCmd, targetDir, prompt);
  console.log('Resultado exitoso:');
  console.log(result);
} catch (error) {
  console.error('Error durante la prueba:', error.message);
}