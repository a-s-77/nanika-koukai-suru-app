import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMO_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(PROMO_DIR, '..');
const CAPTURES_DIR = path.join(PROMO_DIR, 'captures');
const OUTPUT_DIR = path.join(PROMO_DIR, 'output');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });

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

function startStaticPromoServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanPath = (req.url || '/').split('?')[0];
      const rel = cleanPath === '/' ? 'studio/trailer.html' : cleanPath.replace(/^\/+/, '');
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
            : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
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

async function encodeVideo({ page, mode, width, height, durationSec, fps, audioPath, outPath }) {
  const totalFrames = Math.round(durationSec * fps);
  console.log(`Rendering ${mode} (${width}x${height}, ${totalFrames} frames @ ${fps}fps)...`);
  await page.setViewportSize({ width, height });

  const ff = spawn(ffmpegPath, [
    '-y',
    '-f',
    'image2pipe',
    '-vcodec',
    'mjpeg',
    '-r',
    String(fps),
    '-i',
    '-',
    '-i',
    audioPath,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    outPath,
  ]);

  let stderrBuf = '';
  ff.stderr.on('data', (chunk) => {
    stderrBuf += chunk.toString();
  });

  const donePromise = new Promise((resolve, reject) => {
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}:\n${stderrBuf.slice(-1500)}`));
    });
  });

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    const dataUrl = await page.evaluate(
      ({ timeSec, m }) => window.__renderFrame(timeSec, m),
      { timeSec: t, m: mode },
    );
    const base64 = dataUrl.split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    if (!ff.stdin.write(buf)) {
      await new Promise((res) => ff.stdin.once('drain', res));
    }
    if ((i + 1) % 150 === 0 || i + 1 === totalFrames) {
      console.log(`  [${mode}] ${i + 1}/${totalFrames} frames piped`);
    }
  }

  ff.stdin.end();
  await donePromise;
  console.log(`Saved ${outPath}`);
}

function generatePreviewGif(ytVideoPath, outGifPath) {
  console.log('Generating README preview GIF...');
  const palettePath = path.join(CAPTURES_DIR, 'palette.png');
  const filter =
    'select=\'between(t,4.8,6.6)+between(t,11.5,13.3)+between(t,19.6,21.2)+between(t,25.4,27.0)+between(t,33.5,35.1)\',setpts=N/10/TB,scale=640:-1:flags=lanczos';

  const r1 = spawnSync(
    ffmpegPath,
    ['-y', '-i', ytVideoPath, '-vf', `${filter},palettegen=max_colors=96`, palettePath],
    { stdio: 'inherit' },
  );
  if (r1.status !== 0) throw new Error('GIF palettegen failed');

  const r2 = spawnSync(
    ffmpegPath,
    [
      '-y',
      '-i',
      ytVideoPath,
      '-i',
      palettePath,
      '-lavfi',
      `${filter} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3`,
      '-r',
      '10',
      outGifPath,
    ],
    { stdio: 'inherit' },
  );
  if (r2.status !== 0) throw new Error('GIF paletteuse failed');
}

function generateContactSheet(ytVideoPath, outPngPath) {
  console.log('Generating 3x2 visual inspection contact sheet...');
  const timestamps = [6.0, 12.2, 20.5, 28.0, 34.5, 39.5];
  const framePaths = [];

  timestamps.forEach((ts, idx) => {
    const p = path.join(CAPTURES_DIR, `cs_${idx}.png`);
    const r = spawnSync(
      ffmpegPath,
      ['-y', '-ss', String(ts), '-i', ytVideoPath, '-vframes', '1', '-q:v', '2', p],
      { stdio: 'inherit' },
    );
    if (r.status !== 0) throw new Error(`Frame extract failed at ${ts}s`);
    framePaths.push(p);
  });

  const inputs = framePaths.flatMap((p) => ['-i', p]);
  const rGrid = spawnSync(
    ffmpegPath,
    [
      '-y',
      ...inputs,
      '-filter_complex',
      '[0:v]scale=640:360[v0];[1:v]scale=640:360[v1];[2:v]scale=640:360[v2];[3:v]scale=640:360[v3];[4:v]scale=640:360[v4];[5:v]scale=640:360[v5];[v0][v1][v2]hstack=inputs=3[top];[v3][v4][v5]hstack=inputs=3[bot];[top][bot]vstack=inputs=2[out]',
      '-map',
      '[out]',
      outPngPath,
    ],
    { stdio: 'inherit' },
  );
  if (rGrid.status !== 0) throw new Error('Contact sheet assembly failed');
}

async function main() {
  const execPath = findBrowserExecutable();
  const { server, port } = await startStaticPromoServer();
  const browser = await chromium.launch({ executablePath: execPath, headless: true });

  const ytOut = path.join(OUTPUT_DIR, 'mindprint-pr-youtube-1080p.mp4');
  const shOut = path.join(OUTPUT_DIR, 'mindprint-shorts-9x16.mp4');

  try {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}/studio/trailer.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.__initTrailer());

    await encodeVideo({
      page,
      mode: 'youtube',
      width: 1920,
      height: 1080,
      durationSec: 42.0,
      fps: 30,
      audioPath: path.join(CAPTURES_DIR, 'master_youtube.wav'),
      outPath: ytOut,
    });

    await encodeVideo({
      page,
      mode: 'shorts',
      width: 1080,
      height: 1920,
      durationSec: 28.0,
      fps: 30,
      audioPath: path.join(CAPTURES_DIR, 'master_shorts.wav'),
      outPath: shOut,
    });

    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }

  generatePreviewGif(ytOut, path.join(ASSETS_DIR, 'demo-preview.gif'));
  generateContactSheet(ytOut, path.join(CAPTURES_DIR, 'contact-sheet.png'));

  console.log('\n--- STREAM VERIFICATION ---');
  spawnSync(ffmpegPath, ['-i', ytOut], { stdio: 'inherit' });
  spawnSync(ffmpegPath, ['-i', shOut], { stdio: 'inherit' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
