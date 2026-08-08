/**
 * QA visual (§4.9): captura la app en los 4 viewports obligatorios y avisa
 * si hay scroll horizontal o errores de consola. Requiere que `pnpm dev`
 * (o `pnpm --filter web run dev`) esté corriendo en http://localhost:5173.
 *
 * Uso:
 *   node scripts/capture-viewports.mjs <carpeta-salida> [ruta]
 *   node scripts/capture-viewports.mjs .qa/screenshots /app/libreta
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const outDir = process.argv[2] ?? '.qa/screenshots';
const path = process.argv[3] ?? '/app/libreta';
const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://localhost:5173';

mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'desktop-1440x1000', width: 1440, height: 1000 },
  { name: 'laptop-1024x768', width: 1024, height: 768 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
];

const browser = await chromium.launch();
let hadIssues = false;

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  const filePath = `${outDir}/${vp.name}.png`;
  await page.screenshot({ path: filePath, fullPage: true });

  const status = overflow || errors.length > 0 ? '⚠️' : '✅';
  if (overflow || errors.length > 0) hadIssues = true;
  console.log(`${status} ${vp.name}: overflow=${overflow} errors=${errors.length} -> ${filePath}`);
  if (errors.length) console.log('   ', errors.join(' | '));

  await page.close();
}

await browser.close();
process.exit(hadIssues ? 1 : 0);
