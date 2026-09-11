// Borra la base SQLite local para dejar la demo limpia entre clases.
// `npm run db:reset` corre esto y después vuelve a llamar a `npm run setup`
// (que recrea la BD, corre las migraciones y carga el seed).
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
