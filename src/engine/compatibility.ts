import type {
  AxisKey,
  CompatibilityResult,
  Locale,
  MindprintReport,
  SharePayload,
} from '../types/mindprint';
import { AXIS_ORDER } from '../i18n/translations';
import { ARCHETYPES } from './archetypes';
import { payloadToAxes } from './shareCodec';
import { clamp } from './scoring';

export function computeCompatibility(
  mine: MindprintReport,
  target: SharePayload,
  locale: Locale,
): CompatibilityResult {
  const isJa = locale === 'ja';
  const targetAxes = payloadToAxes(target);
  const targetArch = ARCHETYPES[target.a] ?? ARCHETYPES[15];
  const targetName = target.n.trim() || (isJa ? '相手' : 'Target');
  const myName = mine.nickname.trim() || (isJa ? 'あなた' : 'You');

  const axisDiffs = {} as Record<AxisKey, number>;
  let sumAbsDiff = 0;

  for (const k of AXIS_ORDER) {
    const diff = Math.abs(mine.axes[k] - targetAxes[k]);
    axisDiffs[k] = diff;
    sumAbsDiff += diff;
  }

  const avgDiff = sumAbsDiff / AXIS_ORDER.length;
  const similarity = clamp(100 - avgDiff * 1.45, 12, 99);

  // Complementary chemistry bonus: one high-risk + one high-order, or balanced precision/impulse
  const accelBrakeGap =
    Math.abs(mine.axes.risk - targetAxes.risk) > 30 &&
    (mine.axes.order > 62 || targetAxes.order > 62);
  const resonanceMatch = Math.abs(mine.axes.resonance - targetAxes.resonance) <= 16;

  let syncScore = similarity + (accelBrakeGap ? 9 : 0) + (resonanceMatch ? 6 : 0);
  if (mine.archetype.index === target.a) {
    syncScore = Math.max(syncScore, 88);
  }
  syncScore = Math.round(clamp(syncScore, 18, 99));

  let pairTitle: string;
  let pairSubtitle: string;

  if (syncScore >= 86) {
    pairTitle = isJa ? '鏡面共犯者・シンクロ極大ペア' : 'Mirror Accomplices // Hyper-Sync';
    pairSubtitle = isJa
      ? '言葉で説明する前に、同じタイミングで同じ結論に指が動く脳波同調コンビ'
      : 'Two subconscious clocks beating on almost the exact same carrier frequency.';
  } else if (accelBrakeGap && syncScore >= 58) {
    pairTitle = isJa ? 'アクセルとブレーキの奇跡的噛み合い' : 'Accelerator & Precision Brake';
    pairSubtitle = isJa
      ? '片方が限界まで突っ込み、片方が0.1mm単位で帳尻を合わせる最強補完ペア'
      : 'One pushes into the red zone while the other steers cleanly around the blast radius.';
  } else if (
    Math.abs(mine.axes.precision - targetAxes.precision) <= 14 &&
    mine.axes.precision >= 68
  ) {
    pairTitle = isJa ? '0.1mmを争う美学ライバル' : 'Sub-Pixel Aesthetics Rivals';
    pairSubtitle = isJa
      ? '細部への執念が互角。組めば無敵、議論すればミリ単位のこだわり対決'
      : 'Twin perfectionists who spot invisible tilt at 50 paces.';
  } else if (syncScore >= 60) {
    pairTitle = isJa ? '好相性・心地よい非対称ハーモニー' : 'Complementary Asymmetric Duo';
    pairSubtitle = isJa
      ? '似ている核を持ちながら、死角だけを綺麗に補い合えるバランス関係'
      : 'Aligned at the core, offset just enough to cover each other’s blind spots.';
  } else {
    pairTitle = isJa ? '別次元から交信する異星人ペア' : 'Cross-Dimension Alien Pair';
    pairSubtitle = isJa
      ? '体内時計もリスク感覚も真逆。だからこそ予測不能な化学反応が起きる組み合わせ'
      : 'Opposite internal clocks and risk thresholds—guaranteed zero boring conversations.';
  }

  const dynamics: string[] = [];

  // Dynamic 1: Forbidden Button contrast
  const myPressed = mine.raw.forbidden.pressed;
  const targetPressed = target.m.fp === 1;
  if (myPressed && targetPressed) {
    dynamics.push(
      isJa
        ? `禁断ボタンは2人とも仲良く陥落。禁止看板を見たら一緒に押してしまう完全な共犯者です。`
        : `Both of you smashed the Forbidden Button. Zero impulse control when left unattended together.`,
    );
  } else if (!myPressed && !targetPressed) {
    dynamics.push(
      isJa
        ? `2人とも7秒間の誘惑を完全ブロック。冷静さに関しては信頼できる鉄壁コンビです。`
        : `Neither caved to the Forbidden Button—a rare pair immune to cheap psychological bait.`,
    );
  } else {
    const culprit = myPressed ? myName : targetName;
    const guardian = myPressed ? targetName : myName;
    dynamics.push(
      isJa
        ? `${culprit}が「押すな」を押してしまい、${guardian}が冷静にため息をつきながら後始末する構図が見えます。`
        : `${culprit} is definitely the one pushing the red warning button while ${guardian} calmly handles the fallout.`,
    );
  }

  // Dynamic 2: Internal clock gap
  const myErr = mine.raw.chrono.errorMs;
  const targetErr = target.m.ce;
  const clockDiffSec = (Math.abs(myErr - targetErr) / 1000).toFixed(2);
  if (Math.abs(myErr - targetErr) <= 450) {
    dynamics.push(
      isJa
        ? `体内時計5.00秒の誤差差はわずか${clockDiffSec}秒！作業テンポや会話の「間」が驚くほど一致します。`
        : `Your 5-second internal clocks sit within ${clockDiffSec}s of each other—effortless pacing chemistry.`,
    );
  } else {
    const faster = myErr < targetErr ? myName : targetName;
    const slower = myErr < targetErr ? targetName : myName;
    dynamics.push(
      isJa
        ? `体感クロックが${faster}の方が${clockDiffSec}秒分だけせっかち。${faster}が火をつけ、${slower}が奥行きを作る役割が最適です。`
        : `${faster}'s internal clock runs ${clockDiffSec}s faster than ${slower}'s—great for spark-and-depth teamwork.`,
    );
  }

  // Dynamic 3: Greed Brink vs Archetype flavor
  const myBrink = Math.round(mine.raw.greed.brinkRatio * 100);
  const targetBrink = target.m.gr;
  if (mine.raw.greed.exploded && target.m.ge === 1) {
    dynamics.push(
      isJa
        ? `欲望リアクターは両方オーバーロード爆発。「まだ行ける！」で一緒に崖を飛び越える危険な相性です。`
        : `Both of you detonated the Greed Reactor—spectacular energy, just appoint someone else to watch the brakes.`,
    );
  } else {
    const bolder = myBrink >= targetBrink ? myName : targetName;
    const bolderPct = Math.max(myBrink, targetBrink);
    const saferPct = Math.min(myBrink, targetBrink);
    dynamics.push(
      isJa
        ? `${bolder}が臨界点${bolderPct}%まで攻める一方、相方は${saferPct}%で冷静に撤退（${targetArch.name.ja}との配合）。勝負どころのバランスが絶妙です。`
        : `${bolder} pushed to ${bolderPct}% of the brink vs ${saferPct}% (${targetArch.name.en})—natural risk balance.`,
    );
  }

  return {
    syncScore,
    pairTitle,
    pairSubtitle,
    dynamics,
    axisDiffs,
  };
}
