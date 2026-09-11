// Esto borra la base SQLite local para arrancar de cero. `npm run db:reset`
// corre este script y después llama a `npm run setup`, que recrea la BD,
// aplica las migraciones y carga el seed de nuevo.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const filesToRemove = ['prisma/dev.db', 'prisma/dev.db-journal'];

for (const relativePath of filesToRemove) {
  const fullPath = path.join(ROOT, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath);
    console.log(`Borrado ${relativePath}`);
  }
}
