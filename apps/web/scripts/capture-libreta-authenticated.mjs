// Script puntual de QA: inicia sesión y captura /app/libreta para comparar
// visualmente contra docs/references/. No es parte del flujo de build.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const outDir = process.argv[2] ?? '.qa/screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.getByLabel('Usuario o correo').fill('owner');
await page.getByRole('textbox', { name: 'Contraseña' }).fill('CambiaEsto123!');
await page.getByRole('button', { name: 'Entrar' }).click();
await page.waitForTimeout(1500);
console.log('URL after login:', page.url());
console.log('Body text:', (await page.textContent('body'))?.slice(0, 300));

const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
);

await page.screenshot({ path: `${outDir}/libreta-authenticated-desktop.png`, fullPage: true });
console.log(`overflow=${overflow} errors=${errors.length}`);
if (errors.length) console.log(errors.join('\n'));

// Viewports adicionales para comparar responsividad del prototipo.
for (const [name, width, height] of [
  ['tablet', 1024, 900],
  ['mobile', 390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${outDir}/libreta-authenticated-${name}.png`, fullPage: true });
}

await browser.close();
