// Crea el .env si no existe (con un JWT_SECRET random) y no toca nada si ya
// existe uno. El secreto se genera acá, en la máquina de cada instalación,
// para que nunca quede uno commiteado en git.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');

function generateSecret(): string {
  return crypto.randomBytes(48).toString('hex');
}

function main() {
  if (fs.existsSync(ENV_PATH)) {
    console.log('.env ya existe, no se toca. Borralo si querés regenerar el JWT_SECRET.');
    return;
  }

  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    console.error('No se encontró .env.example');
    process.exit(1);
  }

  const template = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
  const withSecret = template.replace(
    /^JWT_SECRET=.*$/m,
    `JWT_SECRET="${generateSecret()}"`,
  );

  fs.writeFileSync(ENV_PATH, withSecret);
  console.log('.env creado a partir de .env.example, con un JWT_SECRET aleatorio nuevo.');
}

main();
