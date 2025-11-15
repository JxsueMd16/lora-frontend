import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const distDir = join(rootDir, 'dist');
const wwwDir = join(rootDir, 'www');

// Eliminar www si existe
if (fs.existsSync(wwwDir)) {
  fs.rmSync(wwwDir, { recursive: true, force: true });
}

// Copiar dist a www
fs.cpSync(distDir, wwwDir, { recursive: true });

console.log('✓ Copiado dist a www');

