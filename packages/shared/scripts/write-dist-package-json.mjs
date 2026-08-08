// Marca cada carpeta de salida con su formato real (CJS/ESM), independiente
// del "type" del package.json raíz del monorepo. Es el patrón estándar para
// publicar un paquete dual sin ambigüedad de módulo para Node/bundlers.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

for (const [dir, type] of [
  ['dist/cjs', 'commonjs'],
  ['dist/esm', 'module'],
]) {
  const fullDir = path.join(rootDir, dir);
  mkdirSync(fullDir, { recursive: true });
  writeFileSync(path.join(fullDir, 'package.json'), JSON.stringify({ type }, null, 2) + '\n');
}
