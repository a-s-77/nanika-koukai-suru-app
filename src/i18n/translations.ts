import type { AxisKey, Locale } from '../types/mindprint';

export const AXIS_ORDER: AxisKey[] = [
  'impulse',
  'precision',
  'tempo',
  'risk',
  'order',
  'resonance',
];

export interface Dictionary {
  appName: string;
  appSubtitle: string;
  heroBadge: string;
  heroTitleA: string;
  heroTitleB: string;
  heroLead: string;
  heroSubLead: string;
  taglineQuote: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  modeDaily: string;
  modeDailyDesc: string;
  modeFree: string;
  modeFreeDesc: string;
  startScan: string;
  startSyncScan: string;
  syncInviteBadge: string;
  syncInviteTitle: string;
  syncInviteDesc: string;
  modulesStripTitle: string;
  historyTitle: string;
  historyClear: string;
  historyEmpty: string;
  moduleMeta: Array<{
    code: string;
    title: string;
    teaser: string;
    shortLabel: string;
  }>;
  header: {
    daily: string;
    free: string;
    syncingWith: string;
    soundOn: string;
    soundOff: string;
    exitConfirm: string;
  };
  transition: {
    calibrating: string;
    modulePrefix: string;
    ready: string;
  };
  compiling: {
    title: string;
    steps: string[];
  };
  axes: Record<
    AxisKey,
    {
      label: string;
      short: string;
      low: string;
      high: string;
    }
  >;
  chrono: {
    instruction: string;
    sub: string;
    startBtn: string;
    stopBtn: string;
    spaceHint: string;
    maskedNote: string;
    pulledBadge: string;
    immuneBadge: string;
    targetLine: string;
  };
  forbidden: {
    instruction: string;
    sub: string;
    buttonText: string;
    bait1: string;
    bait2: string;
    bait3: string;
    caughtTitle: string;
    caughtPrefix: string;
    resistedTitle: string;
    resistedMousePrefix: string;
    resistedTouchPrefix: string;
    secondsSuffix: string;
  };
  crooked: {
    instruction: string;
    sub: string;
    dragHint: string;
    lockBtn: string;
    autoLocked: string;
    posterHeader: string;
    posterBody: string;
    residualPrefix: string;
    perfectTag: string;
  };
  freehand: {
    instruction: string;
    sub: string;
    drawHint: string;
    tooShort: string;
    doneLabel: string;
    smoothness: string;
    closedness: string;
  };
  greed: {
    instruction: string;
    sub: string;
    holdPrompt: string;
    releaseHint: string;
    tapTooShort: string;
    explodedTitle: string;
    explodedSub: string;
    bankedTitle: string;
    marginPrefix: string;
  };
  synesthesia: {
    instruction: string;
    soundALabel: string;
    soundBLabel: string;
    soundADesc: string;
    soundBDesc: string;
    mutedCaptionA: string;
    mutedCaptionB: string;
    dragHint: string;
    axisXLeft: string;
    axisXRight: string;
    axisYBottom: string;
    axisYTop: string;
    lockBtn: string;
    nextSoundBtn: string;
  };
  results: {
    tabSync: string;
    tabMySpec: string;
    specimenHeader: string;
    fingerprintLabel: string;
    evidenceTitle: string;
    evidenceSubtitle: string;
    radarTitle: string;
    manualTitle: string;
    manualStrength: string;
    manualWeakness: string;
    manualEnvironment: string;
    replayTitle: string;
    replayBtn: string;
    replayForbiddenLabel: string;
    replayStrokeLabel: string;
    sharePanelTitle: string;
    themePaper: string;
    themeObsidian: string;
    downloadPng: string;
    downloadingPng: string;
    downloadDualPng: string;
    shareX: string;
    shareSyncX: string;
    copyLink: string;
    copiedLink: string;
    retakeScan: string;
    syncHeadline: string;
    syncYou: string;
    syncFriend: string;
    syncDynamicsTitle: string;
    anonymous: string;
  };
}

export const TRANSLATIONS: Record<Locale, Dictionary> = {
  ja: {
    appName: 'MINDPRINT',
    appSubtitle: 'PSYCHOPHYSICS BEHAVIOR LAB',
    heroBadge: 'ZERO-QUESTION BEHAVIORAL OS SCAN',
    heroTitleA: '質問ゼロ。',
    heroTitleB: 'あなたの「無意識のOS」を丸裸にする。',
    heroLead:
      '選択式アンケートは自己申告の理想像しか測れない。6つの触覚マイクロ実験で、0.1秒の迷い・カーソルの震え・欲望の限界点から本性を実測します。',
    heroSubLead: '所要時間 約60秒 // 登録不要 // 完全クライアント処理',
    taglineQuote: '「言葉は嘘をつく。0.1秒の迷いは嘘をつかない。」',
    nicknameLabel: 'SPECIMEN NAME（任意）',
    nicknamePlaceholder: '名無しの被験者',
    modeDaily: 'DAILY LAB（今日の共通実験）',
    modeDailyDesc: '全ユーザー同一の罠パラメータ。日別比較に最適。',
    modeFree: 'FREE RUN（ランダム乱数）',
    modeFreeDesc: '毎回異なるシード値で何度でも計測。',
    startScan: 'スキャンを開始する（約60秒）',
    startSyncScan: 'スキャンしてシンクロ率を測る',
    syncInviteBadge: 'INCOMING BRAINWAVE // 対戦・相性リンク受信',
    syncInviteTitle: 'から行動指紋が届いています',
    syncInviteDesc:
      'あなたの60秒スキャンを完了すると、2人の無意識シンクロ率と相性レポートがその場で解放されます。',
    modulesStripTitle: '6つの心理物理プロトコル（各5〜10秒）',
    historyTitle: '過去の行動指紋アーカイブ',
    historyClear: '履歴を消去',
    historyEmpty: 'まだ計測履歴はありません',
    moduleMeta: [
      {
        code: 'MOD-01',
        title: 'ブラインド・クロノ',
        teaser: '体内時計の歪みを測定',
        shortLabel: '体内時計',
      },
      {
        code: 'MOD-02',
        title: '禁断のボタン',
        teaser: '衝動と視線トラッキング',
        shortLabel: '禁断衝動',
      },
      {
        code: 'MOD-03',
        title: '傾いた額縁',
        teaser: '微細補正と完璧主義',
        shortLabel: '完璧主義',
      },
      {
        code: 'MOD-04',
        title: '1ストローク聖域',
        teaser: '無意識の筆致ジオメトリ',
        shortLabel: '筆致形状',
      },
      {
        code: 'MOD-05',
        title: '欲望の臨界点',
        teaser: 'リスク限界と指先の震え',
        shortLabel: '欲望臨界',
      },
      {
        code: 'MOD-06',
        title: '音の共感覚チューナー',
        teaser: '聴覚と形状の直感リンク',
        shortLabel: '共感覚',
      },
    ],
    header: {
      daily: 'DAILY',
      free: 'FREE',
      syncingWith: 'SYNC TARGET:',
      soundOn: 'SOUND ON',
      soundOff: 'MUTED',
      exitConfirm: 'スキャンを中断してトップに戻りますか？',
    },
    transition: {
      calibrating: 'CALIBRATING SENSOR ARRAY',
      modulePrefix: 'PROTOCOL',
      ready: 'ENGAGE',
    },
    compiling: {
      title: '行動指紋を合成中…',
      steps: [
        '体内クロック誤差と干渉係数を算出…',
        'カーソル回避軌道・微細震えを抽出…',
        '6軸行動ベクトルとシグイルを描画…',
      ],
    },
    axes: {
      impulse: { label: '衝動性', short: '衝動', low: '熟慮', high: '瞬発' },
      precision: { label: '精密さ', short: '精密', low: '大雑把', high: '極微' },
      tempo: { label: '体感速度', short: '速度', low: 'ゆったり', high: '高速' },
      risk: { label: 'リスク耐性', short: '賭け', low: '堅実', high: '攻め' },
      order: { label: '秩序志向', short: '秩序', low: '自由', high: '構造' },
      resonance: { label: '共鳴感度', short: '共鳴', low: '独立', high: '鋭敏' },
    },
    chrono: {
      instruction: 'ちょうど「5.00秒」だと思ったら止めろ',
      sub: '途中で表示は消えます。自分の感覚だけを信じてください。',
      startBtn: '計測スタート',
      stopBtn: '5.00秒で STOP！',
      spaceHint: 'Spaceキーでも操作できます',
      maskedNote: 'DISPLAY MASKED // 感覚だけで数えろ',
      pulledBadge: 'ダミー鼓動に引きずられた',
      immuneBadge: 'ダミー鼓動を完全無視',
      targetLine: 'TARGET 5.00s',
    },
    forbidden: {
      instruction: '7秒間、絶対にボタンを押すな',
      sub: 'ただ待つだけ。指が勝手に動いても責任は負いません。',
      buttonText: '絶対に押すな',
      bait1: '……押したらどうなるか気にならない？',
      bait2: '未読通知が溜まっています。今すぐ処理しますか？',
      bait3: 'あと数秒。押さないとこの先ずっとモヤモヤするよ。',
      caughtTitle: 'CAUGHT IN 4K // 陥落',
      caughtPrefix: '我慢できた時間:',
      resistedTitle: 'RESISTED // 耐え抜いた',
      resistedMousePrefix: 'ボタンへの最接近距離:',
      resistedTouchPrefix: '画面内フェイント回数:',
      secondsSuffix: '秒',
    },
    crooked: {
      instruction: '傾いた額縁を「完全に水平」に直せ',
      sub: '数値は非表示。納得したら確定してください。',
      dragHint: '額縁を左右にドラッグ / 下のスライダー・微調整ボタンで操作',
      lockBtn: 'これで完全水平（確定）',
      autoLocked: 'TIME UP // 自動ロック',
      posterHeader: 'EXP-03 // HORIZON',
      posterBody: 'BALANCE IS A FEELING, NOT A NUMBER.',
      residualPrefix: '実際のズレ:',
      perfectTag: '神域の水平精度',
    },
    freehand: {
      instruction: '6秒で「安心する形」を1本線で描け',
      sub: '上手さは不要。指を置いた瞬間からカウントが始まります。',
      drawHint: 'キャンバスに1本線で描いて指を離す',
      tooShort: 'もう少し長めの1本線で描いてください！',
      doneLabel: '筆致キャプチャ完了',
      smoothness: '滑らかさ',
      closedness: '完結度',
    },
    greed: {
      instruction: '長押しでチャージ。爆発する直前で離せ',
      sub: '欲張るほど高スコア。爆発すればゼロ。',
      holdPrompt: 'ここを長押し（または Space 長押し）',
      releaseHint: '離してスコア確定！',
      tapTooShort: 'もう少し長く押し続けてください！',
      explodedTitle: 'OVERLOAD // 欲望の爆発',
      explodedSub: '臨界点を超えてしまいました',
      bankedTitle: 'SECURED // ギリギリ生還',
      marginPrefix: '爆発ラインとの差:',
    },
    synesthesia: {
      instruction: '今流れている「音」に一番しっくりくる形を作れ',
      soundALabel: 'SOUND 01 / 02 // 温かなアナログ共鳴音',
      soundBLabel: 'SOUND 02 / 02 // 鋭利なクリスタル高周波',
      soundADesc: '太く丸い倍音がゆっくり揺らぐ音',
      soundBDesc: 'ガラスが弾けるような硬質な高音',
      mutedCaptionA: '※ミュート中：低めで丸く温かいアナログ波形の音イメージで選択してください',
      mutedCaptionB: '※ミュート中：高く鋭く金属的にきらめく高周波の音イメージで選択してください',
      dragHint: 'キャンバス内をドラッグ（またはタップ）して形状をチューニング',
      axisXLeft: '丸い・有機的',
      axisXRight: '鋭い・トゲトゲ',
      axisYBottom: '寒色・深海',
      axisYTop: '暖色・発光',
      lockBtn: 'この形で決定（スキャン完了）',
      nextSoundBtn: 'この形に決定 → 次の音へ',
    },
    results: {
      tabSync: '脳波シンクロ結果',
      tabMySpec: 'あなたの行動指紋',
      specimenHeader: 'BEHAVIORAL SPEC SHEET',
      fingerprintLabel: 'FINGERPRINT ID',
      evidenceTitle: 'CAUGHT IN 4K // 実測された無意識の証拠',
      evidenceSubtitle: 'あなたの言い訳ではなく、指先と時間が記録した生のログです。',
      radarTitle: '6軸行動プロファイル',
      manualTitle: '被験者・取扱説明書',
      manualStrength: '無意識の強み',
      manualWeakness: '隠れたバグ / 弱点',
      manualEnvironment: '最も輝く環境',
      replayTitle: 'マイクロ行動リプレイ',
      replayBtn: 'リプレイ再生',
      replayForbiddenLabel: '禁断ボタンへの軌道',
      replayStrokeLabel: '安心の1本線ストローク',
      sharePanelTitle: '行動指紋を書き出す / 友達とシンクロ測定',
      themePaper: 'Lab Paper',
      themeObsidian: 'Obsidian',
      downloadPng: 'Spec Sheet PNG 保存 (1080×1350)',
      downloadingPng: '高解像度レンダリング中…',
      downloadDualPng: '2人のシンクロカード PNG 保存',
      shareX: 'X (Twitter) で結果を晒す',
      shareSyncX: 'X (Twitter) で相性結果をシェア',
      copyLink: '友達に送って「脳波シンクロ率」を測る',
      copiedLink: 'シンクロリンクをコピーしました！',
      retakeScan: 'もう一度スキャンする',
      syncHeadline: 'BRAINWAVE SYNC RATE',
      syncYou: 'YOU',
      syncFriend: 'TARGET',
      syncDynamicsTitle: '2人の無意識ケミストリー分析',
      anonymous: '名無しの被験者',
    },
  },
  en: {
    appName: 'MINDPRINT',
    appSubtitle: 'PSYCHOPHYSICS BEHAVIOR LAB',
    heroBadge: 'ZERO-QUESTION BEHAVIORAL OS SCAN',
    heroTitleA: 'Zero questions.',
    heroTitleB: 'Expose your subconscious operating system.',
    heroLead:
      'Multiple-choice quizzes only measure who you pretend to be. Six 8-second tactile micro-experiments measure micro-hesitations, cursor orbits, and greed thresholds directly.',
    heroSubLead: '~60 SECONDS // NO SIGN-UP // 100% LOCAL PROCESSING',
    taglineQuote: '"Words lie. A 0.1-second hesitation doesn\'t."',
    nicknameLabel: 'SPECIMEN NAME (OPTIONAL)',
    nicknamePlaceholder: 'Anonymous Subject',
    modeDaily: 'DAILY LAB (Shared Calibration)',
    modeDailyDesc: 'Identical traps for everyone today. Best for comparing.',
    modeFree: 'FREE RUN (Random Seed)',
    modeFreeDesc: 'Fresh randomized parameters on every run.',
    startScan: 'Launch 60s Behavioral Scan',
    startSyncScan: 'Scan Now to Unlock Sync Score',
    syncInviteBadge: 'INCOMING BRAINWAVE // SYNC CHALLENGE',
    syncInviteTitle: 'sent you their Mindprint',
    syncInviteDesc:
      'Complete your 60-second scan to instantly compute your dual behavioral sync score and chemistry breakdown.',
    modulesStripTitle: '6 Psychophysics Protocols (5–10s each)',
    historyTitle: 'Past Specimen Archive',
    historyClear: 'Clear History',
    historyEmpty: 'No scans recorded yet',
    moduleMeta: [
      {
        code: 'MOD-01',
        title: 'Blind Chrono',
        teaser: 'Internal clock distortion',
        shortLabel: 'Chrono',
      },
      {
        code: 'MOD-02',
        title: 'Forbidden Button',
        teaser: 'Impulse & pointer orbit',
        shortLabel: 'Impulse',
      },
      {
        code: 'MOD-03',
        title: 'Crooked Frame',
        teaser: 'Micro-tweak perfectionism',
        shortLabel: 'Precision',
      },
      {
        code: 'MOD-04',
        title: '1-Stroke Sanctuary',
        teaser: 'Subconscious stroke geometry',
        shortLabel: 'Geometry',
      },
      {
        code: 'MOD-05',
        title: 'Greed Horizon',
        teaser: 'Risk brink & finger tremor',
        shortLabel: 'Brink',
      },
      {
        code: 'MOD-06',
        title: 'Synesthesia Tuner',
        teaser: 'Acoustic-shape intuition',
        shortLabel: 'Resonance',
      },
    ],
    header: {
      daily: 'DAILY',
      free: 'FREE',
      syncingWith: 'SYNCING:',
      soundOn: 'SOUND ON',
      soundOff: 'MUTED',
      exitConfirm: 'Abort current scan and return to start?',
    },
    transition: {
      calibrating: 'CALIBRATING SENSOR ARRAY',
      modulePrefix: 'PROTOCOL',
      ready: 'ENGAGE',
    },
    compiling: {
      title: 'Synthesizing Behavioral Fingerprint…',
      steps: [
        'Computing internal clock drift & interference bias…',
        'Extracting pointer orbit & micro-tremor telemetry…',
        'Rendering 6-axis vectors & generative Mindprint sigil…',
      ],
    },
    axes: {
      impulse: { label: 'Impulse', short: 'Impulse', low: 'Measured', high: 'Hair-Trigger' },
      precision: { label: 'Precision', short: 'Precision', low: 'Loose', high: 'Surgical' },
      tempo: { label: 'Clock Tempo', short: 'Tempo', low: 'Dilated', high: 'Accelerated' },
      risk: { label: 'Risk Appetite', short: 'Risk', low: 'Guarded', high: 'Audacious' },
      order: { label: 'Order Drive', short: 'Order', low: 'Fluid', high: 'Structured' },
      resonance: { label: 'Resonance', short: 'Resonance', low: 'Detached', high: 'Attuned' },
    },
    chrono: {
      instruction: 'Stop the clock at exactly 5.00 seconds',
      sub: 'The display vanishes mid-run. Trust your pulse alone.',
      startBtn: 'START TIMER',
      stopBtn: 'STOP AT 5.00s',
      spaceHint: 'Or press Spacebar',
      maskedNote: 'DISPLAY MASKED // COUNT INTERNALLY',
      pulledBadge: 'Pulled by deceptive pulse',
      immuneBadge: 'Immune to deceptive pulse',
      targetLine: 'TARGET 5.00s',
    },
    forbidden: {
      instruction: 'DO NOT PRESS THE BUTTON for 7 seconds',
      sub: 'Just wait it out. Your cursor movements are being logged.',
      buttonText: 'DO NOT PRESS',
      bait1: '…aren’t you even a little curious what happens?',
      bait2: 'Unread alerts piling up. Resolve immediately?',
      bait3: 'Seconds left. If you don’t click, you’ll wonder forever.',
      caughtTitle: 'CAUGHT IN 4K // BREACHED',
      caughtPrefix: 'Lasted:',
      resistedTitle: 'RESISTED // HELD THE LINE',
      resistedMousePrefix: 'Closest approach:',
      resistedTouchPrefix: 'Touch feints:',
      secondsSuffix: 's',
    },
    crooked: {
      instruction: 'Make the crooked frame dead level',
      sub: 'Numbers are hidden. Lock it in when your eye says zero.',
      dragHint: 'Drag the frame sideways, slide below, or tap micro-nudges',
      lockBtn: 'LOCK LEVEL',
      autoLocked: 'TIME UP // AUTO-LOCKED',
      posterHeader: 'EXP-03 // HORIZON',
      posterBody: 'BALANCE IS A FEELING, NOT A NUMBER.',
      residualPrefix: 'Actual tilt:',
      perfectTag: 'Sub-0.3° calibration',
    },
    freehand: {
      instruction: 'Draw a shape that feels "safe" in one stroke (6s)',
      sub: 'No artistic skill required. Timer starts on touch-down.',
      drawHint: 'Draw one continuous stroke and lift',
      tooShort: 'Draw a slightly longer single stroke!',
      doneLabel: 'Stroke Captured',
      smoothness: 'Smoothness',
      closedness: 'Closure',
    },
    greed: {
      instruction: 'HOLD to charge. Release right before it blows.',
      sub: 'Higher multiplier = higher courage. Detonation resets to zero.',
      holdPrompt: 'HOLD HERE (or hold Spacebar)',
      releaseHint: 'RELEASE TO BANK!',
      tapTooShort: 'Hold a little longer!',
      explodedTitle: 'OVERLOAD // GREED DETONATED',
      explodedSub: 'You pushed past the containment limit',
      bankedTitle: 'SECURED // CLEAN EXTRACTION',
      marginPrefix: 'Margin to burst:',
    },
    synesthesia: {
      instruction: 'Sculpt the shape that matches the sound playing right now',
      soundALabel: 'SOUND 01 / 02 // Warm Analog Drone',
      soundBLabel: 'SOUND 02 / 02 // Sharp Crystalline Chime',
      soundADesc: 'Rounded low harmonics gently breathing',
      soundBDesc: 'High metallic shards sparkling rapidly',
      mutedCaptionA: 'Muted mode: sculpt for a warm, rounded, low analog hum.',
      mutedCaptionB: 'Muted mode: sculpt for a crisp, sharp, high metallic shimmer.',
      dragHint: 'Drag or tap inside the chamber to morph geometry & color',
      axisXLeft: 'Round / Bouba',
      axisXRight: 'Spiky / Kiki',
      axisYBottom: 'Cool / Deep',
      axisYTop: 'Warm / Bright',
      lockBtn: 'LOCK SHAPE (FINISH SCAN)',
      nextSoundBtn: 'LOCK SHAPE → NEXT SOUND',
    },
    results: {
      tabSync: 'Brainwave Sync',
      tabMySpec: 'Your Mindprint',
      specimenHeader: 'BEHAVIORAL SPEC SHEET',
      fingerprintLabel: 'FINGERPRINT ID',
      evidenceTitle: 'CAUGHT IN 4K // Raw Telemetry Evidence',
      evidenceSubtitle: 'No self-reported opinions—only what your hands and timing actually did.',
      radarTitle: '6-Axis Behavioral Profile',
      manualTitle: 'Subject Operating Manual',
      manualStrength: 'Core Edge',
      manualWeakness: 'Hidden Bug',
      manualEnvironment: 'Peak Habitat',
      replayTitle: 'Micro-Behavior Replay',
      replayBtn: 'Replay',
      replayForbiddenLabel: 'Forbidden Button Orbit',
      replayStrokeLabel: '1-Stroke Sanctuary Path',
      sharePanelTitle: 'Export Spec Sheet / Challenge a Friend',
      themePaper: 'Lab Paper',
      themeObsidian: 'Obsidian',
      downloadPng: 'Save Spec Sheet PNG (1080×1350)',
      downloadingPng: 'Rendering HiDPI PNG…',
      downloadDualPng: 'Save Dual Sync Card PNG',
      shareX: 'Post on X (Twitter)',
      shareSyncX: 'Post Sync Result on X',
      copyLink: 'Copy Brainwave Sync Challenge Link',
      copiedLink: 'Sync challenge link copied!',
      retakeScan: 'Run Another Scan',
      syncHeadline: 'BRAINWAVE SYNC RATE',
      syncYou: 'YOU',
      syncFriend: 'TARGET',
      syncDynamicsTitle: 'Dual Subconscious Chemistry',
      anonymous: 'Anonymous Subject',
    },
  },
};
