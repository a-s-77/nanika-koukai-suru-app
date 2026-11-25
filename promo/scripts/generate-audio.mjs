import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMO_DIR = path.resolve(__dirname, '..');
const CAPTURES_DIR = path.join(PROMO_DIR, 'captures');

fs.mkdirSync(CAPTURES_DIR, { recursive: true });

const SR = 44100;

function writeWavStereo(filePath, left, right) {
  const numSamples = left.length;
  const dataBytes = numSamples * 4;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < numSamples; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  fs.writeFileSync(filePath, buf);
}

function addTone(L, R, startSec, durSec, freqStart, freqEnd, amp, pan = 0, wave = 'sine') {
  const s0 = Math.max(0, Math.floor(startSec * SR));
  const len = Math.floor(durSec * SR);
  const gL = Math.cos(((pan + 1) * Math.PI) / 4);
  const gR = Math.sin(((pan + 1) * Math.PI) / 4);
  let phase = 0;
  for (let i = 0; i < len && s0 + i < L.length; i++) {
    const p = i / len;
    const freq = freqStart + (freqEnd - freqStart) * p;
    phase += (2 * Math.PI * freq) / SR;
    const env = Math.min(1, i / (0.008 * SR)) * Math.exp(-3.8 * p);
    let sample = 0;
    if (wave === 'sine') sample = Math.sin(phase);
    else if (wave === 'tri') sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (wave === 'saw') sample = ((phase / Math.PI) % 2) - 1;
    else if (wave === 'square') sample = Math.sin(phase) >= 0 ? 1 : -1;
    const v = sample * amp * env;
    L[s0 + i] += v * gL;
    R[s0 + i] += v * gR;
  }
}

function addNoiseBurst(L, R, startSec, durSec, amp, pan = 0, hpAlpha = 0.85) {
  const s0 = Math.max(0, Math.floor(startSec * SR));
  const len = Math.floor(durSec * SR);
  const gL = Math.cos(((pan + 1) * Math.PI) / 4);
  const gR = Math.sin(((pan + 1) * Math.PI) / 4);
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < len && s0 + i < L.length; i++) {
    const n = Math.random() * 2 - 1;
    const hp = hpAlpha * (prevOut + n - prevIn);
    prevIn = n;
    prevOut = hp;
    const p = i / len;
    const env = Math.exp(-5.5 * p);
    const v = hp * amp * env;
    L[s0 + i] += v * gL;
    R[s0 + i] += v * gR;
  }
}

function synthesizeBgm(durationSec, isShorts) {
  const N = Math.floor(durationSec * SR);
  const L = new Float32Array(N);
  const R = new Float32Array(N);

  const bpm = 128;
  const beat = 60 / bpm;
  const dropAt = isShorts ? 3.2 : 4.2;
  const outroFadeStart = durationSec - 2.2;

  // 1. Intro Tension Heartbeat + Riser
  let t = 0.25;
  while (t < dropAt - 0.15) {
    const prog = t / dropAt;
    addTone(L, R, t, 0.16, 88, 38, 0.34, 0, 'sine');
    addTone(L, R, t + 0.14, 0.12, 72, 34, 0.18, 0, 'sine');
    addTone(L, R, t, 0.025, 1100, 620, 0.06, 0.15, 'tri');
    t += 0.72 - prog * 0.34;
  }
  // Riser sweep before drop
  addTone(L, R, Math.max(0.2, dropAt - 2.0), 1.95, 110, 880, 0.11, 0, 'saw');

  // 2. Main 128 BPM Lab Electronic Groove
  const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 65.41]; // A1 groove
  const arpNotes = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 587.33, 440];
  let step = 0;
  for (let bt = dropAt; bt < durationSec - 0.5; bt += beat / 2) {
    const fadeFactor = bt > outroFadeStart ? Math.max(0.15, 1 - (bt - outroFadeStart) / 2.4) : 1;
    const isQuarter = step % 2 === 0;
    const isSnare = step % 4 === 2;

    if (isQuarter) {
      addTone(L, R, bt, 0.19, 130, 42, 0.34 * fadeFactor, 0, 'sine');
    }
    if (isSnare) {
      addNoiseBurst(L, R, bt, 0.14, 0.16 * fadeFactor, 0, 0.72);
      addTone(L, R, bt, 0.08, 220, 110, 0.1 * fadeFactor, 0, 'tri');
    }
    // Crisp offbeat hi-hat
    addNoiseBurst(L, R, bt + beat / 4, 0.045, 0.055 * fadeFactor, (step % 2 === 0 ? -0.35 : 0.35), 0.92);

    // Driving bassline
    const bFreq = bassNotes[Math.floor(step / 2) % bassNotes.length];
    addTone(L, R, bt, 0.18, bFreq, bFreq * 0.99, 0.16 * fadeFactor, 0, 'saw');

    // Lab pluck arp
    const aFreq = arpNotes[step % arpNotes.length];
    addTone(L, R, bt, 0.14, aFreq, aFreq, 0.055 * fadeFactor, step % 2 === 0 ? -0.4 : 0.4, 'tri');

    step++;
  }

  // 3. Frame-Synced Foley SFX
  if (!isShorts) {
    // Sub drop impact @ 4.2s
    addTone(L, R, 4.2, 0.55, 120, 32, 0.45, 0, 'sine');
    // Chrono masked beep @ 8.6s
    addTone(L, R, 8.6, 0.12, 920, 440, 0.18, 0, 'tri');
    // Unread notification pops @ 11.5s & 12.6s
    addTone(L, R, 11.5, 0.09, 880, 1318, 0.16, 0.2, 'sine');
    addTone(L, R, 12.6, 0.09, 988, 1568, 0.18, -0.2, 'sine');
    // Crooked frame ticks @ 14.5s
    for (let k = 0; k < 5; k++) addTone(L, R, 14.3 + k * 0.22, 0.02, 1100 + k * 50, 500, 0.11, 0, 'sine');
    // Freehand brush whoosh @ 16.8s
    addNoiseBurst(L, R, 16.8, 0.45, 0.14, 0.1, 0.55);
    // Greed reactor rise & HUGE OVERLOAD BOOM @ 21.1s
    addTone(L, R, 19.1, 1.95, 95, 420, 0.18, 0, 'saw');
    addTone(L, R, 21.1, 0.72, 130, 26, 0.52, 0, 'sine');
    addNoiseBurst(L, R, 21.1, 0.58, 0.28, 0, 0.4);
    // Synesthesia crystal shimmer @ 22.2s
    [659.25, 987.77, 1479.98, 1864.66].forEach((f, idx) =>
      addTone(L, R, 22.2 + idx * 0.22, 0.35, f, f, 0.12, (idx - 1.5) * 0.3, 'sine'),
    );
    // Reveal chord @ 24.5s (Cmaj9)
    [261.63, 329.63, 392.0, 493.88, 587.33].forEach((f, idx) =>
      addTone(L, R, 24.5 + idx * 0.04, 1.2, f, f, 0.11, (idx - 2) * 0.25, 'tri'),
    );
    // Friend Sync harmonic chime @ 34.2s
    [523.25, 783.99, 1046.5].forEach((f, idx) =>
      addTone(L, R, 34.2 + idx * 0.06, 0.9, f, f, 0.12, 0, 'sine'),
    );
  } else {
    addTone(L, R, 3.2, 0.5, 120, 32, 0.42, 0, 'sine');
    addTone(L, R, 6.2, 0.09, 880, 1318, 0.18, 0, 'sine');
    addTone(L, R, 11.4, 1.6, 100, 390, 0.18, 0, 'saw');
    addTone(L, R, 13.0, 0.65, 130, 28, 0.48, 0, 'sine');
    addNoiseBurst(L, R, 13.0, 0.5, 0.25, 0, 0.4);
    [261.63, 392.0, 493.88, 587.33].forEach((f, idx) =>
      addTone(L, R, 16.5 + idx * 0.04, 1.0, f, f, 0.11, 0, 'tri'),
    );
    addTone(L, R, 21.5, 0.7, 523.25, 1046.5, 0.14, 0, 'sine');
  }

  // Soft limiter & tail fade
  const tailSamples = Math.floor(1.0 * SR);
  for (let i = 0; i < N; i++) {
    if (i > N - tailSamples) {
      const f = (N - i) / tailSamples;
      L[i] *= f;
      R[i] *= f;
    }
    L[i] = Math.tanh(L[i] * 0.92);
    R[i] = Math.tanh(R[i] * 0.92);
  }

  return { L, R };
}

function generateJapaneseVoiceovers() {
  const lines = [
    { file: 'vo_1.wav', text: '言葉は、嘘をつく。' },
    { file: 'vo_2.wav', text: 'でも、0.1秒の迷いは、嘘をつかない。' },
    { file: 'vo_3.wav', text: '質問ゼロ。60秒で無意識を暴く、マインドプリント。' },
    { file: 'vo_4.wav', text: 'カーソルの震えも、欲望の限界も、すべて実測。' },
    { file: 'vo_5.wav', text: '今すぐ無料で、あなたの行動指紋をスキャンしよう。' },
  ];

  const psCommands = lines
    .map((item) => {
      const outPath = path.join(CAPTURES_DIR, item.file);
      const safeText = item.text.replace(/'/g, "''");
      return `
$synth.SetOutputToWaveFile('${outPath}');
$synth.Speak('${safeText}');
$synth.SetOutputToNull();`;
    })
    .join('\n');

  const script = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
if ($voices -contains 'Microsoft Sayaka') { $synth.SelectVoice('Microsoft Sayaka') }
elseif ($voices -contains 'Microsoft Haruka') { $synth.SelectVoice('Microsoft Haruka') }
elseif ($voices -contains 'Microsoft Haruka Desktop') { $synth.SelectVoice('Microsoft Haruka Desktop') }
$synth.Rate = 1
$synth.Volume = 100
${psCommands}
$synth.Dispose()
`;

  const scriptPath = path.join(CAPTURES_DIR, 'tts.ps1');
  fs.writeFileSync(scriptPath, '\uFEFF' + script, 'utf8');
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
    stdio: 'inherit',
  });
}

function mixBgmAndVo(bgmPath, cues, outPath) {
  // cues: Array<{ file, delayMs }>
  const inputs = ['-i', bgmPath];
  for (const c of cues) {
    inputs.push('-i', path.join(CAPTURES_DIR, c.file));
  }

  const filterParts = [];
  const mixLabels = ['[0:a]volume=0.82[bgm]'];
  const mixRefs = ['[bgm]'];

  cues.forEach((c, idx) => {
    const inIdx = idx + 1;
    const label = `vo${inIdx}`;
    filterParts.push(
      `[${inIdx}:a]aresample=44100,aformat=channel_layouts=stereo,highpass=f=210,lowpass=f=5400,acompressor=threshold=-16dB:ratio=3:attack=5:release=60,volume=1.65,adelay=${c.delayMs}|${c.delayMs}[${label}]`,
    );
    mixRefs.push(`[${label}]`);
  });

  const filterComplex = [
    ...mixLabels,
    ...filterParts,
    `${mixRefs.join('')}amix=inputs=${mixRefs.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[out]`,
  ].join(';');

  const res = spawnSync(
    ffmpegPath,
    ['-y', ...inputs, '-filter_complex', filterComplex, '-map', '[out]', '-c:a', 'pcm_s16le', outPath],
    { stdio: 'inherit' },
  );
  if (res.status !== 0) {
    throw new Error(`ffmpeg audio mix failed for ${outPath}`);
  }
}

function main() {
  console.log('Generating Japanese voiceover clips via Windows SAPI...');
  generateJapaneseVoiceovers();

  console.log('Synthesizing 42s YouTube BGM + SFX...');
  const ytBgm = synthesizeBgm(42.0, false);
  const ytBgmPath = path.join(CAPTURES_DIR, 'bgm_youtube.wav');
  writeWavStereo(ytBgmPath, ytBgm.L, ytBgm.R);

  console.log('Synthesizing 28s Shorts BGM + SFX...');
  const shBgm = synthesizeBgm(28.0, true);
  const shBgmPath = path.join(CAPTURES_DIR, 'bgm_shorts.wav');
  writeWavStereo(shBgmPath, shBgm.L, shBgm.R);

  console.log('Mixing master YouTube soundtrack...');
  mixBgmAndVo(
    ytBgmPath,
    [
      { file: 'vo_1.wav', delayMs: 500 },
      { file: 'vo_2.wav', delayMs: 2100 },
      { file: 'vo_3.wav', delayMs: 4600 },
      { file: 'vo_4.wav', delayMs: 11200 },
      { file: 'vo_5.wav', delayMs: 37600 },
    ],
    path.join(CAPTURES_DIR, 'master_youtube.wav'),
  );

  console.log('Mixing master Shorts soundtrack...');
  mixBgmAndVo(
    shBgmPath,
    [
      { file: 'vo_1.wav', delayMs: 200 },
      { file: 'vo_2.wav', delayMs: 1400 },
      { file: 'vo_3.wav', delayMs: 3500 },
      { file: 'vo_5.wav', delayMs: 24500 },
    ],
    path.join(CAPTURES_DIR, 'master_shorts.wav'),
  );

  console.log('Audio generation complete!');
}

main();
