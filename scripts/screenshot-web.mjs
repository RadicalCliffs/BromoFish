#!/usr/bin/env node
/**
 * Drives the exported web build in a real browser and captures the key screens.
 *
 * A build that compiles is not the same as a build that renders, so this walks the actual
 * flows a user walks, fails loudly on any page error, and leaves PNGs behind for review.
 *
 * Usage: npm run build:web && node scripts/screenshot-web.mjs dist screenshots
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.argv[2] ?? 'dist';
const OUT = process.argv[3] ?? 'screenshots';
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(ROOT, url === '/' ? 'index.html' : url);
  if (!existsSync(file) || !extname(file)) file = join(ROOT, 'index.html'); // SPA fallback
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((r) => server.listen(4173, r));

// Resolve the preinstalled browser rather than downloading one; the exact versioned directory
// name changes between images, so take the first chromium build that is actually present.
const findChromium = () => {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(root)) return undefined;
  for (const dir of readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
    const bin = join(root, dir, 'chrome-linux', 'chrome');
    if (existsSync(bin)) return bin;
  }
  return undefined;
};

const browser = await chromium.launch({ executablePath: findChromium(), args: ['--no-sandbox'] });

const errors = [];
const shoot = async (name, steps, colorScheme = 'dark') => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name} console: ${m.text().slice(0, 200)}`); });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  if (steps) await steps(page);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  await ctx.close();
  console.log(`shot ${name}`);
};

const tap = async (page, text, wait = 1800) => {
  const el = page.getByText(text, { exact: false }).first();
  await el.waitFor({ timeout: 10000 });
  await el.click();
  await page.waitForTimeout(wait);
};

await shoot('01-welcome-dark', null, 'dark');
await shoot('02-welcome-light', null, 'light');
await shoot('03-feed', async (p) => { await tap(p, 'Look around first', 3000); });
await shoot('04-feed-scrolled', async (p) => {
  await tap(p, 'Look around first', 3000);
  await p.mouse.move(195, 600);
  await p.mouse.wheel(0, 844 * 2);
  await p.waitForTimeout(2000);
});
await shoot('05-discover', async (p) => { await tap(p, 'Look around first', 3000); await tap(p, 'Discover', 2500); });
await shoot('06-signup', async (p) => { await tap(p, 'Create your account', 2500); });

await browser.close();
server.close();
if (errors.length) {
  console.error(`\nPAGE ERRORS:\n${[...new Set(errors)].slice(0, 10).join('\n')}`);
  process.exit(1);
}
console.log('\nNo page errors.');
