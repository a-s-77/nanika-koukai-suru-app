import type {
  ArchetypeDefinition,
  AxisScores,
  EvidenceItem,
  Locale,
  RawTelemetry,
} from '../types/mindprint';
import { AXIS_ORDER } from '../i18n/translations';

export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    id: 'calm_defuser',
    code: 'SPEC-01 // DEFUSER',
    index: 0,
    name: { ja: '静かなる爆弾処理班', en: 'The Calm Defuser' },
    tagline: {
      ja: '誘惑も騒音も無力化する氷の精密神経',
      en: 'Ice-cold nerve that disarms temptation and noise alike',
    },
    roast: {
      ja: '絶対に押すなと言われたボタンを前に瞬きすらせず、傾きも0.1°単位で刈り取る冷静さ。たぶん肝が据わりすぎて周りが少し怖い。',
      en: 'You stared down a giant red button without flinching and leveled a frame like a laser surveyor. Your composure is mildly terrifying.',
    },
    manual: {
      strength: {
        ja: 'プレッシャー下でも手の震えと時間感覚が狂わない圧倒的安定感。',
        en: 'Unshakeable composure and steady timing even under noisy pressure.',
      },
      weakness: {
        ja: '完璧に整えてから動くため、カオスを楽しむ即興戦では出遅れがち。',
        en: 'Needs clean structure first—can feel slow to jump into pure chaos.',
      },
      environment: {
        ja: 'ミッションクリティカルな本番運用、精密設計、危機対応の最前線。',
        en: 'High-stakes ops, precision architecture, and crisis war rooms.',
      },
    },
    accentColor: '#1D4ED8',
    prototype: { impulse: 24, precision: 82, tempo: 48, risk: 42, order: 78, resonance: 56 },
  },
  {
    id: 'subpixel_sovereign',
    code: 'SPEC-02 // SOVEREIGN',
    index: 1,
    name: { ja: '0.1mmの支配者', en: 'Sub-Pixel Sovereign' },
    tagline: {
      ja: '世界のわずかな傾きすら許さない美学の鬼',
      en: 'Refuses to let the universe stay tilted by a fraction of a degree',
    },
    roast: {
      ja: '額縁の微調整に何度も往復する執念と、図形をきっちり閉じる秩序欲の塊。他人のデスクトップのアイコン配置が気になって仕方ないタイプ。',
      en: 'You kept nudging that frame until your soul settled. We both know crooked slides physically hurt your eyes.',
    },
    manual: {
      strength: {
        ja: '99%の人が見逃す違和感に一瞬で気づき、プロ品質へ仕上げる執着力。',
        en: 'Spots micro-flaws 99% of people miss and polishes work to museum grade.',
      },
      weakness: {
        ja: '「あと0.2°だけ…」で時間を溶かし、締切直前にディテール沼へ落ちる。',
        en: 'Burns precious minutes tweaking invisible margins past diminishing returns.',
      },
      environment: {
        ja: 'UI/UX仕上げ、編集・校正、品質保証、職人的なプロダクト制作。',
        en: 'Design craft, editorial finishing, QA, and boutique product engineering.',
      },
    },
    accentColor: '#141413',
    prototype: { impulse: 28, precision: 95, tempo: 48, risk: 32, order: 90, resonance: 64 },
  },
  {
    id: 'velvet_gambler',
    code: 'SPEC-03 // VELVET',
    index: 2,
    name: { ja: '理性の皮を被った賭博師', en: 'Velvet Gambler' },
    tagline: {
      ja: '普段は涼しい顔で、賭け場だけ限界まで突っ込む',
      en: 'Polite on the surface, pushing the reactor to 95% behind closed doors',
    },
    roast: {
      ja: '一見落ち着いているのに、臨界点ギリギリまでレバーを握り続ける度胸が異常。「まだいける」が口癖でだいたい本当に生還する。',
      en: 'You look composed until a multiplier starts climbing—then suddenly you’re staring down an overload just to feel alive.',
    },
    manual: {
      strength: {
        ja: '引き際と攻め際の嗅覚が鋭く、期待値が最大化する地点を体感で掴む。',
        en: 'Sharp instinct for asymmetric upside and timing high-stakes exits.',
      },
      weakness: {
        ja: '安全圏のルーチン作業では退屈して、わざとスリルを足したくなる癖。',
        en: 'Gets bored in safe routines and secretly manufactures tension.',
      },
      environment: {
        ja: '新規事業、交渉テーブル、勝負所の一発逆転プロジェクト。',
        en: 'Venture bets, negotiations, and high-leverage launch sprints.',
      },
    },
    accentColor: '#FF3B1F',
    prototype: { impulse: 62, precision: 68, tempo: 58, risk: 94, order: 48, resonance: 55 },
  },
  {
    id: 'chrono_runner',
    code: 'SPEC-04 // CHRONO-AHEAD',
    index: 3,
    name: { ja: '未来に0.5秒先住する人', en: 'Chrono-Ahead Runner' },
    tagline: {
      ja: '周囲より速いクロックで現実を先読みしている',
      en: 'Running on an overclocked internal heartbeat half a second ahead',
    },
    roast: {
      ja: '体内時計の5秒が他人より明らかに速い。会話の途中で相手のオチが読めてしまい、人の話が終わる前に「それな」と言いがち。',
      en: 'Your 5 seconds finished before everyone else’s. You probably finish other people’s sentences in your head before they blink.',
    },
    manual: {
      strength: {
        ja: '意思決定の初速が圧倒的に速く、誰よりも先に現場を動かせる。',
        en: 'Blistering decision velocity that unsticks stalled teams immediately.',
      },
      weakness: {
        ja: '待ち時間が物理的に苦痛。熟成が必要なタスクを途中で切り上げやすい。',
        en: 'Waiting hurts physically; risks shipping before nuances settle.',
      },
      environment: {
        ja: '高速プロトタイピング、ライブ配信、スタートアップ初期の立ち上げ。',
        en: 'Rapid prototyping, live ops, and zero-to-one product sprints.',
      },
    },
    accentColor: '#FF3B1F',
    prototype: { impulse: 72, precision: 52, tempo: 94, risk: 68, order: 42, resonance: 60 },
  },
  {
    id: 'forbidden_magnet',
    code: 'SPEC-05 // MAGNET',
    index: 4,
    name: { ja: '禁止されると燃える引力体', en: 'Forbidden Magnet' },
    tagline: {
      ja: '「押すな」はあなたの脳内で「押せ」に翻訳される',
      en: '"Do Not Press" translates directly to "Challenge Accepted" in your brain',
    },
    roast: {
      ja: '赤いボタンを前に理性が秒速で蒸発。ルールや制限を見るほど「本当に押したらどうなるか」を確かめずにいられない生粋の実験精神。',
      en: 'Your willpower evaporated the moment the red badge popped. You didn’t just break the rule—you tested whether the lab was bluffing.',
    },
    manual: {
      strength: {
        ja: '既成概念や「暗黙の禁止」を突破して新しい発見を引き当てる行動力。',
        en: 'Fearless curiosity that breaks unwritten rules and uncovers hidden paths.',
      },
      weakness: {
        ja: '通知バッジと限定ボタンに無条件で釣られる。規約は絶対読まない。',
        en: 'Helpless against unread badges; definitely clicks OK without reading terms.',
      },
      environment: {
        ja: 'クリエイティブ企画、バグハント、常識を壊すブランディング。',
        en: 'Creative direction, red-teaming, and guerrilla launches.',
      },
    },
    accentColor: '#FF3B1F',
    prototype: { impulse: 88, precision: 44, tempo: 68, risk: 72, order: 40, resonance: 60 },
  },
  {
    id: 'drifting_synesthete',
    code: 'SPEC-06 // SYNESTHETE',
    index: 5,
    name: { ja: '輪郭なき共感覚者', en: 'Drifting Synesthete' },
    tagline: {
      ja: '音・線・空気の温度を身体ごとダイレクトに受信する',
      en: 'Translates sound, line weight, and ambient vibe straight into intuition',
    },
    roast: {
      ja: '音の丸みとトゲを迷いなく形で描き分け、1本線もリズム優先。理屈で説明するより「なんか気持ちいい／気持ち悪い」の精度が異様に高い。',
      en: 'You sculpted sound into shape faster than most people read instructions. Logic can wait—your gut already heard the subtext.',
    },
    manual: {
      strength: {
        ja: '言語化できない違和感や「空気のトーン」を一瞬で作品・言葉に乗せる力。',
        en: 'Captures elusive tone, mood, and aesthetic resonance effortlessly.',
      },
      weakness: {
        ja: '気分や周囲の音環境に集中力が左右されやすく、無味乾燥な作業が苦手。',
        en: 'Sensitive to ugly environments; sterile spreadsheets drain your battery.',
      },
      environment: {
        ja: '音楽・映像・アートディレクション、感性主導のコンセプト設計。',
        en: 'Audio-visual design, storytelling, and sensory brand worlds.',
      },
    },
    accentColor: '#1D4ED8',
    prototype: { impulse: 48, precision: 56, tempo: 44, risk: 52, order: 44, resonance: 96 },
  },
  {
    id: 'labyrinth_architect',
    code: 'SPEC-07 // ARCHITECT',
    index: 6,
    name: { ja: '完璧主義の迷宮建築家', en: 'Labyrinth Architect' },
    tagline: {
      ja: '見えない基準線を頭の中に何本も引いている設計者',
      en: 'Carries an invisible blueprint of symmetry inside every gesture',
    },
    roast: {
      ja: '閉じた安全な図形を中央にキッチリ描き、額縁のズレも許さない。頭の中のルールブックが厚すぎて、たまに自分自身を閉じ込めがち。',
      en: 'Centered stroke, closed perimeter, locked angle. You build airtight sanctuaries—just remember to leave yourself an exit door.',
    },
    manual: {
      strength: {
        ja: '破綻のない構造化能力と、長期にわたって秩序を保ち続ける設計力。',
        en: 'Deep structural thinking that keeps complex systems coherent over time.',
      },
      weakness: {
        ja: '枠組みが整う前に人に見せるのを極端に嫌い、着手まで時間がかかる。',
        en: 'Hates showing rough drafts; delays launch until every corner is mitered.',
      },
      environment: {
        ja: 'システム設計、建築・空間デザイン、データモデリング。',
        en: 'Systems architecture, spatial design, and long-horizon engineering.',
      },
    },
    accentColor: '#1D4ED8',
    prototype: { impulse: 30, precision: 78, tempo: 40, risk: 34, order: 84, resonance: 64 },
  },
  {
    id: 'storm_observer',
    code: 'SPEC-08 // OBSERVER',
    index: 7,
    name: { ja: '嵐の真ん中の観測者', en: 'Eye-of-the-Storm Observer' },
    tagline: {
      ja: '時間がゆっくり流れる静かな視点から世界を見ている',
      en: 'Watches chaos unfold in slow motion from a quiet center',
    },
    roast: {
      ja: '速い鼓動の罠にも流されず、体内時計がむしろゆったり。周りの全員が焦って空回りしている時ほど、ひとりだけコーヒーが冷めていないタイプ。',
      en: 'Our deceptive pulse tried to rush you and bounced right off. While everyone else panics, your clock just keeps breathing slowly.',
    },
    manual: {
      strength: {
        ja: '周囲のノイズや焦燥に同調せず、大局的なテンポを保てる精神的防波堤。',
        en: 'Psychologically insulated against herd panic and artificial urgency.',
      },
      weakness: {
        ja: '緊迫した場面でも平熱に見えるため「本気なのか分かりにくい」と思われがち。',
        en: 'Steady pulse can look detached when teammates want visible adrenaline.',
      },
      environment: {
        ja: 'リサーチ、戦略参謀、ファシリテーション、長期投資の判断。',
        en: 'Research, strategic advisory, mediation, and calm leadership.',
      },
    },
    accentColor: '#1D4ED8',
    prototype: { impulse: 22, precision: 70, tempo: 20, risk: 46, order: 68, resonance: 48 },
  },
  {
    id: 'instinct_drifter',
    code: 'SPEC-09 // DRIFTER',
    index: 8,
    name: { ja: '直感ドリフトの開拓者', en: 'Instinct Drifter' },
    tagline: {
      ja: '定規を捨ててキャンバス全体を一気に駆け抜ける自由線',
      en: 'Throws away the ruler and claims the whole canvas in one sweep',
    },
    roast: {
      ja: '図形は閉じず大きく広がり、角度調整も「だいたいヨシ！」で即決。細部より勢いと風景の広さを愛する、良い意味で雑さが武器の野生児。',
      en: 'Open stroke, bold coverage, fast lock-in. You don’t sweat micro-angles when there’s a whole horizon to cross.',
    },
    manual: {
      strength: {
        ja: '余白を恐れず大きな構図を一筆で描ける突破力と、軽やかな決断力。',
        en: 'Fills blank canvases fearlessly with sweeping scope and zero overthinking.',
      },
      weakness: {
        ja: '詰めの甘さや誤字脱字が残りやすい。相棒に精密系がいると無敵。',
        en: 'Leaves loose ends behind; unstoppable once paired with a detail finisher.',
      },
      environment: {
        ja: 'コンセプト初期案、開拓営業、クリエイティブのブレインストーミング。',
        en: 'Blue-sky ideation, frontier sales, and early-stage creative jams.',
      },
    },
    accentColor: '#FF3B1F',
    prototype: { impulse: 72, precision: 38, tempo: 68, risk: 74, order: 34, resonance: 64 },
  },
  {
    id: 'obsidian_pokerface',
    code: 'SPEC-10 // POKERFACE',
    index: 9,
    name: { ja: '鉄壁のポーカーフェイス', en: 'Obsidian Pokerface' },
    tagline: {
      ja: '誘惑は完全に無視、リスクも計算ずくで抑え込む',
      en: 'Zero leaks, zero flinches, and strictly budgeted exposure',
    },
    roast: {
      ja: 'ボタンには一切近づかず、欲望の臨界点も安全マージンを残して冷静に回収。損は絶対にしないが、たまに面白みより生存率を優先しすぎる。',
      en: 'You kept a polite distance from the trap and cashed out cleanly with margin to spare. Impossible to scam, slightly hard to surprise.',
    },
    manual: {
      strength: {
        ja: '感情的な釣り針に一切かからない自己制御力と、安定した再現性。',
        en: 'Immune to psychological bait with rock-solid repeatable judgment.',
      },
      weakness: {
        ja: 'リスクを取らなさすぎて、たまに「奇跡の一発」を他人に譲ってしまう。',
        en: 'Safety margins can occasionally leave outsized lucky breaks on the table.',
      },
      environment: {
        ja: 'セキュリティ監査、法務・リスク管理、堅実な資産・プロジェクト運営。',
        en: 'Security auditing, risk governance, and reliable core infrastructure.',
      },
    },
    accentColor: '#141413',
    prototype: { impulse: 22, precision: 68, tempo: 46, risk: 28, order: 74, resonance: 46 },
  },
  {
    id: 'contrarian_aesthete',
    code: 'SPEC-11 // CONTRARIAN',
    index: 10,
    name: { ja: '美意識の反逆者', en: 'Contrarian Aesthete' },
    tagline: {
      ja: '多数派の「普通」をあえてズラして快感を得る表現者',
      en: 'Finds beauty slightly off-axis from everyone else’s default',
    },
    roast: {
      ja: '音と形の連想も「普通はこうでしょ」を裏切る独自チューニング。他人の正解テンプレートに収まるくらいなら、少し歪な方が美しいと信じている。',
      en: 'Even your sound-to-shape pairing zigged where textbooks zagged. You’d rather craft something unforgettable than politely standard.',
    },
    manual: {
      strength: {
        ja: '予定調和を壊して独自のスタイルを立ち上げる強烈な美意識と感受性。',
        en: 'Breaks predictable tropes to invent genuinely distinctive taste.',
      },
      weakness: {
        ja: '「あえて逆を行く」が癖になり、素直な王道案に照れを感じやすい。',
        en: 'Can resist obvious solutions just because everyone else likes them.',
      },
      environment: {
        ja: 'インディーズ創作、エディトリアル、カルト的人気を生むニッチ領域。',
        en: 'Indie culture, editorial art, and cult-favorite product design.',
      },
    },
    accentColor: '#1D4ED8',
    prototype: { impulse: 60, precision: 58, tempo: 52, risk: 66, order: 28, resonance: 88 },
  },
  {
    id: 'brink_surfer',
    code: 'SPEC-12 // BRINK',
    index: 11,
    name: { ja: '限界ギリギリのサーファー', en: 'Brink Surfer' },
    tagline: {
      ja: '爆発の0.2秒手前が一番呼吸しやすいアドレナリン体質',
      en: 'Breathes easiest in the final 0.2 seconds before detonation',
    },
    roast: {
      ja: 'リアクターが悲鳴を上げても指を離さず、ギリギリで生還（または派手に散る）。日常にスリルが足りないと、夏休みの宿題を最終日にやるタイプ。',
      en: 'While the containment chamber screamed, you held on for one more decimal place. Thrill isn’t a side effect for you—it’s the fuel.',
    },
    manual: {
      strength: {
        ja: '修羅場や最終局面でこそ集中力が極限まで研ぎ澄まされる土壇場力。',
        en: 'Reaches peak clarity and focus when the countdown clock hits red.',
      },
      weakness: {
        ja: '余裕のあるスケジュールでも、無意識にギリギリまで引き延ばしがち。',
        en: 'Suspiciously allergic to finishing things comfortably early.',
      },
      environment: {
        ja: 'ライブイベント、トレード、競争の激しいピッチやタイムアタック。',
        en: 'Live production, competitive pitches, and high-tempo launches.',
      },
    },
    accentColor: '#FF3B1F',
    prototype: { impulse: 74, precision: 50, tempo: 72, risk: 94, order: 46, resonance: 68 },
  },
  {
    id: 'quiet_minimalist',
    code: 'SPEC-13 // MINIMALIST',
    index: 12,
    name: { ja: '静寂を囲うミニマリスト', en: 'Quiet Minimalist' },
    tagline: {
      ja: '最小の線と最小のノイズで自分の領域を守る',
      en: 'Protects clarity with minimal strokes and zero wasted motion',
    },
    roast: {
      ja: '無駄なアプローチも過剰な演出もなく、コンパクトに閉じた小宇宙を描き切る。必要最低限の言葉だけで会話が成立する静かな実力派。',
      en: 'Compact stroke, zero wasted cursor mileage, clean stop. You say in one line what takes most people three slide decks.',
    },
    manual: {
      strength: {
        ja: 'ノイズを削ぎ落として本質だけを残す編集眼と、省エネな集中持続力。',
        en: 'Strips away fluff effortlessly and sustains quiet, focused output.',
      },
      weakness: {
        ja: 'テンション高めの場ではエネルギーを吸い取られ、早めにログアウトしたくなる。',
        en: 'Loud chaotic brainstorms drain you faster than actual hard work.',
      },
      environment: {
        ja: '少人数精鋭チーム、プロダクトデザイン、執筆・研究・ソロ開発。',
        en: 'Small senior teams, indie software, writing, and quiet studios.',
      },
    },
    accentColor: '#141413',
    prototype: { impulse: 20, precision: 74, tempo: 38, risk: 24, order: 84, resonance: 62 },
  },
  {
    id: 'high_clock_improviser',
    code: 'SPEC-14 // IMPROVISER',
    index: 13,
    name: { ja: '高速演算のインプロバイザー', en: 'High-Clock Improviser' },
    tagline: {
      ja: '走りながら軌道修正し続ける生粋のライブ型プレイヤー',
      en: 'Sprints first, recalibrates mid-air, and lands on instinct',
    },
    roast: {
      ja: 'スピードも共鳴感度も高く、微調整すらリズム感でこなす。「まず試してから考える」の回転数が常人の2倍速で回っている。',
      en: 'High clock speed plus sharp sensory intuition—you iterate in real time while others are still opening the planning doc.',
    },
    manual: {
      strength: {
        ja: '変化の速い現場で即座に空気と仕様を読み替え、最適解へ乗り換える機動力。',
        en: 'Reads shifting rooms and specs instantly, pivoting without friction.',
      },
      weakness: {
        ja: '昨日決めたルールを今日もうアップデートしたくなり、周囲を振り回すことも。',
        en: 'Loves upgrading yesterday’s workflow before everyone else learns it.',
      },
      environment: {
        ja: 'ハッカソン、即興クリエイティブ、プロダクト改善の現場。',
        en: 'Hackathons, live creative tech, and rapid iteration loops.',
      },
    },
    accentColor: '#FF3B1F',
    prototype: { impulse: 68, precision: 60, tempo: 80, risk: 66, order: 46, resonance: 78 },
  },
  {
    id: 'subconscious_antenna',
    code: 'SPEC-15 // ANTENNA',
    index: 14,
    name: { ja: '無意識の共鳴アンテナ', en: 'Subconscious Antenna' },
    tagline: {
      ja: '他人のリズムや微かな振動を瞬時に拾い上げる高感度センサー',
      en: 'Tuned so finely that ambient rhythms rewrite your tempo effortlessly',
    },
    roast: {
      ja: 'ダミーの鼓動にも音の質感にも素直にシンクロし、きれいな輪郭を描く共感力。一緒にいる相手によって自分のテンポまで優しく合わせてしまう人。',
      en: 'Your internal clock synced right up to the ambient pulse and your shapes mirrored the audio cleanly. You absorb the room’s frequency.',
    },
    manual: {
      strength: {
        ja: '相手や環境のニュアンスを自然に受け止め、調和を生み出す高い同調性。',
        en: 'Natural empathy that reads subtle signals and harmonizes teams.',
      },
      weakness: {
        ja: '焦っている人の隣にいると、自分のペースまで一気に引きずられやすい。',
        en: 'Anxious neighbors can hijack your pacing unless you guard your bubble.',
      },
      environment: {
        ja: 'サウンド・演出、コミュニティ、ユーザーインタビュー、共創プロジェクト。',
        en: 'UX research, community curation, music, and collaborative labs.',
      },
    },
    accentColor: '#1D4ED8',
    prototype: { impulse: 44, precision: 66, tempo: 52, risk: 40, order: 68, resonance: 94 },
  },
  {
    id: 'zero_point_calibrator',
    code: 'SPEC-16 // CALIBRATOR',
    index: 15,
    name: { ja: '均衡のゼロ点計測器', en: 'Zero-Point Calibrator' },
    tagline: {
      ja: '衝動も理性も偏らずに噛み合わせる希少なハイブリッド',
      en: 'A rare hybrid balancing impulse, precision, and intuition near zero-point',
    },
    roast: {
      ja: '極端なバグを出さず、どの実験も高い水準でそつなく通過。味方にすると最強のバランスブレイカーだが、本人的には「もっと尖りたい」と思っていたりする。',
      en: 'No glaring blind spots, clean execution across the board. You’re the Swiss-army brain every team needs—even if you secretly wish for more chaos.',
    },
    manual: {
      strength: {
        ja: '直感とロジック、攻めと守りのギアを相手に合わせて自在に切り替えられる柔軟性。',
        en: 'Switches fluidly between intuition and rigor depending on the mission.',
      },
      weakness: {
        ja: '何でも平均点以上でこなせるぶん、自分の本当の偏愛を見失いやすい。',
        en: 'Competence everywhere can hide which spike you actually want to bet on.',
      },
      environment: {
        ja: 'プロダクトマネージャー、総合ディレクター、異分野をつなぐハブ役。',
        en: 'Product leadership, creative direction, and cross-functional hubs.',
      },
    },
    accentColor: '#141413',
    prototype: { impulse: 50, precision: 68, tempo: 54, risk: 54, order: 64, resonance: 68 },
  },
];

export function classifyArchetype(axes: AxisScores, raw: RawTelemetry): ArchetypeDefinition {
  let best = ARCHETYPES[15];
  let bestDist = Number.POSITIVE_INFINITY;

  for (const candidate of ARCHETYPES) {
    let distSq = 0;
    for (const k of AXIS_ORDER) {
      const diff = axes[k] - candidate.prototype[k];
      distSq += diff * diff;
    }

    // Behavioral signature affinity adjustments so specific real behaviors shine across all 16 types
    let bonus = 0;
    if (
      candidate.id === 'calm_defuser' &&
      !raw.forbidden.pressed &&
      raw.crooked.absErrorDeg <= 0.8 &&
      Math.abs(raw.chrono.errorMs) <= 450
    ) {
      bonus += 550;
    }
    if (
      candidate.id === 'subpixel_sovereign' &&
      raw.crooked.absErrorDeg <= 0.45 &&
      (raw.crooked.microNudgeCount >= 3 || raw.crooked.directionReversals >= 3)
    ) {
      bonus += 550;
    }
    if (
      candidate.id === 'velvet_gambler' &&
      !raw.forbidden.pressed &&
      !raw.greed.exploded &&
      raw.greed.brinkRatio >= 0.72
    ) {
      bonus += 450;
    }
    if (candidate.id === 'chrono_runner' && raw.chrono.errorMs <= -700) {
      bonus += 450;
    }
    if (candidate.id === 'forbidden_magnet' && raw.forbidden.pressed) {
      bonus += 750 + ((raw.forbidden.pressTimeMs ?? 7000) < 2500 ? 350 : 0);
    }
    if (
      candidate.id === 'drifting_synesthete' &&
      raw.synesthesia.contrastDelta >= 0.85 &&
      raw.freehand.smoothness >= 0.65
    ) {
      bonus += 500;
    }
    if (
      candidate.id === 'labyrinth_architect' &&
      raw.freehand.closedness >= 0.72 &&
      raw.freehand.centerBias >= 0.65 &&
      raw.crooked.absErrorDeg <= 1.2
    ) {
      bonus += 500;
    }
    if (
      candidate.id === 'storm_observer' &&
      raw.chrono.errorMs >= 650 &&
      !raw.chrono.pulledByInterference
    ) {
      bonus += 450;
    }
    if (
      candidate.id === 'instinct_drifter' &&
      raw.freehand.closedness <= 0.42 &&
      raw.freehand.canvasCoverage >= 0.48 &&
      raw.crooked.totalTimeMs <= 5500
    ) {
      bonus += 650;
    }
    if (
      candidate.id === 'obsidian_pokerface' &&
      !raw.forbidden.pressed &&
      raw.forbidden.minDistancePx >= 110 &&
      !raw.greed.exploded &&
      raw.greed.brinkRatio <= 0.48
    ) {
      bonus += 550;
    }
    if (candidate.id === 'contrarian_aesthete' && raw.synesthesia.boubaKikiAlignment <= -0.2) {
      bonus += 550;
    }
    if (candidate.id === 'brink_surfer' && (raw.greed.exploded || raw.greed.brinkRatio >= 0.88)) {
      bonus += raw.greed.exploded ? 850 : 550;
    }
    if (
      candidate.id === 'quiet_minimalist' &&
      !raw.forbidden.pressed &&
      raw.freehand.canvasCoverage <= 0.32 &&
      raw.freehand.closedness >= 0.55
    ) {
      bonus += 550;
    }
    if (
      candidate.id === 'high_clock_improviser' &&
      raw.chrono.errorMs <= -300 &&
      raw.synesthesia.contrastDelta >= 0.65 &&
      raw.crooked.totalTimeMs <= 5500
    ) {
      bonus += 550;
    }
    if (
      candidate.id === 'subconscious_antenna' &&
      raw.chrono.pulledByInterference &&
      raw.synesthesia.contrastDelta >= 0.65
    ) {
      bonus += 450;
    }
    if (candidate.id === 'zero_point_calibrator') {
      bonus -= 350;
    }

    const effectiveDist = distSq - bonus;
    if (effectiveDist < bestDist) {
      bestDist = effectiveDist;
      best = candidate;
    }
  }

  return best;
}

export function generateEvidence(raw: RawTelemetry, locale: Locale): EvidenceItem[] {
  const isJa = locale === 'ja';
  const items: EvidenceItem[] = [];

  // 1. Forbidden Button evidence
  if (raw.forbidden.pressed) {
    const tSec = ((raw.forbidden.pressTimeMs ?? 0) / 1000).toFixed(2);
    items.push({
      moduleIndex: 1,
      label: isJa ? '禁断のボタン' : 'Forbidden Button',
      metric: isJa ? `${tSec}秒で陥落` : `Pressed @ ${tSec}s`,
      commentary: isJa
        ? `7秒待てばクリアなのに、${tSec}秒で我慢の限界が来て押下。理性の防衛線があっさり突破されました。`
        : `Asked to wait 7 seconds; your finger caved at ${tSec}s. Resistance lasted roughly as long as an ice cube on asphalt.`,
    });
  } else if (raw.forbidden.inputMode === 'touch') {
    items.push({
      moduleIndex: 1,
      label: isJa ? '禁断のボタン' : 'Forbidden Button',
      metric: isJa
        ? `完全耐性 (フェイント ${raw.forbidden.approachCount}回)`
        : `Resisted (${raw.forbidden.approachCount} feints)`,
      commentary: isJa
        ? `7秒間ノータッチで生還。画面へのフェイント接近は${raw.forbidden.approachCount}回記録されています。`
        : `Survived the full 7 seconds untouched, with ${raw.forbidden.approachCount} suspicious touch feints logged.`,
    });
  } else {
    const dist = Math.round(raw.forbidden.minDistancePx);
    const hoverSec = (raw.forbidden.hoverDurationMs / 1000).toFixed(1);
    items.push({
      moduleIndex: 1,
      label: isJa ? '禁断のボタン' : 'Forbidden Button',
      metric: isJa ? `最接近 ${dist}px / 滞空 ${hoverSec}s` : `Closest ${dist}px / Hover ${hoverSec}s`,
      commentary:
        dist < 50
          ? isJa
            ? `押さなかったものの、カーソルがボタンからわずか${dist}pxまで接近。脳内では押す気満々だった証拠です。`
            : `Technically resisted, yet your cursor crept within ${dist}px of the button. We saw you hovering.`
          : isJa
            ? `ボタンから${dist}px以上の安全圏をキープし完全無視。挑発通知にも動じない鉄壁ぶり。`
            : `Maintained a cool ${dist}px perimeter the whole time. The fake notification bait barely registered.`,
    });
  }

  // 2. Chrono Drift evidence
  const actualSec = (raw.chrono.actualMs / 1000).toFixed(2);
  const sign = raw.chrono.errorMs >= 0 ? '+' : '';
  const errSec = (raw.chrono.errorMs / 1000).toFixed(2);
  items.push({
    moduleIndex: 0,
    label: isJa ? '体内時計クロノ' : 'Blind Chrono',
    metric: `${actualSec}s (${sign}${errSec}s)`,
    commentary: raw.chrono.pulledByInterference
      ? isJa
        ? `${raw.chrono.interferenceBpm}BPMのダミー鼓動に体内時計が見事に引きずられ、5.00秒が${actualSec}秒に歪みました。`
        : `Our deceptive ${raw.chrono.interferenceBpm} BPM heartbeat hijacked your clock—your 5.00s landed at ${actualSec}s.`
      : isJa
        ? `${raw.chrono.interferenceBpm}BPMの妨害ビートを受け流して${actualSec}秒に着地。周囲のテンポに飲まれないタイプです。`
        : `Shrugged off the ${raw.chrono.interferenceBpm} BPM distraction and clocked ${actualSec}s on your own rhythm.`,
  });

  // 3. Crooked Frame vs Greed Horizon (always include Greed + pick sharpest between Crooked/Freehand)
  const errDeg = raw.crooked.absErrorDeg.toFixed(2);
  const nudges = raw.crooked.microNudgeCount;
  const reversals = raw.crooked.directionReversals;
  items.push({
    moduleIndex: 2,
    label: isJa ? '傾いた額縁' : 'Crooked Frame',
    metric: isJa
      ? `誤差 ${errDeg}° / 迷い往復 ${reversals}回`
      : `Tilt ${errDeg}° / ${reversals} reversals`,
    commentary: raw.crooked.timedOut
      ? isJa
        ? `14秒間こだわり続けて時間切れ自動ロック。最終誤差は${errDeg}°、微調整${nudges}回のこだわり派。`
        : `Perfectionism timed out the 14s clock after ${nudges} micro-nudges, locking at ${errDeg}° tilt.`
      : raw.crooked.absErrorDeg <= 0.4
        ? isJa
          ? `数値ゼロ表示なしで誤差わずか${errDeg}°（微調整${nudges}回）。水平に対する感覚が完全に精密機器レベル。`
          : `Zero numeric clues, yet nailed ${errDeg}° tilt (${nudges} nudges). Your eyeball has a built-in spirit level.`
        : isJa
          ? `誤差${errDeg}°で即断ロック（迷い往復${reversals}回）。細かいズレより「だいたいOK」を優先する決断派。`
          : `Locked in at ${errDeg}° tilt with only ${reversals} reversals—decisive enough to skip obsessive tweaking.`,
  });

  // 4. Greed Horizon evidence
  const peak = raw.greed.peakMultiplier.toFixed(2);
  const burst = raw.greed.burstMultiplier.toFixed(2);
  const brinkPct = Math.round(raw.greed.brinkRatio * 100);
  const margin = Math.max(0, raw.greed.burstMultiplier - raw.greed.peakMultiplier).toFixed(2);
  items.push({
    moduleIndex: 4,
    label: isJa ? '欲望の臨界点' : 'Greed Horizon',
    metric: raw.greed.exploded
      ? isJa
        ? `×${burst} で爆発オーバーロード`
        : `DETONATED @ ×${burst}`
      : isJa
        ? `×${peak} 生還 (臨界 ${brinkPct}%)`
        : `×${peak} Banked (${brinkPct}% brink)`,
    commentary: raw.greed.exploded
      ? isJa
        ? `限界倍率×${burst}まで指を離せず大爆発。「あと0.1秒だけ」が命取りになる生粋のアクセル全開気質。`
        : `Held past the ×${burst} breaking point into total overload. That last "just one more tick" always tempts you.`
      : raw.greed.brinkRatio >= 0.8
        ? isJa
          ? `爆発ライン×${burst}に対し×${peak}（残り×${margin}）で生還！限界ギリギリを見切る度胸の良さが丸出し。`
          : `Released at ×${peak}—just ×${margin} shy of the ×${burst} explosion. Pure surgical nerve.`
        : isJa
          ? `限界×${burst}の手前×${peak}（臨界到達度${brinkPct}%）で早めの安全撤退。確実に持ち帰る堅実派です。`
          : `Secured ×${peak} (${brinkPct}% of the ×${burst} ceiling)—smart, risk-managed profit taking.`,
  });

  return items;
}
