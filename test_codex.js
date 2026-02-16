import { runCodexPassive, isCodexAvailable, validateCodexConfig } from './codex_utils.js';

// Suprimir warnings de deprecation para una salida limpia
process.noDeprecation = true;

if (!isCodexAvailable()) {
  console.error('Codex no está disponible. Asegúrate de que esté instalado y en PATH.');
  console.error('Instala con: npm install -g @openai/codex-cli');
  process.exit(1);
}

// Verificar configuración antes de proceder
const configCheck = validateCodexConfig();
if (!configCheck.valid) {
  console.error('Error de configuración de Codex:', configCheck.message);
  process.exit(1);
}

const prompt = 'What is Node.js in one sentence?';
const options = {
  targetDir: process.cwd(),
  ephemeral: true,
  json: false
};

console.log('Iniciando prueba de runCodexPassive...');
console.log(`Prompt: ${prompt}`);
console.log(`Opciones:`, options);

try {
  const result = runCodexPassive(prompt, options);
  console.log('Resultado exitoso:');
  console.log(result);
} catch (error) {
  console.error('Error durante la prueba:', error.message);
}