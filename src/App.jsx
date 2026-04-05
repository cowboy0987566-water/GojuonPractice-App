import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, Play, RefreshCw, Home, CheckCircle2, XCircle, BarChart3, ArrowLeft, Settings, Globe, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

// 完整的五十音資料 (包含清音、濁音、半濁音、拗音、促音)
const kanaData = [
  // 清音 (Basic)
  { romaji: 'a', hiragana: 'あ', katakana: 'ア' }, { romaji: 'i', hiragana: 'い', katakana: 'イ' }, { romaji: 'u', hiragana: 'う', katakana: 'ウ' }, { romaji: 'e', hiragana: 'え', katakana: 'エ' }, { romaji: 'o', hiragana: 'お', katakana: 'オ' },
  { romaji: 'ka', hiragana: 'か', katakana: 'カ' }, { romaji: 'ki', hiragana: 'き', katakana: 'キ' }, { romaji: 'ku', hiragana: 'く', katakana: 'ク' }, { romaji: 'ke', hiragana: 'け', katakana: 'ケ' }, { romaji: 'ko', hiragana: 'こ', katakana: 'コ' },
  { romaji: 'sa', hiragana: 'さ', katakana: 'サ' }, { romaji: 'shi', hiragana: 'し', katakana: 'シ' }, { romaji: 'su', hiragana: 'す', katakana: 'ス' }, { romaji: 'se', hiragana: 'せ', katakana: 'セ' }, { romaji: 'so', hiragana: 'そ', katakana: 'ソ' },
  { romaji: 'ta', hiragana: 'た', katakana: 'タ' }, { romaji: 'chi', hiragana: 'ち', katakana: 'チ' }, { romaji: 'tsu', hiragana: 'つ', katakana: 'ツ' }, { romaji: 'te', hiragana: 'て', katakana: 'テ' }, { romaji: 'to', hiragana: 'と', katakana: 'ト' },
  { romaji: 'na', hiragana: 'な', katakana: 'ナ' }, { romaji: 'ni', hiragana: 'に', katakana: 'ニ' }, { romaji: 'nu', hiragana: 'ぬ', katakana: 'ヌ' }, { romaji: 'ne', hiragana: 'ね', katakana: 'ネ' }, { romaji: 'no', hiragana: 'の', katakana: 'ノ' },
  { romaji: 'ha', hiragana: 'は', katakana: 'ハ' }, { romaji: 'hi', hiragana: 'ひ', katakana: 'ヒ' }, { romaji: 'fu', hiragana: 'ふ', katakana: 'フ' }, { romaji: 'he', hiragana: 'へ', katakana: 'ヘ' }, { romaji: 'ho', hiragana: 'ほ', katakana: 'ホ' },
  { romaji: 'ma', hiragana: 'ま', katakana: 'マ' }, { romaji: 'mi', hiragana: 'み', katakana: 'ミ' }, { romaji: 'mu', hiragana: 'む', katakana: 'ム' }, { romaji: 'me', hiragana: 'め', katakana: 'メ' }, { romaji: 'mo', hiragana: 'も', katakana: 'モ' },
  { romaji: 'ya', hiragana: 'や', katakana: 'ヤ' }, { romaji: 'yu', hiragana: 'ゆ', katakana: 'ユ' }, { romaji: 'yo', hiragana: 'よ', katakana: 'ヨ' },
  { romaji: 'ra', hiragana: 'ら', katakana: 'ラ' }, { romaji: 'ri', hiragana: 'り', katakana: 'リ' }, { romaji: 'ru', hiragana: 'る', katakana: 'ル' }, { romaji: 're', hiragana: 'れ', katakana: 'レ' }, { romaji: 'ro', hiragana: 'ろ', katakana: 'ロ' },
  { romaji: 'wa', hiragana: 'わ', katakana: 'ワ' }, { romaji: 'wo', hiragana: 'を', katakana: 'ヲ' }, { romaji: 'n', hiragana: 'ん', katakana: 'ン' },

  // 濁音 (Dakuon)
  { romaji: 'ga', hiragana: 'が', katakana: 'ガ' }, { romaji: 'gi', hiragana: 'ぎ', katakana: 'ギ' }, { romaji: 'gu', hiragana: 'ぐ', katakana: 'グ' }, { romaji: 'ge', hiragana: 'げ', katakana: 'ゲ' }, { romaji: 'go', hiragana: 'ご', katakana: 'ゴ' },
  { romaji: 'za', hiragana: 'ざ', katakana: 'ザ' }, { romaji: 'ji', hiragana: 'じ', katakana: 'ジ' }, { romaji: 'zu', hiragana: 'ず', katakana: 'ズ' }, { romaji: 'ze', hiragana: 'ぜ', katakana: 'ゼ' }, { romaji: 'zo', hiragana: 'ぞ', katakana: 'ゾ' },
  { romaji: 'da', hiragana: 'だ', katakana: 'ダ' }, { romaji: 'dji', hiragana: 'ぢ', katakana: 'ヂ' }, { romaji: 'dzu', hiragana: 'づ', katakana: 'ヅ' }, { romaji: 'de', hiragana: 'で', katakana: 'デ' }, { romaji: 'do', hiragana: 'ど', katakana: 'ド' },
  { romaji: 'ba', hiragana: 'ば', katakana: 'バ' }, { romaji: 'bi', hiragana: 'び', katakana: 'ビ' }, { romaji: 'bu', hiragana: 'ぶ', katakana: 'ブ' }, { romaji: 'be', hiragana: 'べ', katakana: 'ベ' }, { romaji: 'bo', hiragana: 'ぼ', katakana: 'ボ' },

  // 半濁音 (Handakuon)
  { romaji: 'pa', hiragana: 'ぱ', katakana: 'パ' }, { romaji: 'pi', hiragana: 'ぴ', katakana: 'ピ' }, { romaji: 'pu', hiragana: 'ぷ', katakana: 'プ' }, { romaji: 'pe', hiragana: 'ぺ', katakana: 'ペ' }, { romaji: 'po', hiragana: 'ぽ', katakana: 'ポ' },

  // 拗音 (Yoon)
  { romaji: 'kya', hiragana: 'きゃ', katakana: 'キャ' }, { romaji: 'kyu', hiragana: 'きゅ', katakana: 'キュ' }, { romaji: 'kyo', hiragana: 'きょ', katakana: 'キョ' },
  { romaji: 'sha', hiragana: 'しゃ', katakana: 'シャ' }, { romaji: 'shu', hiragana: 'しゅ', katakana: 'シュ' }, { romaji: 'sho', hiragana: 'しょ', katakana: 'ショ' },
  { romaji: 'cha', hiragana: 'ちゃ', katakana: 'チャ' }, { romaji: 'chu', hiragana: 'ちゅ', katakana: 'チュ' }, { romaji: 'cho', hiragana: 'ちょ', katakana: 'チョ' },
  { romaji: 'nya', hiragana: 'にゃ', katakana: 'ニャ' }, { romaji: 'nyu', hiragana: 'にゅ', katakana: 'ニュ' }, { romaji: 'nyo', hiragana: 'にょ', katakana: 'ニョ' },
  { romaji: 'hya', hiragana: 'ひゃ', katakana: 'ヒャ' }, { romaji: 'hyu', hiragana: 'ひゅ', katakana: 'ヒュ' }, { romaji: 'hyo', hiragana: 'ひょ', katakana: 'ヒョ' },
  { romaji: 'mya', hiragana: 'みゃ', katakana: 'ミャ' }, { romaji: 'myu', hiragana: 'みゅ', katakana: 'ミュ' }, { romaji: 'myo', hiragana: 'みょ', katakana: 'ミョ' },
  { romaji: 'rya', hiragana: 'りゃ', katakana: 'リャ' }, { romaji: 'ryu', hiragana: 'りゅ', katakana: 'リュ' }, { romaji: 'ryo', hiragana: 'りょ', katakana: 'リョ' },
  { romaji: 'gya', hiragana: 'ぎゃ', katakana: 'ギャ' }, { romaji: 'gyu', hiragana: 'ぎゅ', katakana: 'ギュ' }, { romaji: 'gyo', hiragana: 'ぎょ', katakana: 'ギョ' },
  { romaji: 'ja', hiragana: 'じゃ', katakana: 'ジャ' }, { romaji: 'ju', hiragana: 'じゅ', katakana: 'ジュ' }, { romaji: 'jo', hiragana: 'じょ', katakana: 'ジョ' },
  { romaji: 'bya', hiragana: 'びゃ', katakana: 'ビャ' }, { romaji: 'byu', hiragana: 'びゅ', katakana: 'ビュ' }, { romaji: 'byo', hiragana: 'びょ', katakana: 'ビョ' },
  { romaji: 'pya', hiragana: 'ぴゃ', katakana: 'ピャ' }, { romaji: 'pyu', hiragana: 'ぴゅ', katakana: 'ピュ' }, { romaji: 'pyo', hiragana: 'ぴょ', katakana: 'ピョ' },

  // 促音 (Sokuon)
  { romaji: 'xtsu', hiragana: 'っ', katakana: 'ッ' }
];

const tableLayout = {
  seion: [
    ['a', 'i', 'u', 'e', 'o'], ['ka', 'ki', 'ku', 'ke', 'ko'], ['sa', 'shi', 'su', 'se', 'so'],
    ['ta', 'chi', 'tsu', 'te', 'to'], ['na', 'ni', 'nu', 'ne', 'no'], ['ha', 'hi', 'fu', 'he', 'ho'],
    ['ma', 'mi', 'mu', 'me', 'mo'], ['ya', null, 'yu', null, 'yo'], ['ra', 'ri', 'ru', 're', 'ro'],
    ['wa', null, null, null, 'wo'], ['n', null, null, null, null]
  ],
  dakuon: [
    ['ga', 'gi', 'gu', 'ge', 'go'], ['za', 'ji', 'zu', 'ze', 'zo'],
    ['da', 'dji', 'dzu', 'de', 'do'], ['ba', 'bi', 'bu', 'be', 'bo'],
    ['pa', 'pi', 'pu', 'pe', 'po']
  ],
  yoon: [
    ['kya', 'kyu', 'kyo'], ['sha', 'shu', 'sho'], ['cha', 'chu', 'cho'],
    ['nya', 'nyu', 'nyo'], ['hya', 'hyu', 'hyo'], ['mya', 'myu', 'myo'],
    ['rya', 'ryu', 'ryo'], ['gya', 'gyu', 'gyo'], ['ja', 'ju', 'jo'],
    ['bya', 'byu', 'byo'], ['pya', 'pyu', 'pyo']
  ],
  sokuon: [['xtsu']]
};

// 20國多語系字典 (i18n)
const i18n = {
  'zh-TW': { label: '繁體中文', t: { title: '五十音特訓', sub: '聽音辨字・槓桿你的學習效率', stTitle: '學習統計與錯題本', stSub: '基於 SM-2 間隔複習演算法', setTitle: '系統設定', setSub: '自訂您的學習體驗', stBtn: '錯題本', s1: '1. 選擇行 (あかさたな...)', selAll: '全選', deselAll: '全不選', s2: '2. 選擇段 (あいうえお...)', algoT: '演算法啟動中', algoD: '系統會優先出您「不熟悉」或「該複習」的字。', s3: '3. 選擇模式並開始', mH2K: '平假名 → 片假名', mK2H: '片假名 → 平假名', am: '發音模式', amD: '控制題目出現時的語音播放行為', amA: '出題時發音一次 (預設)', amM: '僅手動點擊發音', amR: '自動間隔重複發音', ai: '重複間隔秒數', sr: '顯示羅馬拼音', srD: '在題目與錯誤提示中顯示羅馬拼音輔助', ed: '錯誤提示停留秒數', edD: '答錯時，正確答案放大的顯示時間', sj: '顯示日文翻譯', sjD: '在介面文字下方顯示日文翻譯輔助', mode: '模式', score: '得分', cor: '正確！', wrg: '錯誤', pa: '播放發音', ca: '正確答案應為', ch: '字元 (假名)', mk: '錯誤', nr: '下次複習', nl: '尚未學習', tr: '🎯 該複習了', hl: '小時後', dl: '天後', ab: '約', grpBasic: '清音 (基本)', grpAdv: '濁音・半濁音・拗音', grpColBasic: '基本段', grpColYoon: '拗音專用段 / 撥音', tbTitle: '五十音總表', tbBtn: '五十音表', tbHira: '平假名', tbKata: '片假名', tbRoma: '羅馬拼音', grpSoku: '促音', tbStats: '答題統計', voice: '語音人聲', voiceD: '選擇不同發音人 (取決於您的裝置與瀏覽器)', defVoice: '系統預設語音', calBtn: '日曆', calTitle: '學習日曆', calSub: '紀錄每天的成長軌跡', tot: '總題', corCount: '答對', wrgCount: '答錯', todayStats: '今日統計', todayMistakes: '今日錯題', setBtn: '設定', langBtn: '語言', manual: '手動', tapCont: '點擊繼續' } },
  'ja': { label: '日本語', t: { title: '五十音トレーニング', sub: '音を聞いて文字を識別・学習効率をレバレッジ', stTitle: '学習統計と苦手ノート', stSub: 'SM-2間隔反復アルゴリズムに基づく', setTitle: 'システム設定', setSub: '学習体験をカスタマイズ', stBtn: '苦手ノート', s1: '1. 行を選ぶ', selAll: '全て選択', deselAll: '選択解除', s2: '2. 段を選ぶ', algoT: 'アルゴリズム作動中', algoD: 'システムが「苦手」または「復習時期」の文字を優先出題します。', s3: '3. モードを選んで開始', mH2K: 'ひらがな → カタカナ', mK2H: 'カタカナ → ひらがな', am: '発音モード', amD: '問題表示時の音声再生動作を制御します', amA: '出題時に1回発音 (デフォルト)', amM: '手動クリック時のみ発音', amR: '自動一定間隔で反復発音', ai: '反復間隔（秒）', sr: 'ローマ字を表示', srD: '問題とエラーヒントにローマ字を表示します', ed: 'エラー表示秒数', edD: '不正解時、正解を拡大表示する時間', sj: '日本語の翻訳を表示', sjD: 'インターフェースの下に日本語の翻訳を表示します', mode: 'モード', score: 'スコア', cor: '正解！', wrg: '不正解', pa: '音声を再生', ca: '正解は', ch: '文字 (仮名)', mk: 'ミス', nr: '次回レビュー', nl: '未学習', tr: '🎯 復習のタイミング', hl: '時間後', dl: '日後', ab: '約', grpBasic: '清音', grpAdv: '濁音・半濁音・拗音', grpColBasic: '基本段', grpColYoon: '拗音段 / 撥音', tbTitle: '五十音表', tbBtn: '五十音表', tbHira: 'ひらがな', tbKata: 'カタカナ', tbRoma: 'ローマ字', grpSoku: '促音', tbStats: '解答統計', voice: '音声モデル', voiceD: '異なる音声を選択します (デバイス依存)', defVoice: 'システムデフォルト', calBtn: 'カレンダー', calTitle: '学習カレンダー', calSub: '毎日の成長を記録する', tot: '合計', corCount: '正解', wrgCount: '不正解', todayStats: '今日の記録', todayMistakes: '今日のミス', setBtn: '設定', langBtn: '言語', manual: '手動', tapCont: 'タップして続行' } },
  'en': { label: 'English', t: { title: 'Gojuon Practice', sub: 'Listen & Identify · Leverage Your Learning', stTitle: 'Stats & Mistake Book', stSub: 'Based on SM-2 Spaced Repetition', setTitle: 'Settings', setSub: 'Customize your experience', stBtn: 'Mistakes', s1: '1. Select Row', selAll: 'All', deselAll: 'None', s2: '2. Select Column', algoT: 'Algorithm Active', algoD: 'Prioritizing your weak and due items.', s3: '3. Select Mode & Start', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Audio Mode', amD: 'Control voice playback behavior', amA: 'Play once on show (Default)', amM: 'Manual click only', amR: 'Auto repeat interval', ai: 'Repeat Interval (sec)', sr: 'Show Romaji', srD: 'Display romaji hints', ed: 'Error Display Time', edD: 'Seconds to show correct answer on error', sj: 'Show Japanese Subtext', sjD: 'Display Japanese translations below UI texts', mode: 'Mode', score: 'Score', cor: 'Correct!', wrg: 'Wrong', pa: 'Play Audio', ca: 'Correct Answer Is', ch: 'Character', mk: 'Mistakes', nr: 'Next Review', nl: 'Not learned', tr: '🎯 Due Now', hl: 'hours', dl: 'days', ab: 'About', grpBasic: 'Basic (Seion)', grpAdv: 'Voiced / Semi / Contracted', grpColBasic: 'Basic Columns', grpColYoon: 'Yoon Cols / N', tbTitle: 'Gojuon Table', tbBtn: 'Table', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Stats', voice: 'Voice Selection', voiceD: 'Choose different speaker (Device dependent)', defVoice: 'System Default', calBtn: 'Calendar', calTitle: 'Learning Calendar', calSub: 'Track your daily progress', tot: 'Total', corCount: 'Correct', wrgCount: 'Wrong', todayStats: 'Today', todayMistakes: 'Today\'s Mistakes', setBtn: 'Settings', langBtn: 'Language', manual: 'Manual', tapCont: 'Tap to continue' } },
  'zh-CN': { label: '简体中文', t: { title: '五十音特训', sub: '听音辨字・杠杆你的学习效率', stTitle: '学习统计与错题本', stSub: '基于 SM-2 间隔复习算法', setTitle: '系统设置', setSub: '自定义您的学习体验', stBtn: '错题本', s1: '1. 选择行', selAll: '全选', deselAll: '全不选', s2: '2. 选择段', algoT: '算法启动中', algoD: '系统会自动优先出您「不熟悉」或「到期该复习」的字。', s3: '3. 选择模式并开始', mH2K: '平假名 → 片假名', mK2H: '片假名 → 平假名', am: '发音模式', amD: '控制题目出现时的语音播放行为', amA: '出题时发音一次 (默认)', amM: '仅手动点击发音', amR: '自动间隔重复发音', ai: '重复间隔秒数', sr: '显示罗马拼音', srD: '在题目与错误提示中显示罗马拼音辅助', ed: '错误提示停留秒数', edD: '答错时，正确答案放大的显示时间', sj: '显示日文翻译', sjD: '在界面文字下方显示日文翻译辅助', mode: '模式', score: '得分', cor: '正确！', wrg: '错误', pa: '播放发音', ca: '正确答案应为', ch: '字符 (假名)', mk: '错误', nr: '下次复习', nl: '尚未学习', tr: '🎯 该复习了', hl: '小时后', dl: '天后', ab: '约', grpBasic: '清音 (基本)', grpAdv: '浊音・半浊音・拗音', grpColBasic: '基本段', grpColYoon: '拗音专用段 / 拨音', tbTitle: '五十音总表', tbBtn: '五十音表', tbHira: '平假名', tbKata: '片假名', tbRoma: '罗马音', grpSoku: '促音', tbStats: '答题统计', voice: '语音人声', voiceD: '选择不同发音人 (取决于您的设备)', defVoice: '系统默认', calBtn: '日历', calTitle: '学习日历', calSub: '记录每天的成长轨迹', tot: '总题', corCount: '答对', wrgCount: '答错', todayStats: '今日统计', todayMistakes: '今日错题', setBtn: '设置', langBtn: '语言', manual: '手动', tapCont: '点击继续' } },
  'ko': { label: '한국어', t: { title: '50음도 연습', sub: '듣고 식별하기 · 학습 효율 레버리지', stTitle: '통계 및 오답 노트', stSub: 'SM-2 간격 반복 알고리즘 기반', setTitle: '설정', setSub: '학습 환경 맞춤 설정', stBtn: '오답 노트', s1: '1. 행 선택', selAll: '모두 선택', deselAll: '선택 해제', s2: '2. 단 선택', algoT: '알고리즘 작동 중', algoD: '취약하거나 복습 주기가 된 문자를 우선 출제합니다.', s3: '3. 모드 선택 및 시작', mH2K: '히라가나 → 가타카나', mK2H: '가타카나 → 히라가나', am: '오디오 모드', amD: '문제 출제 시 음성 재생 제어', amA: '출제 시 1회 재생 (기본)', amM: '수동 클릭 시에만 재생', amR: '자동 반복 재생', ai: '반복 간격(초)', sr: '로마자 표시', srD: '문제 및 오답 힌트에 로마자 표시', ed: '오답 표시 시간', edD: '틀렸을 때 정답을 표시하는 시간', sj: '일본어 번역 표시', sjD: 'UI 텍스트 아래에 일본어 번역 표시', mode: '모드', score: '점수', cor: '정답!', wrg: '오답', pa: '음성 재생', ca: '정답은', ch: '문자', mk: '오답 수', nr: '다음 복습', nl: '학습 안 함', tr: '🎯 복습할 시간', hl: '시간 후', dl: '일 후', ab: '약', grpBasic: '청음 (기본)', grpAdv: '탁음/반탁음/요음', grpColBasic: '기본 단', grpColYoon: '요음 전용 단 / 발음', tbTitle: '50음도 표', tbBtn: '50음도 표', tbHira: '히라가나', tbKata: '가타카나', tbRoma: '로마자', grpSoku: '촉음', tbStats: '통계', voice: '음성 선택', voiceD: '다른 음성 선택 (기기 종속)', defVoice: '기본 음성', calBtn: '달력', calTitle: '학습 달력', calSub: '매일의 학습 기록', tot: '총 문제', corCount: '정답', wrgCount: '오답', todayStats: '오늘 기록', todayMistakes: '오늘의 오답', setBtn: '설정', langBtn: '언어', manual: '수동', tapCont: '탭하여 계속' } },
  'es': { label: 'Español', t: { title: 'Práctica Gojuon', sub: 'Escucha e Identifica', stTitle: 'Estadísticas y Errores', stSub: 'Basado en Repetición Espaciada SM-2', setTitle: 'Ajustes', setSub: 'Personaliza tu experiencia', stBtn: 'Errores', s1: '1. Seleccionar Fila', selAll: 'Todos', deselAll: 'Ninguno', s2: '2. Seleccionar Columna', algoT: 'Algoritmo Activo', algoD: 'Priorizando elementos débiles y pendientes.', s3: '3. Seleccionar Modo y Empezar', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Modo de Audio', amD: 'Control de reproducción de voz', amA: 'Reproducir una vez (Por defecto)', amM: 'Solo manual', amR: 'Repetición automática', ai: 'Intervalo (seg)', sr: 'Mostrar Romaji', srD: 'Mostrar pistas en romaji', ed: 'Tiempo de error', edD: 'Segundos para mostrar respuesta correcta', sj: 'Mostrar Japonés', sjD: 'Mostrar traducción al japonés debajo', mode: 'Modo', score: 'Puntos', cor: '¡Correcto!', wrg: 'Incorrecto', pa: 'Reproducir Audio', ca: 'La respuesta correcta es', ch: 'Carácter', mk: 'Errores', nr: 'Próximo repaso', nl: 'No aprendido', tr: '🎯 Repasar ahora', hl: 'horas', dl: 'días', ab: 'Unos', grpBasic: 'Básico', grpAdv: 'Sonoros / Semi / Contraídos', grpColBasic: 'Columnas Básicas', grpColYoon: 'Cols de Contraídos', tbTitle: 'Tabla Gojuon', tbBtn: 'Tabla', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Estadísticas', voice: 'Voz', voiceD: 'Elige un hablante diferente', defVoice: 'Predeterminado', calBtn: 'Calendario', calTitle: 'Calendario de Aprendizaje', calSub: 'Registra tu progreso diario', tot: 'Total', corCount: 'Correcto', wrgCount: 'Incorrecto', todayStats: 'Hoy', todayMistakes: 'Errores de Hoy', setBtn: 'Ajustes', langBtn: 'Idioma', manual: 'Manual', tapCont: 'Tocar para continuar' } },
  'fr': { label: 'Français', t: { title: 'Pratique Gojuon', sub: 'Écoutez et Identifiez', stTitle: 'Statistiques et Erreurs', stSub: 'Basé sur SM-2', setTitle: 'Paramètres', setSub: 'Personnalisez votre expérience', stBtn: 'Erreurs', s1: '1. Sélectionner Ligne', selAll: 'Tout', deselAll: 'Aucun', s2: '2. Sélectionner Colonne', algoT: 'Algorithme Actif', algoD: 'Priorité aux éléments faibles.', s3: '3. Mode & Commencer', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Mode Audio', amD: 'Contrôle de lecture vocale', amA: 'Jouer une fois', amM: 'Manuel uniquement', amR: 'Répétition auto', ai: 'Intervalle (sec)', sr: 'Afficher Romaji', srD: 'Afficher les indices romaji', ed: 'Temps d\'erreur', edD: 'Secondes pour afficher la réponse', sj: 'Afficher Japonais', sjD: 'Afficher la traduction japonaise', mode: 'Mode', score: 'Score', cor: 'Correct !', wrg: 'Faux', pa: 'Lire l\'audio', ca: 'La bonne réponse est', ch: 'Caractère', mk: 'Erreurs', nr: 'Prochaine révision', nl: 'Non appris', tr: '🎯 À réviser', hl: 'heures', dl: 'jours', ab: 'Env.', grpBasic: 'Basique', grpAdv: 'Sonores / Semi / Contractés', grpColBasic: 'Colonnes Basiques', grpColYoon: 'Cols de Contractés', tbTitle: 'Tableau Gojuon', tbBtn: 'Tableau', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statistiques', voice: 'Voix', voiceD: 'Choisissez un autre locuteur', defVoice: 'Défaut', calBtn: 'Calendrier', calTitle: 'Calendrier', calSub: 'Suivez vos progrès quotidiens', tot: 'Total', corCount: 'Correct', wrgCount: 'Faux', todayStats: 'Aujourd\'hui', todayMistakes: 'Erreurs du jour', setBtn: 'Réglages', langBtn: 'Langue', manual: 'Manuel', tapCont: 'Appuyez pour continuer' } },
  'de': { label: 'Deutsch', t: { title: 'Gojuon Übung', sub: 'Hören und Identifizieren', stTitle: 'Statistiken & Fehler', stSub: 'Basierend auf SM-2', setTitle: 'Einstellungen', setSub: 'Erfahrung anpassen', stBtn: 'Fehler', s1: '1. Reihe wählen', selAll: 'Alle', deselAll: 'Keine', s2: '2. Spalte wählen', algoT: 'Algorithmus Aktiv', algoD: 'Schwache Elemente priorisiert.', s3: '3. Modus & Start', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Audio-Modus', amD: 'Sprachwiedergabe steuern', amA: 'Einmal abspielen', amM: 'Nur manuell', amR: 'Auto-Wiederholung', ai: 'Intervall (sek)', sr: 'Romaji anzeigen', srD: 'Romaji-Hinweise anzeigen', ed: 'Fehleranzeigezeit', edD: 'Sekunden für richtige Antwort', sj: 'Japanisch anzeigen', sjD: 'Japanische Übersetzung anzeigen', mode: 'Modus', score: 'Punktzahl', cor: 'Richtig!', wrg: 'Falsch', pa: 'Audio abspielen', ca: 'Richtige Antwort ist', ch: 'Zeichen', mk: 'Fehler', nr: 'Nächste Überprüfung', nl: 'Nicht gelernt', tr: '🎯 Jetzt fällig', hl: 'Stunden', dl: 'Tage', ab: 'Etwa', grpBasic: 'Einfach', grpAdv: 'Stimmhaft / Semi / Kontrahiert', grpColBasic: 'Einfache Spalten', grpColYoon: 'Kontrahierte Spalten', tbTitle: 'Gojuon Tabelle', tbBtn: 'Tabelle', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statistiken', voice: 'Stimme', voiceD: 'Wählen Sie einen anderen Sprecher', defVoice: 'Standard', calBtn: 'Kalender', calTitle: 'Lernkalender', calSub: 'Verfolgen Sie Ihren Fortschritt', tot: 'Gesamt', corCount: 'Richtig', wrgCount: 'Falsch', todayStats: 'Heute', todayMistakes: 'Heutige Fehler', setBtn: 'Einstell.', langBtn: 'Sprache', manual: 'Manuell', tapCont: 'Tippen zum Fortfahren' } },
  'it': { label: 'Italiano', t: { title: 'Pratica Gojuon', sub: 'Ascolta e Identifica', stTitle: 'Statistiche e Errori', stSub: 'Basato su SM-2', setTitle: 'Impostazioni', setSub: 'Personalizza', stBtn: 'Errori', s1: '1. Scegli Riga', selAll: 'Tutti', deselAll: 'Nessuno', s2: '2. Scegli Colonna', algoT: 'Algoritmo Attivo', algoD: 'Priorità agli elementi deboli.', s3: '3. Modalità e Inizio', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Modalità Audio', amD: 'Controllo riproduzione', amA: 'Riproduci una volta', amM: 'Solo manuale', amR: 'Ripetizione auto', ai: 'Intervallo (sec)', sr: 'Mostra Romaji', srD: 'Mostra suggerimenti romaji', ed: 'Tempo di errore', edD: 'Secondi per mostrare la risposta', sj: 'Mostra Giapponese', sjD: 'Mostra traduzione giapponese', mode: 'Modalità', score: 'Punti', cor: 'Corretto!', wrg: 'Sbagliato', pa: 'Riproduci', ca: 'La risposta è', ch: 'Carattere', mk: 'Errori', nr: 'Prossima revisione', nl: 'Non imparato', tr: '🎯 Da ripassare', hl: 'ore', dl: 'giorni', ab: 'Circa', grpBasic: 'Base', grpAdv: 'Sonori / Semi / Contratti', grpColBasic: 'Colonne Base', grpColYoon: 'Colonne Contratti', tbTitle: 'Tabella Gojuon', tbBtn: 'Tabella', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statistiche', voice: 'Voce', voiceD: 'Scegli un parlante diverso', defVoice: 'Predefinito', calBtn: 'Calendario', calTitle: 'Calendario', calSub: 'Tieni traccia dei progressi', tot: 'Totale', corCount: 'Corretto', wrgCount: 'Sbagliato', todayStats: 'Oggi', todayMistakes: 'Errori di Oggi', setBtn: 'Impostaz.', langBtn: 'Lingua', manual: 'Manuale', tapCont: 'Tocca per continuare' } },
  'pt': { label: 'Português', t: { title: 'Prática Gojuon', sub: 'Ouça e Identifique', stTitle: 'Estatísticas e Erros', stSub: 'Baseado em SM-2', setTitle: 'Configurações', setSub: 'Personalize', stBtn: 'Erros', s1: '1. Selecionar Linha', selAll: 'Todos', deselAll: 'Nenhum', s2: '2. Selecionar Coluna', algoT: 'Algoritmo Ativo', algoD: 'Prioridade aos itens fracos.', s3: '3. Modo e Iniciar', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Modo de Áudio', amD: 'Controle de reprodução', amA: 'Tocar uma vez', amM: 'Apenas manual', amR: 'Repetição auto', ai: 'Intervalo (seg)', sr: 'Mostrar Romaji', srD: 'Mostrar dicas romaji', ed: 'Tempo de erro', edD: 'Segundos para mostrar resposta', sj: 'Mostrar Japonês', sjD: 'Mostrar tradução japonesa', mode: 'Modo', score: 'Pontos', cor: 'Correto!', wrg: 'Errado', pa: 'Ouvir', ca: 'A resposta é', ch: 'Caractere', mk: 'Erros', nr: 'Próxima revisão', nl: 'Não aprendido', tr: '🎯 Revisar agora', hl: 'horas', dl: 'dias', ab: 'Cerca', grpBasic: 'Básico', grpAdv: 'Sonoros / Semi / Contraídos', grpColBasic: 'Colunas Básicas', grpColYoon: 'Colunas Contraídas', tbTitle: 'Tabela Gojuon', tbBtn: 'Tabela', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Estatísticas', voice: 'Voz', voiceD: 'Escolha um locutor diferente', defVoice: 'Padrão', calBtn: 'Calendário', calTitle: 'Calendário', calSub: 'Acompanhe seu progresso', tot: 'Total', corCount: 'Certo', wrgCount: 'Errado', todayStats: 'Hoje', todayMistakes: 'Erros de Hoje', setBtn: 'Config.', langBtn: 'Idioma', manual: 'Manual', tapCont: 'Toque para continuar' } },
  'ru': { label: 'Русский', t: { title: 'Практика Годзюон', sub: 'Слушай и Узнавай', stTitle: 'Статистика и Ошибки', stSub: 'На основе SM-2', setTitle: 'Настройки', setSub: 'Настройка', stBtn: 'Ошибки', s1: '1. Выбор строки', selAll: 'Все', deselAll: 'Ничего', s2: '2. Выбор столбца', algoT: 'Алгоритм активен', algoD: 'Приоритет слабым элементам.', s3: '3. Режим и Старт', mH2K: 'Хирагана → Катакана', mK2H: 'Катакана → Хирагана', am: 'Аудио', amD: 'Управление звуком', amA: 'Один раз', amM: 'Вручную', amR: 'Автоповтор', ai: 'Интервал (сек)', sr: 'Показать Ромадзи', srD: 'Подсказки ромадзи', ed: 'Время ошибки', edD: 'Секунды для показа ответа', sj: 'Показать Японский', sjD: 'Японский перевод', mode: 'Режим', score: 'Счет', cor: 'Верно!', wrg: 'Ошибка', pa: 'Слушать', ca: 'Правильный ответ', ch: 'Символ', mk: 'Ошибки', nr: 'След. повтор', nl: 'Не изучено', tr: '🎯 Пора', hl: 'ч.', dl: 'дн.', ab: 'Около', grpBasic: 'Базовые', grpAdv: 'Звонкие / Полузвонкие / Смягченные', grpColBasic: 'Базовые столбцы', grpColYoon: 'Смягч. столбцы', tbTitle: 'Таблица Годзюон', tbBtn: 'Таблица', tbHira: 'Хирагана', tbKata: 'Катакана', tbRoma: 'Ромадзи', grpSoku: 'Сокуон', tbStats: 'Статистика', voice: 'Голос', voiceD: 'Выберите другого диктора', defVoice: 'По умолчанию', calBtn: 'Календарь', calTitle: 'Календарь обучения', calSub: 'Отслеживайте свой прогресс', tot: 'Всего', corCount: 'Верно', wrgCount: 'Ошибки', todayStats: 'Сегодня', todayMistakes: 'Ошибки за сегодня', setBtn: 'Настройки', langBtn: 'Язык', manual: 'Вручную', tapCont: 'Нажмите, чтобы продолжить' } },
  'vi': { label: 'Tiếng Việt', t: { title: 'Luyện tập Gojuon', sub: 'Nghe & Nhận diện', stTitle: 'Thống kê & Lỗi', stSub: 'Dựa trên SM-2', setTitle: 'Cài đặt', setSub: 'Tùy chỉnh', stBtn: 'Sổ lỗi', s1: '1. Chọn Hàng', selAll: 'Tất cả', deselAll: 'Bỏ chọn', s2: '2. Chọn Cột', algoT: 'Thuật toán đang chạy', algoD: 'Ưu tiên các từ yếu.', s3: '3. Chế độ & Bắt đầu', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Chế độ Âm thanh', amD: 'Kiểm soát phát âm', amA: 'Phát một lần', amM: 'Chỉ thủ công', amR: 'Lặp lại tự động', ai: 'Khoảng thời gian (giây)', sr: 'Hiện Romaji', srD: 'Hiển thị gợi ý romaji', ed: 'Thời báo lỗi', edD: 'Giây hiển thị đáp án đúng', sj: 'Hiện tiếng Nhật', sjD: 'Hiển thị dịch tiếng Nhật', mode: 'Chế độ', score: 'Điểm', cor: 'Chính xác!', wrg: 'Sai', pa: 'Nghe', ca: 'Đáp án đúng là', ch: 'Ký tự', mk: 'Lỗi', nr: 'Ôn tập tiếp', nl: 'Chưa học', tr: '🎯 Cần ôn ngay', hl: 'giờ', dl: 'ngày', ab: 'Khoảng', grpBasic: 'Cơ bản', grpAdv: 'Âm đục / Bán đục / Âm ghép', grpColBasic: 'Cột cơ bản', grpColYoon: 'Cột âm ghép', tbTitle: 'Bảng Gojuon', tbBtn: 'Bảng', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Thống kê', voice: 'Giọng nói', voiceD: 'Chọn giọng nói khác nhau', defVoice: 'Mặc định', calBtn: 'Lịch', calTitle: 'Lịch học tập', calSub: 'Theo dõi tiến trình', tot: 'Tổng', corCount: 'Đúng', wrgCount: 'Sai', todayStats: 'Hôm nay', todayMistakes: 'Lỗi hôm nay', setBtn: 'Cài đặt', langBtn: 'Ngôn ngữ', manual: 'Thủ công', tapCont: 'Chạm để tiếp tục' } },
  'th': { label: 'ไทย', t: { title: 'ฝึกโกจูอง', sub: 'ฟังและจดจำ', stTitle: 'สถิติและข้อผิดพลาด', stSub: 'อัลกอริทึม SM-2', setTitle: 'การตั้งค่า', setSub: 'ปรับแต่ง', stBtn: 'ข้อผิดพลาด', s1: '1. เลือกแถว', selAll: 'ทั้งหมด', deselAll: 'ยกเลิก', s2: '2. เลือกคอลัมน์', algoT: 'อัลกอริทึมทำงาน', algoD: 'จัดลำดับคำที่อ่อนแอ', s3: '3. โหมด & เริ่ม', mH2K: 'ฮิรางานะ → คาตาคานะ', mK2H: 'คาตาคานะ → ฮิรางานะ', am: 'โหมดเสียง', amD: 'ควบคุมการเล่นเสียง', amA: 'เล่นครั้งเดียว', amM: 'เล่นด้วยตนเอง', amR: 'เล่นซ้ำอัตโนมัติ', ai: 'ช่วงเวลา (วินาที)', sr: 'แสดงโรมาจิ', srD: 'แสดงคำใบ้โรมาจิ', ed: 'เวลาแสดงข้อผิดพลาด', edD: 'วินาทีที่แสดงคำตอบที่ถูก', sj: 'แสดงภาษาญี่ปุ่น', sjD: 'แสดงคำแปลภาษาญี่ปุ่น', mode: 'โหมด', score: 'คะแนน', cor: 'ถูกต้อง!', wrg: 'ผิด', pa: 'ฟังเสียง', ca: 'คำตอบที่ถูกคือ', ch: 'ตัวอักษร', mk: 'ข้อผิดพลาด', nr: 'ทบทวนครั้งต่อไป', nl: 'ยังไม่ได้เรียน', tr: '🎯 ทบทวนตอนนี้', hl: 'ชั่วโมง', dl: 'วัน', ab: 'ประมาณ', grpBasic: 'พื้นฐาน', grpAdv: 'เสียงขุ่น / กึ่งขุ่น / เสียงควบ', grpColBasic: 'คอลัมน์พื้นฐาน', grpColYoon: 'คอลัมน์เสียงควบ', tbTitle: 'ตารางโกจูอง', tbBtn: 'ตาราง', tbHira: 'ฮิรางานะ', tbKata: 'คาตาคานะ', tbRoma: 'โรมาจิ', grpSoku: 'เสียงกัก', tbStats: 'สถิติ', voice: 'เสียง', voiceD: 'เลือกผู้พูดที่แตกต่างกัน', defVoice: 'ค่าเริ่มต้น', calBtn: 'ปฏิทิน', calTitle: 'ปฏิทินการเรียนรู้', calSub: 'ติดตามความก้าวหน้า', tot: 'รวม', corCount: 'ถูก', wrgCount: 'ผิด', todayStats: 'วันนี้', todayMistakes: 'ข้อผิดพลาดวันนี้', setBtn: 'การตั้งค่า', langBtn: 'ภาษา', manual: 'ด้วยตนเอง', tapCont: 'แตะเพื่อดำเนินการต่อ' } },
  'id': { label: 'Bahasa Indonesia', t: { title: 'Latihan Gojuon', sub: 'Dengar & Identifikasi', stTitle: 'Statistik & Kesalahan', stSub: 'Berdasarkan SM-2', setTitle: 'Pengaturan', setSub: 'Sesuaikan', stBtn: 'Kesalahan', s1: '1. Pilih Baris', selAll: 'Semua', deselAll: 'Kosong', s2: '2. Pilih Kolom', algoT: 'Algoritma Aktif', algoD: 'Memprioritaskan item lemah.', s3: '3. Mode & Mulai', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Mode Audio', amD: 'Kontrol audio', amA: 'Putar sekali', amM: 'Hanya manual', amR: 'Ulang otomatis', ai: 'Interval (detik)', sr: 'Tampilkan Romaji', srD: 'Tampilkan petunjuk romaji', ed: 'Waktu Error', edD: 'Detik untuk tampilkan jawaban', sj: 'Tampilkan Jepang', sjD: 'Tampilkan terjemahan Jepang', mode: 'Mode', score: 'Skor', cor: 'Benar!', wrg: 'Salah', pa: 'Putar', ca: 'Jawaban yang benar', ch: 'Karakter', mk: 'Salah', nr: 'Review berikutnya', nl: 'Belum dipelajari', tr: '🎯 Review sekarang', hl: 'jam', dl: 'hari', ab: 'Sekitar', grpBasic: 'Dasar', grpAdv: 'Suara Vokal / Semi / Ganda', grpColBasic: 'Kolom Dasar', grpColYoon: 'Kolom Ganda', tbTitle: 'Tabel Gojuon', tbBtn: 'Tabel', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statistik', voice: 'Suara', voiceD: 'Pilih pembicara berbeda', defVoice: 'Default', calBtn: 'Kalender', calTitle: 'Kalender Belajar', calSub: 'Lacak kemajuan harian', tot: 'Total', corCount: 'Benar', wrgCount: 'Salah', todayStats: 'Hari ini', todayMistakes: 'Kesalahan Hari Ini', setBtn: 'Pengaturan', langBtn: 'Bahasa', manual: 'Manual', tapCont: 'Ketuk untuk melanjutkan' } },
  'ms': { label: 'Bahasa Melayu', t: { title: 'Latihan Gojuon', sub: 'Dengar & Kenal', stTitle: 'Statistik & Kesalahan', stSub: 'Berdasarkan SM-2', setTitle: 'Tetapan', setSub: 'Sesuaikan', stBtn: 'Kesalahan', s1: '1. Pilih Baris', selAll: 'Semua', deselAll: 'Kosong', s2: '2. Pilih Lajur', algoT: 'Algoritma Aktif', algoD: 'Mengutamakan item lemah.', s3: '3. Mod & Mula', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Mod Audio', amD: 'Kawalan audio', amA: 'Main sekali', amM: 'Manual sahaja', amR: 'Ulang automatik', ai: 'Selang (saat)', sr: 'Papar Romaji', srD: 'Papar petunjuk romaji', ed: 'Masa Ralat', edD: 'Saat untuk papar jawapan', sj: 'Papar Jepun', sjD: 'Papar terjemahan Jepun', mode: 'Mod', score: 'Skor', cor: 'Betul!', wrg: 'Salah', pa: 'Main', ca: 'Jawapan yang betul', ch: 'Aksara', mk: 'Salah', nr: 'Ulangkaji sisa', nl: 'Belum belajar', tr: '🎯 Ulangkaji kini', hl: 'jam', dl: 'hari', ab: 'Kira-kira', grpBasic: 'Asas', grpAdv: 'Bersuara / Semi / Digraf', grpColBasic: 'Lajur Asas', grpColYoon: 'Lajur Digraf', tbTitle: 'Jadual Gojuon', tbBtn: 'Jadual', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statistik', voice: 'Suara', voiceD: 'Pilih penutur berbeza', defVoice: 'Lalai', calBtn: 'Kalendar', calTitle: 'Kalendar Belajar', calSub: 'Jejak kemajuan harian', tot: 'Jumlah', corCount: 'Betul', wrgCount: 'Salah', todayStats: 'Hari ini', todayMistakes: 'Kesalahan Hari Ini', setBtn: 'Tetapan', langBtn: 'Bahasa', manual: 'Manual', tapCont: 'Ketik untuk meneruskan' } },
  'ar': { label: 'العربية', t: { title: 'تدريب الغوجون', sub: 'استمع وتعرف', stTitle: 'الإحصائيات والأخطاء', stSub: 'بناءً على SM-2', setTitle: 'الإعدادات', setSub: 'تخصيص', stBtn: 'الأخطاء', s1: '1. اختر الصف', selAll: 'الكل', deselAll: 'لا شيء', s2: '2. اختر العمود', algoT: 'الخوارزمية نشطة', algoD: 'إعطاء الأولوية للعناصر الضعيفة', s3: '3. الوضع والبدء', mH2K: 'هيراغانا → كاتاكانا', mK2H: 'كاتاكانا → هيراغانا', am: 'وضع الصوت', amD: 'التحكم في الصوت', amA: 'تشغيل مرة واحدة', amM: 'يدوي فقط', amR: 'تكرار تلقائي', ai: 'الفاصل (ثانية)', sr: 'عرض روماجي', srD: 'عرض تلميحات روماجي', ed: 'وقت الخطأ', edD: 'ثواني لعرض الإجابة', sj: 'عرض اليابانية', sjD: 'عرض الترجمة اليابانية', mode: 'الوضع', score: 'النتيجة', cor: 'صحيح!', wrg: 'خطأ', pa: 'تشغيل', ca: 'الإجابة الصحيحة هي', ch: 'الحرف', mk: 'أخطاء', nr: 'المراجعة التالية', nl: 'لم يتم تعلمه', tr: '🎯 مراجعة الآن', hl: 'ساعة', dl: 'يوم', ab: 'حوالي', grpBasic: 'أساسي', grpAdv: 'جهري / شبه جهري / مركب', grpColBasic: 'أعمدة أساسية', grpColYoon: 'أعمدة مركبة', tbTitle: 'جدول الغوجون', tbBtn: 'جدول', tbHira: 'هيراغانا', tbKata: 'كاتاكانا', tbRoma: 'روماجي', grpSoku: 'سوكوون', tbStats: 'إحصائيات', voice: 'الصوت', voiceD: 'اختر متحدثًا مختلفًا', defVoice: 'الافتراضي', calBtn: 'تقويم', calTitle: 'تقويم التعلم', calSub: 'تتبع تقدمك اليومي', tot: 'إجمالي', corCount: 'صحيح', wrgCount: 'خطأ', todayStats: 'اليوم', todayMistakes: 'أخطاء اليوم', setBtn: 'الإعدادات', langBtn: 'اللغة', manual: 'يدوي', tapCont: 'انقر للمتابعة' } },
  'hi': { label: 'हिन्दी', t: { title: 'गोजुओन अभ्यास', sub: 'सुनें और पहचानें', stTitle: 'आँकड़े और गलतियाँ', stSub: 'SM-2 पर आधारित', setTitle: 'सेटिंग्स', setSub: 'अनुकूलित करें', stBtn: 'गलतियाँ', s1: '1. पंक्ति चुनें', selAll: 'सभी', deselAll: 'कोई नहीं', s2: '2. स्तंभ चुनें', algoT: 'एल्गोरिदम सक्रिय', algoD: 'कमजोर अक्षरों को प्राथमिकता।', s3: '3. मोड और प्रारंभ', mH2K: 'हिरागाना → काताकाना', mK2H: 'काताकाना → हिरागाना', am: 'ऑडियो मोड', amD: 'ऑडियो नियंत्रण', amA: 'एक बार चलाएं', amM: 'केवल मैनुअल', amR: 'स्वतः दोहराएं', ai: 'अंतराल (सेकंड)', sr: 'रोमाजी दिखाएं', srD: 'रोमाजी संकेत दिखाएं', ed: 'त्रुटि समय', edD: 'उत्तर दिखाने के लिए सेकंड', sj: 'जापानी दिखाएं', sjD: 'जापानी अनुवाद दिखाएं', mode: 'मोड', score: 'स्कोर', cor: 'सही!', wrg: 'गलत', pa: 'सुने', ca: 'सही उत्तर है', ch: 'अक्षर', mk: 'गलतियाँ', nr: 'अगला रिवीजन', nl: 'नहीं सीखा', tr: '🎯 अभी रिवीजन', hl: 'घंटे', dl: 'दिन', ab: 'लगभग', grpBasic: 'मूल', grpAdv: 'घोष / अर्धघोष / संयुक्त', grpColBasic: 'मूल स्तंभ', grpColYoon: 'संयुक्त स्तंभ', tbTitle: 'गोजुओन तालिका', tbBtn: 'तालिका', tbHira: 'हिरागाना', tbKata: 'काताकाना', tbRoma: 'रोमाजी', grpSoku: 'सोकुओन', tbStats: 'आँकड़े', voice: 'आवाज़', voiceD: 'विभिन्न वक्ताओं को चुनें', defVoice: 'डिफ़ॉल्ट', calBtn: 'कैलेंडर', calTitle: 'सीखने का कैलेंडर', calSub: 'दैनिक प्रगति ट्रैक करें', tot: 'कुल', corCount: 'सही', wrgCount: 'गलत', todayStats: 'आज', todayMistakes: 'आज की गलतियाँ', setBtn: 'सेटिंग्स', langBtn: 'भाषा', manual: 'मैनुअल', tapCont: 'जारी रखने के लिए टैप करें' } },
  'tr': { label: 'Türkçe', t: { title: 'Gojuon Pratiği', sub: 'Dinle ve Tanı', stTitle: 'İstatistik & Hatalar', stSub: 'SM-2 Tabanlı', setTitle: 'Ayarlar', setSub: 'Özelleştir', stBtn: 'Hatalar', s1: '1. Satır Seç', selAll: 'Tümü', deselAll: 'Hiçbiri', s2: '2. Sütun Seç', algoT: 'Algoritma Aktif', algoD: 'Zayıf öğelere öncelik.', s3: '3. Mod & Başla', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Ses Modu', amD: 'Ses kontrolü', amA: 'Bir kez çal', amM: 'Sadece manuel', amR: 'Otomatik tekrar', ai: 'Aralık (sn)', sr: 'Romaji Göster', srD: 'Romaji ipuçları', ed: 'Hata Süresi', edD: 'Cevap gösterme saniyesi', sj: 'Japonca Göster', sjD: 'Japonca çeviri göster', mode: 'Mod', score: 'Puan', cor: 'Doğru!', wrg: 'Yanlış', pa: 'Oynat', ca: 'Doğru cevap', ch: 'Karakter', mk: 'Hatalar', nr: 'Sonraki tekrar', nl: 'Öğrenilmedi', tr: '🎯 Tekrar zamanı', hl: 'saat', dl: 'gün', ab: 'Yaklaşık', grpBasic: 'Temel', grpAdv: 'Ötümlü / Yarı / Bileşik', grpColBasic: 'Temel Sütunlar', grpColYoon: 'Bileşik Sütunlar', tbTitle: 'Gojuon Tablosu', tbBtn: 'Tablo', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'İstatistik', voice: 'Ses', voiceD: 'Farklı konuşmacı seçin', defVoice: 'Varsayılan', calBtn: 'Takvim', calTitle: 'Öğrenme Takvimi', calSub: 'Günlük gelişiminizi izleyin', tot: 'Toplam', corCount: 'Doğru', wrgCount: 'Yanlış', todayStats: 'Bugün', todayMistakes: 'Bugünkü Hatalar', setBtn: 'Ayarlar', langBtn: 'Dil', manual: 'Manuel', tapCont: 'Devam etmek için dokunun' } },
  'nl': { label: 'Nederlands', t: { title: 'Gojuon Oefening', sub: 'Luister & Identificeer', stTitle: 'Statistieken & Fouten', stSub: 'Gebaseerd op SM-2', setTitle: 'Instellingen', setSub: 'Aanpassen', stBtn: 'Fouten', s1: '1. Kies Rij', selAll: 'Alles', deselAll: 'Niets', s2: '2. Kies Kolom', algoT: 'Algoritme Actief', algoD: 'Prioriteit aan zwakke items.', s3: '3. Modus & Start', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Audio Modus', amD: 'Audio controle', amA: 'Speel één keer', amM: 'Alleen handmatig', amR: 'Auto herhaal', ai: 'Interval (sec)', sr: 'Toon Romaji', srD: 'Toon romaji hints', ed: 'Fout Tijd', edD: 'Seconden voor antwoord', sj: 'Toon Japans', sjD: 'Toon Japanse vertaling', mode: 'Modus', score: 'Score', cor: 'Correct!', wrg: 'Fout', pa: 'Afspelen', ca: 'Het juiste antwoord is', ch: 'Teken', mk: 'Fouten', nr: 'Volgende review', nl: 'Niet geleerd', tr: '🎯 Review nu', hl: 'uur', dl: 'dagen', ab: 'Ongeveer', grpBasic: 'Basis', grpAdv: 'Stemhebbend / Semi / Samengesteld', grpColBasic: 'Basis Kolommen', grpColYoon: 'Samen. Kolommen', tbTitle: 'Gojuon Tabel', tbBtn: 'Tabel', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statistieken', voice: 'Stem', voiceD: 'Kies een andere spreker', defVoice: 'Standaard', calBtn: 'Kalender', calTitle: 'Leerkalender', calSub: 'Houd uw voortgang bij', tot: 'Totaal', corCount: 'Correct', wrgCount: 'Fout', todayStats: 'Vandaag', todayMistakes: 'Fouten van vandaag', setBtn: 'Instell.', langBtn: 'Taal', manual: 'Handmatig', tapCont: 'Tik om door te gaan' } },
  'pl': { label: 'Polski', t: { title: 'Praktyka Gojuon', sub: 'Słuchaj i Rozpoznawaj', stTitle: 'Statystyki i Błędy', stSub: 'Oparte na SM-2', setTitle: 'Ustawienia', setSub: 'Dostosuj', stBtn: 'Błędy', s1: '1. Wybierz Wiersz', selAll: 'Wszystkie', deselAll: 'Żadne', s2: '2. Wybierz Kolumnę', algoT: 'Algorytm Aktywny', algoD: 'Priorytet słabych znaków.', s3: '3. Tryb i Start', mH2K: 'Hiragana → Katakana', mK2H: 'Katakana → Hiragana', am: 'Tryb Audio', amD: 'Kontrola dźwięku', amA: 'Odtwórz raz', amM: 'Tylko ręcznie', amR: 'Auto powtarzanie', ai: 'Interwał (sek)', sr: 'Pokaż Romaji', srD: 'Pokaż podpowiedzi romaji', ed: 'Czas Błędu', edD: 'Sekundy na odpowiedź', sj: 'Pokaż Japoński', sjD: 'Pokaż japońskie tłumaczenie', mode: 'Tryb', score: 'Wynik', cor: 'Dobrze!', wrg: 'Błąd', pa: 'Odtwórz', ca: 'Poprawna odpowiedź', ch: 'Znak', mk: 'Błędy', nr: 'Następna rewizja', nl: 'Nie nauczono', tr: '🎯 Powtórz teraz', hl: 'godz.', dl: 'dni', ab: 'Około', grpBasic: 'Podstawowe', grpAdv: 'Dźwięczne / Pół / Złożone', grpColBasic: 'Podst. Kolumny', grpColYoon: 'Złożone Kolumny', tbTitle: 'Tabela Gojuon', tbBtn: 'Tabela', tbHira: 'Hiragana', tbKata: 'Katakana', tbRoma: 'Romaji', grpSoku: 'Sokuon', tbStats: 'Statystyki', voice: 'Głos', voiceD: 'Wybierz innego lektora', defVoice: 'Domyślny', calBtn: 'Kalendarz', calTitle: 'Kalendarz Nauki', calSub: 'Śledź swoje postępy', tot: 'Suma', corCount: 'Dobrze', wrgCount: 'Błąd', todayStats: 'Dzisiaj', todayMistakes: 'Dzisiejsze Błędy', setBtn: 'Ustaw.', langBtn: 'Język', manual: 'Ręcznie', tapCont: 'Dotknij, aby kontynuować' } }
};

// 定義「行」(橫向)
const rowDefs = [
  { id: 'a', label: 'あ行', chars: ['a', 'i', 'u', 'e', 'o'] },
  { id: 'ka', label: 'か行', chars: ['ka', 'ki', 'ku', 'ke', 'ko'] },
  { id: 'sa', label: 'さ行', chars: ['sa', 'shi', 'su', 'se', 'so'] },
  { id: 'ta', label: 'た行', chars: ['ta', 'chi', 'tsu', 'te', 'to'] },
  { id: 'na', label: 'な行', chars: ['na', 'ni', 'nu', 'ne', 'no'] },
  { id: 'ha', label: 'は行', chars: ['ha', 'hi', 'fu', 'he', 'ho'] },
  { id: 'ma', label: 'ま行', chars: ['ma', 'mi', 'mu', 'me', 'mo'] },
  { id: 'ya', label: 'や行', chars: ['ya', 'yu', 'yo'] },
  { id: 'ra', label: 'ら行', chars: ['ra', 'ri', 'ru', 're', 'ro'] },
  { id: 'wa', label: 'わ・ん', chars: ['wa', 'wo', 'n'] },
  { id: 'dakuon', label: '濁音 (全部)', chars: ['ga', 'gi', 'gu', 'ge', 'go', 'za', 'ji', 'zu', 'ze', 'zo', 'da', 'dji', 'dzu', 'de', 'do', 'ba', 'bi', 'bu', 'be', 'bo'] },
  { id: 'handakuon', label: '半濁音 (全部)', chars: ['pa', 'pi', 'pu', 'pe', 'po'] },
  { id: 'yoon', label: '拗音 (全部)', chars: ['kya', 'kyu', 'kyo', 'sha', 'shu', 'sho', 'cha', 'chu', 'cho', 'nya', 'nyu', 'nyo', 'hya', 'hyu', 'hyo', 'mya', 'myu', 'myo', 'rya', 'ryu', 'ryo', 'gya', 'gyu', 'gyo', 'ja', 'ju', 'jo', 'bya', 'byu', 'byo', 'pya', 'pyu', 'pyo'] }
];

const rowGroups = [
  { tKey: 'grpBasic', items: rowDefs.slice(0, 10) },
  { tKey: 'grpAdv', items: rowDefs.slice(10, 13) }
];

const colDefs = [
  { id: 'col-a', label: 'あ段', chars: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'ga', 'za', 'da', 'ba', 'pa'] },
  { id: 'col-i', label: 'い段', chars: ['i', 'ki', 'shi', 'chi', 'ni', 'hi', 'mi', 'ri', 'gi', 'ji', 'dji', 'bi', 'pi'] },
  { id: 'col-u', label: 'う段', chars: ['u', 'ku', 'su', 'tsu', 'nu', 'fu', 'mu', 'yu', 'ru', 'gu', 'zu', 'dzu', 'bu', 'pu'] },
  { id: 'col-e', label: 'え段', chars: ['e', 'ke', 'se', 'te', 'ne', 'he', 'me', 're', 'ge', 'ze', 'de', 'be', 'pe'] },
  { id: 'col-o', label: 'お段', chars: ['o', 'ko', 'so', 'to', 'no', 'ho', 'mo', 'yo', 'ro', 'wo', 'go', 'zo', 'do', 'bo', 'po'] },
  { id: 'col-ya', label: 'ゃ段(拗)', chars: ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'bya', 'pya'] },
  { id: 'col-yu', label: 'ゅ段(拗)', chars: ['kyu', 'shu', 'chu', 'nyu', 'hyu', 'myu', 'ryu', 'gyu', 'ju', 'byu', 'pyu'] },
  { id: 'col-yo', label: 'ょ段(拗)', chars: ['kyo', 'sho', 'cho', 'nyo', 'hyo', 'myo', 'ryo', 'gyo', 'jo', 'byo', 'pyo'] },
  { id: 'col-n', label: '撥音(ん)', chars: ['n'] }
];

const colGroups = [
  { tKey: 'grpColBasic', items: colDefs.slice(0, 5) },
  { tKey: 'grpColYoon', items: colDefs.slice(5, 9) }
];

const getTodayKey = (dateObj = new Date()) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [mode, setMode] = useState('hiragana');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [prevGameState, setPrevGameState] = useState('menu');

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);

  const [availableVoices, setAvailableVoices] = useState([]);
  const [tableDisplay, setTableDisplay] = useState({ hiragana: true, katakana: true, romaji: true, stats: false });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_settings_v1');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '', ...parsed
      };
    } catch (e) {
      return { showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '' };
    }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_settings_v1', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const jpVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
        setAvailableVoices(jpVoices);
      }
    };
    loadVoices();
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const [dailyStats, setDailyStats] = useState(() => {
    try {
      const savedData = localStorage.getItem('gojuon_daily_stats_v1');
      return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_daily_stats_v1', JSON.stringify(dailyStats));
  }, [dailyStats]);

  const [calMonth, setCalMonth] = useState(new Date());
  const [selDateStr, setSelDateStr] = useState(getTodayKey());

  const t = useCallback((key, langOverride = null) => {
    const lang = langOverride || settings.uiLang;
    const dict = i18n[lang] || i18n['zh-TW'];
    return dict.t[key] || i18n['zh-TW'].t[key] || key;
  }, [settings.uiLang]);

  // 新增：智慧去重邏輯 (Smart Deduplication)，中文日文相同時不重複顯示
  const DT = ({ tKey, className = "", jpClassName = "", spanClass = "", flexCol = true }) => {
    const mainText = t(tKey);
    const jpText = t(tKey, 'ja');
    const showJp = settings.showJpSubtext && settings.uiLang !== 'ja' && mainText !== jpText; // 防重複

    if (!flexCol) {
      return (
        <>
          <span className={spanClass}>{mainText}</span>
          {showJp && <span className={jpClassName}>{jpText}</span>}
        </>
      )
    }

    return (
      <div className={`flex flex-col ${className}`}>
        <span className={spanClass}>{mainText}</span>
        {showJp && <span className={`text-[0.65rem] opacity-70 mt-0.5 ${jpClassName}`}>{jpText}</span>}
      </div>
    );
  };

  const [srsData, setSrsData] = useState(() => {
    try {
      const savedData = localStorage.getItem('gojuon_srs_v1');
      return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_srs_v1', JSON.stringify(srsData));
  }, [srsData]);

  const playAudio = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;

      if (settings.selectedVoiceURI && availableVoices.length > 0) {
        const selectedVoice = availableVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  }, [settings.selectedVoiceURI, availableVoices]);

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateNextQuestion = useCallback((currentMode, currentSrsData, currentSettings) => {
    const activeKana = kanaData.filter(kana => {
      if (kana.romaji === 'xtsu') return false;

      const rowMatch = rowDefs.find(r => r.chars.includes(kana.romaji));
      const colMatch = colDefs.find(c => c.chars.includes(kana.romaji));
      const inRow = rowMatch && selectedRows.includes(rowMatch.id);
      const inCol = colMatch && selectedCols.includes(colMatch.id);

      if (selectedRows.length > 0 && selectedCols.length > 0) return inRow && inCol;
      else if (selectedRows.length > 0) return inRow;
      else if (selectedCols.length > 0) {
        if (inCol) {
          const isDakuonOrHandakuon = tableLayout.dakuon.flat().includes(kana.romaji);
          if (isDakuonOrHandakuon) return false;
          return true;
        }
        return false;
      }
      return false;
    });

    const now = Date.now();
    const dueItems = activeKana.filter(kana => {
      const srsItem = currentSrsData[kana.romaji];
      return !srsItem || srsItem.nextReview <= now;
    });

    const safeKanaData = kanaData.filter(k => k.romaji !== 'xtsu');
    const pool = dueItems.length > 0 ? dueItems : (activeKana.length > 0 ? activeKana : safeKanaData);
    const correctIndex = Math.floor(Math.random() * pool.length);
    const correctItem = pool[correctIndex];

    const getCategory = (romaji) => {
      if (tableLayout.seion.flat().includes(romaji)) return 'seion';
      if (tableLayout.dakuon.flat().includes(romaji)) return 'dakuon';
      if (tableLayout.yoon.flat().includes(romaji)) return 'yoon';
      return 'all';
    };

    const targetCategory = getCategory(correctItem.romaji);
    const categoryKanaData = safeKanaData.filter(k => getCategory(k.romaji) === targetCategory);
    const sameCategoryInPool = pool.filter(k => getCategory(k.romaji) === targetCategory);
    const wrongPool = sameCategoryInPool.length >= 4 ? sameCategoryInPool : categoryKanaData;

    let wrongItems = [];
    while (wrongItems.length < 3) {
      const wrongIndex = Math.floor(Math.random() * wrongPool.length);
      const candidate = wrongPool[wrongIndex];
      if (candidate.romaji !== correctItem.romaji && !wrongItems.find(w => w.romaji === candidate.romaji)) {
        wrongItems.push(candidate);
      }
    }

    const allOptions = shuffleArray([correctItem, ...wrongItems]);
    setCurrentQuestion(correctItem);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsAnimating(false);

    if (currentSettings.audioMode !== 'manual') {
      playAudio(correctItem.katakana);
    }
  }, [playAudio, selectedRows, selectedCols]);

  useEffect(() => {
    if (gameState === 'playing' && currentQuestion && !isAnimating && !showCorrection && settings.audioMode === 'repeat') {
      const intervalId = setInterval(() => {
        playAudio(currentQuestion.katakana);
      }, settings.audioInterval * 1000);
      return () => clearInterval(intervalId);
    }
  }, [gameState, currentQuestion, isAnimating, showCorrection, settings.audioMode, settings.audioInterval, playAudio]);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setGameState('playing');
    setShowCorrection(false);
    generateNextQuestion(selectedMode, srsData, settings);
  };

  const handleAnswerClick = (option) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedAnswer(option);

    const isCorrect = option.romaji === currentQuestion.romaji;
    if (!isCorrect) setShowCorrection(true);

    const today = getTodayKey();
    setDailyStats(prev => {
      const todayStats = prev[today] || { total: 0, correct: 0, wrong: 0, wrongChars: [] };
      const newWrongChars = [...(todayStats.wrongChars || [])];

      if (!isCorrect && !newWrongChars.includes(currentQuestion.romaji)) {
        newWrongChars.push(currentQuestion.romaji);
      }

      return {
        ...prev,
        [today]: {
          total: todayStats.total + 1,
          correct: todayStats.correct + (isCorrect ? 1 : 0),
          wrong: todayStats.wrong + (isCorrect ? 0 : 1),
          wrongChars: newWrongChars
        }
      };
    });

    const key = currentQuestion.romaji;
    const item = srsData[key] || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };

    let grade = isCorrect ? 4 : 0;
    let { rep, interval, ease, mistakes, corrects = 0 } = item;

    if (isCorrect) {
      if (rep === 0) interval = 1;
      else if (rep === 1) interval = 6;
      else interval = Math.round(interval * ease);
      rep += 1;
      corrects += 1;
    } else {
      rep = 0;
      interval = 1;
      mistakes += 1;
    }

    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    const updatedSrsData = { ...srsData, [key]: { rep, interval, ease, nextReview, mistakes, corrects } };
    setSrsData(updatedSrsData);

    if (isCorrect) {
      setTimeout(() => {
        setShowCorrection(false);
        generateNextQuestion(mode, updatedSrsData, settings);
      }, 1200);
    } else {
      // 只有當 errorDisplayTime 大於 0 時，才自動跳下一題；等於 0 則等待手動點擊
      if (settings.errorDisplayTime > 0) {
        const delay = settings.errorDisplayTime * 1000;
        setTimeout(() => {
          setShowCorrection(false);
          generateNextQuestion(mode, updatedSrsData, settings);
        }, delay);
      }
    }
  };

  const getButtonStyle = (option) => {
    if (!selectedAnswer) return "bg-white hover:bg-rose-50 text-slate-700 border-2 border-slate-200 hover:border-rose-300";
    const isCorrectOption = option.romaji === currentQuestion.romaji;
    const isSelectedOption = option.romaji === selectedAnswer.romaji;

    if (isCorrectOption) return "bg-green-100 text-green-800 border-2 border-green-500 scale-105 shadow-md";
    if (isSelectedOption && !isCorrectOption) return "bg-red-100 text-red-800 border-2 border-red-400 opacity-70";
    return "bg-white text-slate-400 border-2 border-slate-100 opacity-50";
  };

  const KanaCell = ({ romajiKey }) => {
    if (!romajiKey) return <div className="p-1"></div>;
    const kana = kanaData.find(k => k.romaji === romajiKey);
    if (!kana) return <div className="p-1"></div>;

    const stats = srsData[romajiKey] || { mistakes: 0, corrects: 0 };
    const hasDisplay = tableDisplay.hiragana || tableDisplay.katakana || tableDisplay.romaji;

    return (
      <button
        onClick={() => playAudio(kana.katakana)}
        className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 shadow-sm transition-all active:scale-95 min-h-[4rem] relative overflow-hidden group"
        title="播放發音"
      >
        {tableDisplay.hiragana && <span className="text-xl font-bold text-slate-800 leading-tight">{kana.hiragana}</span>}
        {tableDisplay.katakana && <span className="text-xl font-bold text-slate-600 leading-tight">{kana.katakana}</span>}
        {tableDisplay.romaji && <span className="text-[0.65rem] text-slate-400 font-bold uppercase mt-1 tracking-wider">{kana.romaji}</span>}
        {!hasDisplay && !tableDisplay.stats && <Volume2 size={16} className="text-slate-300" />}

        {tableDisplay.stats && (
          <div className="flex gap-1 mt-2 w-full justify-center opacity-90 transition-opacity">
            <div className="flex items-center gap-0.5 bg-green-50 text-green-600 px-1 py-0.5 rounded text-[0.6rem] font-bold shadow-sm border border-green-100">
              <CheckCircle2 size={10} /> <span>{stats.corrects || 0}</span>
            </div>
            <div className="flex items-center gap-0.5 bg-red-50 text-red-500 px-1 py-0.5 rounded text-[0.6rem] font-bold shadow-sm border border-red-100">
              <XCircle size={10} /> <span>{stats.mistakes || 0}</span>
            </div>
          </div>
        )}
      </button>
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay(); // 0 is Sunday
    const days = [];
    const todayStr = getTodayKey();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="p-1"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const stats = dailyStats[dateStr];
      const hasData = stats && stats.total > 0;
      const isSelected = selDateStr === dateStr;
      const isToday = todayStr === dateStr;

      days.push(
        <button
          key={`day-${i}`}
          onClick={() => setSelDateStr(dateStr)}
          className={`relative p-1 rounded-xl text-sm font-bold flex flex-col items-center justify-start transition-all min-h-[4rem] pt-1.5
            ${isSelected ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'hover:bg-slate-100 text-slate-700'}
            ${isToday && !isSelected ? 'border-2 border-rose-400 text-rose-600' : 'border-2 border-transparent'}
          `}
        >
          <span className="leading-none mb-1">{i}</span>

          {hasData && (
            <div className="flex flex-col w-full gap-[3px] px-0.5 mt-auto mb-0.5">
              <div className={`text-[0.55rem] w-full text-center rounded py-[1.5px] leading-none font-bold ${isSelected ? 'bg-rose-600/50 text-rose-100' : 'bg-slate-200/60 text-slate-500'}`} title="總題數">
                {stats.total}
              </div>
              <div className={`text-[0.55rem] w-full text-center rounded py-[1.5px] leading-none font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100/60 text-red-500'}`} title="答錯數">
                {stats.wrong}
              </div>
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const getReviewText = (nextReview) => {
    if (!nextReview) return <DT tKey="nl" className="items-end leading-tight" />;
    const diffHours = (nextReview - Date.now()) / (1000 * 60 * 60);
    if (diffHours <= 0) return <DT tKey="tr" className="items-end leading-tight" />;
    if (diffHours < 24) return (
      <div className="flex flex-col items-end leading-tight">
        <span>{t('ab')} {Math.ceil(diffHours)} {t('hl')}</span>
        {settings.showJpSubtext && settings.uiLang !== 'ja' && <span className="text-[0.6rem] font-normal opacity-70">{t('ab', 'ja')} {Math.ceil(diffHours)} {t('hl', 'ja')}</span>}
      </div>
    );
    return (
      <div className="flex flex-col items-end leading-tight">
        <span>{t('ab')} {Math.ceil(diffHours / 24)} {t('dl')}</span>
        {settings.showJpSubtext && settings.uiLang !== 'ja' && <span className="text-[0.6rem] font-normal opacity-70">{t('ab', 'ja')} {Math.ceil(diffHours / 24)} {t('dl', 'ja')}</span>}
      </div>
    );
  };

  const getSortedStats = () => {
    return kanaData.filter(k => k.romaji !== 'xtsu').map(kana => {
      const data = srsData[kana.romaji] || { mistakes: 0, corrects: 0, nextReview: 0, rep: 0 };
      return { ...kana, ...data };
    }).sort((a, b) => b.mistakes - a.mistakes || a.nextReview - b.nextReview);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-2 sm:p-4 font-sans selection:bg-rose-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col relative max-h-[95vh]">

        {/* --- 乾淨無疊影的 Header --- */}
        <div className="bg-rose-500 pt-6 pb-5 px-5 text-white text-center relative flex-shrink-0 z-10">
          {gameState !== 'menu' && (
            <button
              onClick={() => {
                if (['settings', 'langPicker', 'table', 'calendar'].includes(gameState)) setGameState(prevGameState);
                else setGameState('menu');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-600 bg-rose-600/30 rounded-full transition-colors"
            >
              {gameState === 'playing' ? <Home size={22} /> : <ArrowLeft size={22} />}
            </button>
          )}

          {gameState === 'playing' && (
            <button
              onClick={() => { setPrevGameState('playing'); setGameState('settings'); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-600 bg-rose-600/30 rounded-full transition-colors"
            >
              <Settings size={22} />
            </button>
          )}

          <h1 className="font-black tracking-wider flex flex-col items-center">
            <DT tKey={
              gameState === 'stats' ? 'stTitle' :
                gameState === 'settings' ? 'setTitle' :
                  gameState === 'langPicker' ? 'langBtn' :
                    gameState === 'table' ? 'tbTitle' :
                      gameState === 'calendar' ? 'calTitle' : 'title'
            } spanClass="text-2xl leading-none" jpClassName="text-[0.65rem] uppercase tracking-widest mt-1 opacity-90 font-medium" />
          </h1>

          {['stats', 'settings', 'langPicker', 'calendar'].includes(gameState) && (
            <div className="text-rose-100 flex flex-col items-center mt-2 opacity-90">
              <DT tKey={
                gameState === 'stats' ? 'stSub' :
                  gameState === 'settings' ? 'setSub' :
                    gameState === 'calendar' ? 'calSub' : 'sjD'
              } spanClass="text-xs font-medium leading-none" jpClassName="mt-1 text-[0.65rem]" />
            </div>
          )}

          {gameState === 'menu' && (
            <div className="text-rose-100 flex flex-col items-center mt-2 opacity-90">
              <DT tKey="sub" spanClass="text-xs font-medium leading-none" jpClassName="mt-1 text-[0.65rem]" />
            </div>
          )}
        </div>

        {/* Content Area (Scrollable) */}
        <div className="p-4 sm:p-5 flex-grow flex flex-col overflow-y-auto bg-slate-50 relative">

          {/* --- 主選單：快速功能列 (Action Bar) --- */}
          {gameState === 'menu' && (
            <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
              <button onClick={() => { setPrevGameState('menu'); setGameState('settings'); }} className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex-1 min-w-[60px]">
                <Settings size={20} className="mb-1.5" />
                <DT tKey="setBtn" flexCol={true} spanClass="text-[0.6rem] font-bold leading-none" jpClassName="text-[0.5rem] mt-0.5" />
              </button>
              <button onClick={() => { setPrevGameState('menu'); setGameState('langPicker'); }} className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex-1 min-w-[60px]">
                <Globe size={20} className="mb-1.5" />
                <DT tKey="langBtn" flexCol={true} spanClass="text-[0.6rem] font-bold leading-none" jpClassName="text-[0.5rem] mt-0.5" />
              </button>
              <button onClick={() => { setPrevGameState('menu'); setGameState('calendar'); }} className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex-1 min-w-[60px]">
                <CalendarDays size={20} className="mb-1.5" />
                <DT tKey="calBtn" flexCol={true} spanClass="text-[0.6rem] font-bold leading-none" jpClassName="text-[0.5rem] mt-0.5" />
              </button>
              <button onClick={() => { setPrevGameState('menu'); setGameState('table'); }} className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex-1 min-w-[60px]">
                <LayoutGrid size={20} className="mb-1.5" />
                <DT tKey="tbBtn" flexCol={true} spanClass="text-[0.6rem] font-bold leading-none" jpClassName="text-[0.5rem] mt-0.5" />
              </button>
              <button onClick={() => setGameState('stats')} className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex-1 min-w-[60px]">
                <BarChart3 size={20} className="mb-1.5" />
                <DT tKey="stBtn" flexCol={true} spanClass="text-[0.6rem] font-bold leading-none" jpClassName="text-[0.5rem] mt-0.5" />
              </button>
            </div>
          )}

          {/* --- 學習日曆 Modal --- */}
          {gameState === 'calendar' && (
            <div className="flex flex-col flex-grow">

              {/* 日曆頂部控制區 */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div className="font-bold text-slate-700 text-lg">
                  {calMonth.getFullYear()} - {String(calMonth.getMonth() + 1).padStart(2, '0')}
                </div>
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* 日曆網格 */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                  <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarDays()}
                </div>
              </div>

              {/* 選定日期之統計數據 */}
              {selDateStr && dailyStats[selDateStr] && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-rose-100 relative overflow-hidden animate-in slide-in-from-bottom-4 flex flex-col">
                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-400"></div>
                  <h3 className="font-bold text-slate-700 mb-4 text-lg flex items-center gap-2">
                    <CalendarDays size={20} className="text-rose-500" />
                    {selDateStr}
                  </h3>

                  <div className="flex justify-between items-center gap-3">
                    <div className="flex flex-col items-center bg-slate-50 py-3 rounded-2xl flex-1 border border-slate-100 shadow-sm">
                      <DT tKey="tot" spanClass="text-xs text-slate-500 font-bold mb-1" jpClassName="text-[0.6rem] text-slate-400" />
                      <span className="text-3xl font-black text-slate-700 leading-none">{dailyStats[selDateStr]?.total || 0}</span>
                    </div>
                    <div className="flex flex-col items-center bg-green-50 py-3 rounded-2xl flex-1 border border-green-100 shadow-sm">
                      <DT tKey="corCount" spanClass="text-xs text-green-600 font-bold mb-1" jpClassName="text-[0.6rem] text-green-500" />
                      <span className="text-3xl font-black text-green-600 leading-none">{dailyStats[selDateStr]?.correct || 0}</span>
                    </div>
                    <div className="flex flex-col items-center bg-red-50 py-3 rounded-2xl flex-1 border border-red-100 shadow-sm">
                      <DT tKey="wrgCount" spanClass="text-xs text-red-500 font-bold mb-1" jpClassName="text-[0.6rem] text-red-400" />
                      <span className="text-3xl font-black text-red-500 leading-none">{dailyStats[selDateStr]?.wrong || 0}</span>
                    </div>
                  </div>

                  {/* 顯示當日錯誤的字元 */}
                  {dailyStats[selDateStr].wrongChars && dailyStats[selDateStr].wrongChars.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-rose-100">
                      <div className="flex items-center gap-1.5 mb-3">
                        <XCircle size={16} className="text-rose-500" />
                        <DT tKey="todayMistakes" spanClass="text-sm font-bold text-slate-700" jpClassName="text-[0.65rem] text-slate-400 ml-2 inline-block" flexCol={false} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dailyStats[selDateStr].wrongChars.map(romaji => {
                          const kana = kanaData.find(k => k.romaji === romaji);
                          if (!kana) return null;
                          return (
                            <button
                              key={romaji}
                              onClick={() => playAudio(kana.katakana)}
                              className="flex items-center bg-white border border-red-200 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm active:scale-95 group"
                              title="點擊聽發音"
                            >
                              <span className="text-[1.1rem] font-bold text-slate-700 leading-none">{kana.hiragana}</span>
                              <span className="text-slate-300 mx-1.5 text-xs font-light">/</span>
                              <span className="text-[1.1rem] font-bold text-slate-600 leading-none">{kana.katakana}</span>
                              <Volume2 size={14} className="text-red-300 ml-2 group-hover:text-red-500 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 五十音總表 Modal */}
          {gameState === 'table' && (
            <div className="flex flex-col flex-grow">
              {/* 顯示切換器 */}
              <div className="flex flex-wrap justify-center gap-2 mb-6 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                <button
                  onClick={() => setTableDisplay(prev => ({ ...prev, hiragana: !prev.hiragana }))}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all flex flex-col items-center ${tableDisplay.hiragana ? 'bg-rose-100 text-rose-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <DT tKey="tbHira" flexCol={false} spanClass="leading-tight" />
                </button>
                <button
                  onClick={() => setTableDisplay(prev => ({ ...prev, katakana: !prev.katakana }))}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all flex flex-col items-center ${tableDisplay.katakana ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <DT tKey="tbKata" flexCol={false} spanClass="leading-tight" />
                </button>
                <button
                  onClick={() => setTableDisplay(prev => ({ ...prev, romaji: !prev.romaji }))}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all flex flex-col items-center ${tableDisplay.romaji ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <DT tKey="tbRoma" flexCol={false} spanClass="leading-tight" />
                </button>
                <button
                  onClick={() => setTableDisplay(prev => ({ ...prev, stats: !prev.stats }))}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all flex flex-col items-center ${tableDisplay.stats ? 'bg-emerald-100 text-emerald-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <DT tKey="tbStats" flexCol={false} spanClass="leading-tight" />
                </button>
              </div>

              {/* 清音區塊 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pl-1">
                  <div className="h-4 w-1 bg-rose-400 rounded-full"></div>
                  <DT tKey="grpBasic" spanClass="font-bold text-slate-700" jpClassName="text-[0.6rem] text-slate-400" flexCol={false} />
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {tableLayout.seion.map((row, rIdx) =>
                    row.map((col, cIdx) => <KanaCell key={`seion-${rIdx}-${cIdx}`} romajiKey={col} />)
                  )}
                </div>
              </div>

              {/* 濁音・半濁音區塊 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pl-1">
                  <div className="h-4 w-1 bg-indigo-400 rounded-full"></div>
                  <DT tKey="grpDaku" spanClass="font-bold text-slate-700" jpClassName="text-[0.6rem] text-slate-400" flexCol={false} />
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {tableLayout.dakuon.map((row, rIdx) =>
                    row.map((col, cIdx) => <KanaCell key={`daku-${rIdx}-${cIdx}`} romajiKey={col} />)
                  )}
                </div>
              </div>

              {/* 拗音區塊 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pl-1">
                  <div className="h-4 w-1 bg-amber-400 rounded-full"></div>
                  <DT tKey="grpYoon" spanClass="font-bold text-slate-700" jpClassName="text-[0.6rem] text-slate-400" flexCol={false} />
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[80%]">
                  {tableLayout.yoon.map((row, rIdx) =>
                    row.map((col, cIdx) => <KanaCell key={`yoon-${rIdx}-${cIdx}`} romajiKey={col} />)
                  )}
                </div>
              </div>

              {/* 促音區塊 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 pl-1">
                  <div className="h-4 w-1 bg-emerald-400 rounded-full"></div>
                  <DT tKey="grpSoku" spanClass="font-bold text-slate-700" jpClassName="text-[0.6rem] text-slate-400" flexCol={false} />
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  <KanaCell romajiKey="xtsu" />
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 mt-4 pb-4 font-medium flex items-center justify-center gap-1">
                <Volume2 size={12} /> 點擊方塊即可播放發音
              </div>
            </div>
          )}

          {/* 語言選擇器 Modal */}
          {gameState === 'langPicker' && (
            <div className="flex flex-col flex-grow">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {Object.entries(i18n).map(([code, dict]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setSettings({ ...settings, uiLang: code });
                      setGameState(prevGameState);
                    }}
                    className={`p-3 rounded-xl border-2 font-medium transition-all ${settings.uiLang === code
                        ? 'bg-rose-100 border-rose-400 text-rose-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                      }`}
                  >
                    {dict.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'menu' && (
            <div className="flex flex-col flex-grow">
              {/* 「行」範圍選擇區塊 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <DT tKey="s1" className="items-start" spanClass="font-bold text-slate-700 text-lg leading-tight" jpClassName="text-[0.65rem] text-slate-400 mt-0.5" />
                  <div className="flex bg-slate-200/60 p-1 rounded-lg">
                    <button onClick={() => setSelectedRows(rowDefs.map(r => r.id))} className={`px-2.5 py-1.5 rounded text-[0.65rem] font-bold transition-all ${selectedRows.length === rowDefs.length ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-rose-500'}`}>
                      <DT tKey="selAll" flexCol={false} jpClassName="ml-1 opacity-70 font-normal" />
                    </button>
                    <button onClick={() => setSelectedRows([])} className={`px-2.5 py-1.5 rounded text-[0.65rem] font-bold transition-all ${selectedRows.length === 0 ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}>
                      <DT tKey="deselAll" flexCol={false} jpClassName="ml-1 opacity-70 font-normal" />
                    </button>
                  </div>
                </div>

                {/* 顯示分組的行選項 */}
                {rowGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className={`w-1.5 h-3.5 rounded-full ${gIdx === 0 ? 'bg-rose-400' : 'bg-indigo-400'}`}></div>
                      <DT tKey={group.tKey} flexCol={false} spanClass="text-xs font-bold text-slate-500" jpClassName="text-[0.65rem] text-slate-400 ml-1.5 font-normal" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map(row => (
                        <button
                          key={row.id}
                          onClick={() => {
                            if (selectedRows.includes(row.id)) setSelectedRows(selectedRows.filter(id => id !== row.id));
                            else setSelectedRows([...selectedRows, row.id]);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedRows.includes(row.id) ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500'}`}
                        >
                          {row.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 「段」範圍選擇區塊 */}
              <div className="mb-6 pt-5 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <DT tKey="s2" className="items-start" spanClass="font-bold text-slate-700 text-lg leading-tight" jpClassName="text-[0.65rem] text-slate-400 mt-0.5" />
                  <div className="flex bg-slate-200/60 p-1 rounded-lg">
                    <button onClick={() => setSelectedCols(colDefs.map(c => c.id))} className={`px-2.5 py-1.5 rounded text-[0.65rem] font-bold transition-all ${selectedCols.length === colDefs.length ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-rose-500'}`}>
                      <DT tKey="selAll" flexCol={false} jpClassName="ml-1 opacity-70 font-normal" />
                    </button>
                    <button onClick={() => setSelectedCols([])} className={`px-2.5 py-1.5 rounded text-[0.65rem] font-bold transition-all ${selectedCols.length === 0 ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}>
                      <DT tKey="deselAll" flexCol={false} jpClassName="ml-1 opacity-70 font-normal" />
                    </button>
                  </div>
                </div>

                {/* 顯示段選項 */}
                {colGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className={`w-1.5 h-3.5 rounded-full ${gIdx === 0 ? 'bg-indigo-400' : 'bg-amber-400'}`}></div>
                      <DT tKey={group.tKey} flexCol={false} spanClass="text-xs font-bold text-slate-500" jpClassName="text-[0.65rem] text-slate-400 ml-1.5 font-normal" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map(col => (
                        <button
                          key={col.id}
                          onClick={() => {
                            if (selectedCols.includes(col.id)) setSelectedCols(selectedCols.filter(id => id !== col.id));
                            else setSelectedCols([...selectedCols, col.id]);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCols.includes(col.id) ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-500'}`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 模式選擇區塊 */}
              <div className="mt-auto">
                <div className="bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl mb-5 flex flex-col items-center text-center leading-relaxed shadow-sm">
                  <span className="text-amber-800 text-xs font-bold flex items-center gap-1"><Zap size={14} className="text-amber-500" /> {t('algoT')}</span>
                  <DT tKey="algoD" spanClass="text-[0.65rem] text-amber-700/80 mt-1" jpClassName="text-[0.6rem] text-amber-600/70 mt-0.5" flexCol={true} />
                </div>

                <div className="flex flex-col mb-3">
                  <DT tKey="s3" className="items-start" spanClass="font-bold text-slate-700 leading-tight" jpClassName="text-slate-400 mt-1" />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => startGame('hira-to-kata')}
                    disabled={selectedRows.length === 0 && selectedCols.length === 0}
                    className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all group ${selectedRows.length === 0 && selectedCols.length === 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-md'}`}
                  >
                    <DT tKey="mH2K" className="items-start text-left" spanClass={`text-xl font-bold leading-tight ${selectedRows.length === 0 && selectedCols.length === 0 ? 'text-slate-500' : 'text-slate-800 group-hover:text-rose-600'}`} jpClassName="text-[0.7rem] text-slate-400 mt-1" />
                    <Play className={selectedRows.length === 0 && selectedCols.length === 0 ? 'text-slate-300' : 'text-slate-300 group-hover:text-rose-500'} />
                  </button>
                  <button
                    onClick={() => startGame('kata-to-hira')}
                    disabled={selectedRows.length === 0 && selectedCols.length === 0}
                    className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all group ${selectedRows.length === 0 && selectedCols.length === 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-md'}`}
                  >
                    <DT tKey="mK2H" className="items-start text-left" spanClass={`text-xl font-bold leading-tight ${selectedRows.length === 0 && selectedCols.length === 0 ? 'text-slate-500' : 'text-slate-800 group-hover:text-rose-600'}`} jpClassName="text-[0.7rem] text-slate-400 mt-1" />
                    <Play className={selectedRows.length === 0 && selectedCols.length === 0 ? 'text-slate-300' : 'text-slate-300 group-hover:text-rose-500'} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'settings' && (
            <div className="flex flex-col flex-grow space-y-6">

              {/* 1. 錯誤提示停留秒數 (移至最上方) */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col mr-4">
                    <DT tKey="ed" spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
                    <div className="text-xs text-slate-500 mt-1">
                      <DT tKey="edD" spanClass="" jpClassName="mt-0.5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-rose-500 leading-tight">
                      {settings.errorDisplayTime === 0 ? t('manual') : `${settings.errorDisplayTime} s`}
                    </span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="10" step="1"
                  value={settings.errorDisplayTime}
                  onChange={(e) => setSettings({ ...settings, errorDisplayTime: parseInt(e.target.value) })}
                  className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <div className="flex flex-col items-center"><span>{t('manual')}</span></div>
                  <div className="flex flex-col items-center"><span>10 s</span></div>
                </div>
              </div>

              {/* 發音人聲選擇區塊 (若系統有提供日文語音才會顯示) */}
              {availableVoices.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col space-y-4">
                  <div className="flex flex-col">
                    <DT tKey="voice" spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
                    <div className="text-xs text-slate-500">
                      <DT tKey="voiceD" flexCol={false} jpClassName="block mt-0.5 opacity-70 text-[0.65rem]" />
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={settings.selectedVoiceURI || ''}
                      onChange={(e) => setSettings({ ...settings, selectedVoiceURI: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-rose-400 appearance-none"
                    >
                      <option value="">-- {t('defVoice')} --</option>
                      {availableVoices.map((voice, idx) => (
                        <option key={idx} value={voice.voiceURI}>
                          {voice.name} {voice.localService ? '' : '(線上/Online)'}
                        </option>
                      ))}
                    </select>
                    {/* 下拉箭頭裝飾 */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
              )}

              {/* 發音模式設定區塊 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col space-y-4">
                <div className="flex flex-col">
                  <DT tKey="am" spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
                  <div className="text-xs text-slate-500"><DT tKey="amD" flexCol={false} jpClassName="block mt-0.5 opacity-70 text-[0.65rem]" /></div>
                </div>
                <div className="flex flex-col space-y-2">
                  {[
                    { id: 'auto', labelKey: 'amA' },
                    { id: 'manual', labelKey: 'amM' },
                    { id: 'repeat', labelKey: 'amR' }
                  ].map(m => (
                    <label key={m.id} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${settings.audioMode === m.id ? 'border-rose-400 bg-rose-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <input
                        type="radio" name="audioMode" value={m.id}
                        checked={settings.audioMode === m.id}
                        onChange={() => setSettings({ ...settings, audioMode: m.id })}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${settings.audioMode === m.id ? 'border-rose-500' : 'border-slate-300'}`}>
                        {settings.audioMode === m.id && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />}
                      </div>
                      <DT tKey={m.labelKey} className="items-start" spanClass={`font-medium text-sm leading-tight ${settings.audioMode === m.id ? 'text-rose-700' : 'text-slate-600'}`} jpClassName={settings.audioMode === m.id ? 'text-rose-500/80' : 'text-slate-400'} />
                    </label>
                  ))}
                </div>

                {settings.audioMode === 'repeat' && (
                  <div className="mt-2 pt-4 border-t-2 border-slate-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <DT tKey="ai" className="items-start" spanClass="font-bold text-slate-700 text-sm leading-tight" jpClassName="text-slate-400" />
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-rose-500 leading-tight">{settings.audioInterval} s</span>
                      </div>
                    </div>
                    <input
                      type="range" min="1" max="10" step="1"
                      value={settings.audioInterval}
                      onChange={(e) => setSettings({ ...settings, audioInterval: parseInt(e.target.value) })}
                      className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                      <span>1 s</span>
                      <span>10 s</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 顯示羅馬拼音 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex flex-col mr-4">
                  <DT tKey="sr" spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
                  <div className="text-xs text-slate-500 mt-1">
                    <DT tKey="srD" spanClass="" jpClassName="mt-0.5" />
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showRomaji: !settings.showRomaji })}
                  className={`w-14 h-7 rounded-full relative transition-colors flex-shrink-0 ${settings.showRomaji ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-[4px] transition-all ${settings.showRomaji ? 'left-[32px]' : 'left-[4px]'}`} />
                </button>
              </div>

              {/* 顯示日文翻譯 (預設關閉，移至羅馬拼音下方) */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex flex-col mr-4">
                  <DT tKey="sj" spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
                  <div className="text-xs text-slate-500 mt-1">
                    <DT tKey="sjD" spanClass="" jpClassName="mt-0.5" />
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showJpSubtext: !settings.showJpSubtext })}
                  className={`w-14 h-7 rounded-full relative transition-colors flex-shrink-0 ${settings.showJpSubtext ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-[4px] transition-all ${settings.showJpSubtext ? 'left-[32px]' : 'left-[4px]'}`} />
                </button>
              </div>

            </div>
          )}

          {gameState === 'playing' && currentQuestion && (
            <div className="flex flex-col h-full">
              {/* Score & Progress -> 今日統計資料 */}
              <div className="flex justify-between items-center mb-4 flex-shrink-0 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                <span className="px-2 flex flex-col items-start border-r-2 border-slate-100 pr-4">
                  <DT tKey="mode" flexCol={false} spanClass="text-[0.65rem] text-slate-400 font-bold mb-0.5" jpClassName="hidden" />
                  <span className="text-sm font-bold text-slate-700 leading-none">{mode === 'hira-to-kata' ? '平 → 片' : '片 → 平'}</span>
                </span>

                <div className="flex gap-4 px-2">
                  <div className="flex flex-col items-center">
                    <DT tKey="tot" flexCol={false} spanClass="text-[0.65rem] text-slate-400 font-bold mb-0.5" jpClassName="hidden" />
                    <span className="text-sm font-bold text-slate-700 leading-none">{dailyStats[getTodayKey()]?.total || 0}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <DT tKey="corCount" flexCol={false} spanClass="text-[0.65rem] text-green-500/80 font-bold mb-0.5" jpClassName="hidden" />
                    <span className="text-sm font-bold text-green-600 leading-none">{dailyStats[getTodayKey()]?.correct || 0}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <DT tKey="wrgCount" flexCol={false} spanClass="text-[0.65rem] text-red-400 font-bold mb-0.5" jpClassName="hidden" />
                    <span className="text-sm font-bold text-red-500 leading-none">{dailyStats[getTodayKey()]?.wrong || 0}</span>
                  </div>
                </div>
              </div>

              {/* Question Area */}
              <div className="flex flex-col items-center justify-center flex-grow mb-4 relative min-h-[140px]">
                {selectedAnswer && !showCorrection && (
                  <div className={`absolute top-0 flex items-center gap-2 font-bold animate-bounce ${selectedAnswer.romaji === currentQuestion.romaji ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedAnswer.romaji === currentQuestion.romaji ? (
                      <><CheckCircle2 size={28} /> <DT tKey="cor" className="items-start" spanClass="leading-tight" jpClassName="opacity-80" /></>
                    ) : (
                      <><XCircle size={28} /> <DT tKey="wrg" className="items-start" spanClass="leading-tight" jpClassName="opacity-80" /></>
                    )}
                  </div>
                )}

                <div className="text-[5.5rem] font-bold text-slate-800 leading-none mt-2 mb-2">
                  {mode === 'hira-to-kata' ? currentQuestion.hiragana : currentQuestion.katakana}
                </div>
                {settings.showRomaji && (
                  <div className="text-xl font-bold text-slate-400 mb-2 uppercase tracking-widest">
                    {currentQuestion.romaji}
                  </div>
                )}
                <button
                  onClick={() => playAudio(currentQuestion.katakana)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors active:scale-95 shadow-sm mt-2"
                >
                  <Volume2 size={20} />
                  <DT tKey="pa" className="items-start" spanClass="font-semibold leading-tight text-sm" jpClassName="opacity-70" />
                </button>
              </div>

              {/* Correction Banner (答錯時顯示) */}
              {showCorrection && (
                <button
                  onClick={() => {
                    // 若為手動模式，點擊 Banner 即可進入下一題
                    if (settings.errorDisplayTime === 0) {
                      setShowCorrection(false);
                      generateNextQuestion(mode, srsData, settings);
                    }
                  }}
                  className={`w-full bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center mb-4 shadow-md transition-all duration-300 flex-shrink-0 z-10 relative overflow-hidden ${settings.errorDisplayTime === 0 ? 'cursor-pointer hover:bg-red-100 active:scale-[0.98]' : 'cursor-default'}`}
                >
                  <div className="text-red-600 font-bold mb-1 flex items-center gap-1 flex-col">
                    <span className="flex items-center gap-1"><XCircle size={18} /> {t('ca')}</span>
                    {settings.showJpSubtext && settings.uiLang !== 'ja' && <span className="text-[0.65rem] opacity-80">{t('ca', 'ja')}</span>}
                  </div>
                  <div className="text-5xl font-black text-red-700 mt-1">
                    {mode === 'hira-to-kata' ? currentQuestion.katakana : currentQuestion.hiragana}
                  </div>
                  {settings.showRomaji && (
                    <div className="text-lg text-red-500/80 font-bold mt-1 uppercase tracking-widest">{currentQuestion.romaji}</div>
                  )}
                </button>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-4 mt-auto flex-shrink-0 relative">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(option)}
                    disabled={isAnimating}
                    className={`text-4xl font-medium p-6 sm:p-8 rounded-2xl transition-all duration-300 ease-out active:scale-95 flex items-center justify-center tracking-widest ${getButtonStyle(option)}`}
                  >
                    {mode === 'hira-to-kata' ? option.katakana : option.hiragana}
                  </button>
                ))}

                {/* 手動模式的選項遮罩：覆蓋在選項上，點擊可進入下一題 */}
                {showCorrection && settings.errorDisplayTime === 0 && (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-white/30 backdrop-blur-[2px] rounded-2xl"
                    onClick={() => {
                      setShowCorrection(false);
                      generateNextQuestion(mode, srsData, settings);
                    }}
                  >
                    <div className="bg-rose-500 text-white px-5 py-3 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2">
                      <span className="text-sm">{t('tapCont')}</span>
                      {settings.showJpSubtext && settings.uiLang !== 'ja' && t('tapCont') !== t('tapCont', 'ja') && (
                        <span className="text-[0.6rem] opacity-90 font-normal">({t('tapCont', 'ja')})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'stats' && (
            <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-200">
                <DT tKey="ch" spanClass="font-bold text-slate-700 leading-tight" jpClassName="text-slate-400" />
                <div className="flex gap-6 text-sm font-bold text-slate-500">
                  <DT tKey="mk" className="w-16 items-center" spanClass="leading-tight" jpClassName="font-normal text-slate-400" />
                  <DT tKey="nr" className="w-24 items-end" spanClass="leading-tight" jpClassName="font-normal text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                {getSortedStats().map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-slate-800 w-8">{item.hiragana}</div>
                      <div className="text-xl text-slate-600 w-8">{item.katakana}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">{item.romaji}</div>
                    </div>

                    <div className="flex gap-6 items-center">
                      <div className={`w-16 text-center font-bold text-lg ${item.mistakes > 0 ? 'text-red-500 bg-red-50 py-1 rounded-lg' : 'text-slate-300'}`}>
                        {item.mistakes > 0 ? item.mistakes : '-'}
                      </div>
                      <div className={`w-24 text-right text-xs font-medium ${(!item.nextReview || item.nextReview <= Date.now()) ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                        {getReviewText(item.nextReview)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}