import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMO_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(PROMO_DIR, '..');
const CAPTURES_DIR = path.join(PROMO_DIR, 'captures');
const OUTPUT_DIR = path.join(PROMO_DIR, 'output');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

fs.mkdirSync(CAPTURES_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowserExecutable() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Could not find local Chrome or Edge executable.');
}

function waitForUrl(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timeout waiting for ${url}`));
          } else {
            setTimeout(check, 200);
          }
        });
    };
    check();
  });
}

function startStaticPromoServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanPath = (req.url || '/').split('?')[0];
      const rel = cleanPath === '/' ? 'studio/render-cards.html' : cleanPath.replace(/^\/+/, '');
      const fullPath = path.join(PROMO_DIR, rel);
      if (!fullPath.startsWith(PROMO_DIR) || !fs.existsSync(fullPath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      const mime =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.png'
            ? 'image/png'
            : ext === '.js' || ext === '.mjs'
              ? 'application/javascript'
              : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

async function runFullScan(page, options) {
  const {
    url,
    nickname,
    pressForbidden,
    greedHoldMs,
    capturePrefix,
    captureSync = false,
  } = options;

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const nickInput = page.locator('#specimen-nick');
  await nickInput.fill(nickname);
  if (capturePrefix) {
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(CAPTURES_DIR, `${capturePrefix}landing.png`) });
  }

  // Click primary start CTA
  await page.locator('button:has-text("→")').first().click();

  // MOD 01: Chrono
  await page.locator('button:has-text("計測スタート")').waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('button:has-text("計測スタート")').click();
  await page.waitForTimeout(1850);
  if (capturePrefix === '00_' || capturePrefix === '0') {
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_chrono.png') });
  }
  await page.waitForTimeout(2650);
  await page.locator('button:has-text("STOP")').click();

  // MOD 02: Forbidden Button
  await page.locator('button:has-text("絶対に押すな")').waitFor({ state: 'visible', timeout: 8000 });
  const btn = page.locator('button:has-text("絶対に押すな")');
  const box = await btn.boundingBox();

  if (pressForbidden && box) {
    await page.waitForTimeout(1900);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await btn.click();
  } else if (box) {
    // Realistic orbit hover around the button before badge 99+ appears
    await page.mouse.move(box.x - 60, box.y + box.height / 2, { steps: 8 });
    await page.waitForTimeout(1700);
    await page.mouse.move(box.x + box.width + 18, box.y + box.height * 0.45, { steps: 14 });
    await page.waitForTimeout(3800);
    if (capturePrefix === '00_') {
      await page.screenshot({ path: path.join(CAPTURES_DIR, '02_forbidden.png') });
    } else if (capturePrefix === 'm_') {
      await page.screenshot({ path: path.join(CAPTURES_DIR, 'm_forbidden.png') });
    }
  }

  // MOD 03: Crooked Frame
  await page.locator('button:has-text("これで完全水平")').waitFor({ state: 'visible', timeout: 10000 });
  const plusBtn = page.locator('button:has-text("+0.2°")');
  const minusBtn = page.locator('button:has-text("−0.2°")');
  const slider = page.locator('input[type="range"]');
  await slider.fill('0.6');
  await slider.dispatchEvent('change');
  await minusBtn.click();
  await minusBtn.click();
  await plusBtn.click();
  if (capturePrefix === '00_') {
    await page.screenshot({ path: path.join(CAPTURES_DIR, '03_crooked.png') });
  }
  await page.locator('button:has-text("これで完全水平")').click();

  // MOD 04: Freehand Sanctuary
  const drawCanvas = page.locator('canvas').first();
  await drawCanvas.waitFor({ state: 'visible', timeout: 8000 });
  const cBox = await drawCanvas.boundingBox();
  if (cBox) {
    const cx = cBox.x + cBox.width / 2;
    const cy = cBox.y + cBox.height / 2;
    const rx = Math.min(cBox.width, cBox.height) * 0.28;
    const pointsCount = 24;
    await page.mouse.move(cx + rx, cy);
    await page.mouse.down();
    for (let i = 1; i <= pointsCount; i++) {
      const a = (i / pointsCount) * Math.PI * 2.15;
      const r = rx * (1 - i * 0.012);
      await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r, { steps: 2 });
    }
    if (capturePrefix === '00_') {
      await page.screenshot({ path: path.join(CAPTURES_DIR, '04_freehand.png') });
    }
    await page.mouse.up();
  }

  // MOD 05: Greed Horizon
  const reactor = page.locator('text=REACTOR MULTIPLIER').locator('..').locator('..');
  await reactor.waitFor({ state: 'visible', timeout: 8000 });
  const rBox = await reactor.boundingBox();
  if (rBox) {
    await page.mouse.move(rBox.x + rBox.width / 2, rBox.y + rBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(greedHoldMs);
    if (capturePrefix === '00_') {
      await page.screenshot({ path: path.join(CAPTURES_DIR, '05_greed.png') });
    } else if (capturePrefix === 'm_') {
      await page.screenshot({ path: path.join(CAPTURES_DIR, 'm_greed.png') });
    }
    await page.mouse.up();
  }

  // MOD 06: Synesthesia
  const nextSoundBtn = page.locator('button:has-text("次の音へ")');
  await nextSoundBtn.waitFor({ state: 'visible', timeout: 8000 });
  const synCanvasA = page.locator('canvas').first();
  const sBoxA = await synCanvasA.boundingBox();
  if (sBoxA) {
    await page.mouse.click(sBoxA.x + sBoxA.width * 0.22, sBoxA.y + sBoxA.height * 0.2);
    await page.waitForTimeout(250);
  }
  await nextSoundBtn.click();

  const finishBtn = page.locator('button:has-text("スキャン完了")');
  await finishBtn.waitFor({ state: 'visible', timeout: 8000 });
  const synCanvasB = page.locator('canvas').first();
  const sBoxB = await synCanvasB.boundingBox();
  if (sBoxB) {
    await page.mouse.click(sBoxB.x + sBoxB.width * 0.84, sBoxB.y + sBoxB.height * 0.78);
    await page.waitForTimeout(350);
  }
  if (capturePrefix === '00_') {
    await page.screenshot({ path: path.join(CAPTURES_DIR, '06_synesthesia.png') });
  }
  await finishBtn.click();

  // Results Screen
  const resultMarker = captureSync ? 'text=BRAINWAVE SYNC RATE' : 'text=CAUGHT IN 4K';
  await page.locator(resultMarker).first().waitFor({ state: 'visible', timeout: 12000 });
  await page.waitForTimeout(700);

  if (captureSync) {
    await page.screenshot({ path: path.join(CAPTURES_DIR, '08_results_sync.png') });
  } else if (capturePrefix === '00_') {
    await page.screenshot({ path: path.join(CAPTURES_DIR, '07_results_spec.png') });
  } else if (capturePrefix === 'm_') {
    await page.screenshot({ path: path.join(CAPTURES_DIR, 'm_results.png') });
  }

  // Extract share URL via copy button
  const copyBtn = page.locator('button:has-text("脳波シンクロ率")');
  await copyBtn.click();
  await page.waitForTimeout(150);
  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
  return shareUrl;
}

async function main() {
  const execPath = findBrowserExecutable();
  console.log('Using browser:', execPath);

  const viteBin = path.join(ROOT_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const previewProc = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'],
    { cwd: ROOT_DIR, stdio: 'pipe' },
  );

  const { server: cardServer, port: cardPort } = await startStaticPromoServer();
  const browser = await chromium.launch({ executablePath: execPath, headless: true });

  try {
    await waitForUrl('http://127.0.0.1:4173/');

    // 1. Render Thumbnail (1280x720) & OGP Social Card (1200x630)
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:${cardPort}/studio/render-cards.html`, { waitUntil: 'networkidle' });
      await p.evaluate(() => window.__renderThumb());
      await p.locator('#c').screenshot({ path: path.join(OUTPUT_DIR, 'youtube-thumbnail-1280x720.png') });

      await p.setViewportSize({ width: 1200, height: 630 });
      await p.evaluate(() => window.__renderOgp());
      await p.locator('#c').screenshot({ path: path.join(PUBLIC_DIR, 'og-image.png') });
      await ctx.close();
      console.log('Rendered YouTube thumbnail and OGP card.');
    }

    if (process.argv.includes('--cards-only')) {
      return;
    }

    // 2. Capture Desktop Live Scan (#1 HARUKI -> 00..07)
    let harukiShareUrl = '';
    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      });
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: 'http://127.0.0.1:4173',
      });
      const p = await ctx.newPage();
      harukiShareUrl = await runFullScan(p, {
        url: 'http://127.0.0.1:4173/',
        nickname: 'HARUKI',
        pressForbidden: false,
        greedHoldMs: 1850,
        capturePrefix: '00_',
      });
      await ctx.close();
      console.log('Desktop run #1 captured. Share URL length:', harukiShareUrl.length);
    }

    // 3. Capture Desktop Friend Sync Screen (#2 REN opening HARUKI's ?c= link)
    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      });
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: 'http://127.0.0.1:4173',
      });
      const p = await ctx.newPage();
      await runFullScan(p, {
        url: harukiShareUrl,
        nickname: 'REN',
        pressForbidden: true,
        greedHoldMs: 1400,
        capturePrefix: '',
        captureSync: true,
      });
      await ctx.close();
      console.log('Desktop run #2 (Friend Sync) captured.');
    }

    // 4. Capture Mobile Screenshots (430x840) for 9:16 Shorts
    {
      const ctx = await browser.newContext({
        viewport: { width: 430, height: 840 },
        deviceScaleFactor: 2,
        hasTouch: true,
      });
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: 'http://127.0.0.1:4173',
      });
      const p = await ctx.newPage();
      await runFullScan(p, {
        url: 'http://127.0.0.1:4173/',
        nickname: 'MIO',
        pressForbidden: false,
        greedHoldMs: 1850,
        capturePrefix: 'm_',
      });
      await ctx.close();
      console.log('Mobile captures finished.');
    }
  } finally {
    await browser.close();
    cardServer.close();
    previewProc.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
