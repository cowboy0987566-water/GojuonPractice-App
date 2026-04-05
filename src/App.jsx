import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Play, CheckCircle2, XCircle, CalendarDays, ChevronLeft, ChevronRight, Zap, Globe } from 'lucide-react';

// 資料層
import { kanaData, tableLayout, rowDefs, rowGroups, colDefs, colGroups, getTodayKey, shuffleArray } from './data/kanaData';
import { i18n } from './data/i18n';

// 邏輯層
import { useSRS, useDailyStats } from './hooks/useSRS';

// 元件層
import { BottomNav } from './components/BottomNav';

export default function App() {
  // ─── 狀態管理 ───
  const [activeTab, setActiveTab] = useState('menu');   // 底部 Tab
  const [gameState, setGameState] = useState('idle');   // idle | playing | langPicker
  const [mode, setMode] = useState('hira-to-kata');

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [tableDisplay, setTableDisplay] = useState({ hiragana: true, katakana: true, romaji: true, stats: false });
  const [calMonth, setCalMonth] = useState(new Date());
  const [selDateStr, setSelDateStr] = useState(getTodayKey());

  const { srsData, setSrsData, updateSRS } = useSRS();
  const { dailyStats, updateDailyStats } = useDailyStats();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_settings_v1');
      const parsed = saved ? JSON.parse(saved) : {};
      return { showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '', ...parsed };
    } catch { return { showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '' }; }
  });

  useEffect(() => { localStorage.setItem('gojuon_settings_v1', JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setAvailableVoices(window.speechSynthesis.getVoices().filter(v => v.lang.includes('ja') || v.lang.includes('JP')));
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ─── 工具函數 ───
  const t = useCallback((key, langOverride = null) => {
    const lang = langOverride || settings.uiLang;
    const dict = i18n[lang] || i18n['zh-TW'];
    return dict.t[key] || i18n['zh-TW'].t[key] || key;
  }, [settings.uiLang]);

  // 雙語顯示元件（內嵌，避免 prop 傳遞複雜度）
  const DT = ({ tKey, spanClass = '', jpClassName = '', flexCol = true, className = '' }) => {
    const mainText = t(tKey);
    const jpText = t(tKey, 'ja');
    const showJp = settings.showJpSubtext && settings.uiLang !== 'ja' && mainText !== jpText;
    if (!flexCol) return (
      <><span className={spanClass}>{mainText}</span>{showJp && <span className={jpClassName}>{jpText}</span>}</>
    );
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={spanClass}>{mainText}</span>
        {showJp && <span className={`text-[0.65rem] opacity-70 mt-0.5 ${jpClassName}`}>{jpText}</span>}
      </div>
    );
  };

  const playAudio = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      if (settings.selectedVoiceURI && availableVoices.length > 0) {
        const voice = availableVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
        if (voice) utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, [settings.selectedVoiceURI, availableVoices]);

  // 重複播放 effect
  useEffect(() => {
    if (gameState === 'playing' && currentQuestion && !isAnimating && !showCorrection && settings.audioMode === 'repeat') {
      const id = setInterval(() => playAudio(currentQuestion.katakana), settings.audioInterval * 1000);
      return () => clearInterval(id);
    }
  }, [gameState, currentQuestion, isAnimating, showCorrection, settings.audioMode, settings.audioInterval, playAudio]);

  // ─── 出題邏輯 ───
  const generateNextQuestion = useCallback((currentMode, currentSrsData, currentSettings) => {
    const activeKana = kanaData.filter(kana => {
      if (kana.romaji === 'xtsu') return false;
      const rowMatch = rowDefs.find(r => r.chars.includes(kana.romaji));
      const colMatch = colDefs.find(c => c.chars.includes(kana.romaji));
      const inRow = rowMatch && selectedRows.includes(rowMatch.id);
      const inCol = colMatch && selectedCols.includes(colMatch.id);
      if (selectedRows.length > 0 && selectedCols.length > 0) return inRow && inCol;
      if (selectedRows.length > 0) return inRow;
      if (selectedCols.length > 0) return inCol && !tableLayout.dakuon.flat().includes(kana.romaji);
      return false;
    });

    const now = Date.now();
    const safeKana = kanaData.filter(k => k.romaji !== 'xtsu');
    const dueItems = activeKana.filter(k => !currentSrsData[k.romaji] || currentSrsData[k.romaji].nextReview <= now);
    const pool = dueItems.length > 0 ? dueItems : (activeKana.length > 0 ? activeKana : safeKana);
    const correctItem = pool[Math.floor(Math.random() * pool.length)];

    const getCategory = (r) => tableLayout.seion.flat().includes(r) ? 'seion' : tableLayout.dakuon.flat().includes(r) ? 'dakuon' : tableLayout.yoon.flat().includes(r) ? 'yoon' : 'all';
    const cat = getCategory(correctItem.romaji);
    const wrongPool = safeKana.filter(k => getCategory(k.romaji) === cat);
    let wrongItems = [];
    while (wrongItems.length < 3) {
      const cand = wrongPool[Math.floor(Math.random() * wrongPool.length)];
      if (cand.romaji !== correctItem.romaji && !wrongItems.find(w => w.romaji === cand.romaji)) wrongItems.push(cand);
    }

    setCurrentQuestion(correctItem);
    setOptions(shuffleArray([correctItem, ...wrongItems]));
    setSelectedAnswer(null);
    setIsAnimating(false);
    if (currentSettings.audioMode !== 'manual') playAudio(correctItem.katakana);
  }, [playAudio, selectedRows, selectedCols]);

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

    updateDailyStats(currentQuestion.romaji, isCorrect, getTodayKey());

    const key = currentQuestion.romaji;
    const item = srsData[key] || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };
    let grade = isCorrect ? 4 : 0;
    let { rep, interval, ease, mistakes, corrects = 0 } = item;
    if (isCorrect) {
      interval = rep === 0 ? 1 : rep === 1 ? 6 : Math.round(interval * ease);
      rep += 1; corrects += 1;
    } else { rep = 0; interval = 1; mistakes += 1; }
    ease = Math.max(1.3, ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    const updatedSrs = { ...srsData, [key]: { rep, interval, ease, nextReview, mistakes, corrects } };
    setSrsData(updatedSrs);

    if (isCorrect) {
      setTimeout(() => { setShowCorrection(false); generateNextQuestion(mode, updatedSrs, settings); }, 1200);
    } else if (settings.errorDisplayTime > 0) {
      setTimeout(() => { setShowCorrection(false); generateNextQuestion(mode, updatedSrs, settings); }, settings.errorDisplayTime * 1000);
    }
  };

  const getButtonStyle = (option) => {
    if (!selectedAnswer) return 'bg-white hover:bg-rose-50 text-slate-700 border-2 border-slate-200 hover:border-rose-300';
    if (option.romaji === currentQuestion.romaji) return 'bg-green-100 text-green-800 border-2 border-green-500 scale-105 shadow-md';
    if (option.romaji === selectedAnswer.romaji) return 'bg-red-100 text-red-800 border-2 border-red-400 opacity-70';
    return 'bg-white text-slate-400 border-2 border-slate-100 opacity-50';
  };

  // ─── 五十音表 KanaCell ───
  const KanaCell = ({ romajiKey }) => {
    if (!romajiKey) return <div className="p-1" />;
    const kana = kanaData.find(k => k.romaji === romajiKey);
    if (!kana) return <div className="p-1" />;
    const stats = srsData[romajiKey] || { mistakes: 0, corrects: 0 };
    return (
      <button onClick={() => playAudio(kana.katakana)} className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 shadow-sm transition-all active:scale-95 min-h-[4rem]">
        {tableDisplay.hiragana && <span className="text-xl font-bold text-slate-800 leading-tight">{kana.hiragana}</span>}
        {tableDisplay.katakana && <span className="text-xl font-bold text-slate-600 leading-tight">{kana.katakana}</span>}
        {tableDisplay.romaji && <span className="text-[0.65rem] text-slate-400 font-bold uppercase mt-1 tracking-wider">{kana.romaji}</span>}
        {tableDisplay.stats && (
          <div className="flex gap-1 mt-1 w-full justify-center">
            <div className="flex items-center gap-0.5 bg-green-50 text-green-600 px-1 py-0.5 rounded text-[0.6rem] font-bold border border-green-100"><CheckCircle2 size={10} /><span>{stats.corrects || 0}</span></div>
            <div className="flex items-center gap-0.5 bg-red-50 text-red-500 px-1 py-0.5 rounded text-[0.6rem] font-bold border border-red-100"><XCircle size={10} /><span>{stats.mistakes || 0}</span></div>
          </div>
        )}
      </button>
    );
  };

  // ─── 日曆 ───
  const renderCalendarDays = () => {
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
    const todayStr = getTodayKey();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(<div key={`e-${i}`} className="p-1" />);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const stats = dailyStats[dateStr];
      const hasData = stats && stats.total > 0;
      const isSelected = selDateStr === dateStr;
      const isToday = todayStr === dateStr;
      days.push(
        <button key={`d-${i}`} onClick={() => setSelDateStr(dateStr)}
          className={`relative p-1 rounded-xl text-sm font-bold flex flex-col items-center justify-start transition-all min-h-[4rem] pt-1.5
            ${isSelected ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}
            ${isToday && !isSelected ? 'border-2 border-rose-400 text-rose-600' : 'border-2 border-transparent'}`}>
          <span className="leading-none mb-1">{i}</span>
          {hasData && (
            <div className="flex flex-col w-full gap-[3px] px-0.5 mt-auto mb-0.5">
              <div className={`text-[0.55rem] w-full text-center rounded py-[1.5px] font-bold ${isSelected ? 'bg-rose-600/50 text-rose-100' : 'bg-slate-200/60 text-slate-500'}`}>{stats.total}</div>
              <div className={`text-[0.55rem] w-full text-center rounded py-[1.5px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100/60 text-red-500'}`}>{stats.wrong}</div>
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  // ─── 統計 ───
  const getReviewText = (nextReview) => {
    if (!nextReview) return t('nl');
    const h = (nextReview - Date.now()) / 3600000;
    if (h <= 0) return t('tr');
    if (h < 24) return `${t('ab')} ${Math.ceil(h)} ${t('hl')}`;
    return `${t('ab')} ${Math.ceil(h / 24)} ${t('dl')}`;
  };

  const getSortedStats = () =>
    kanaData.filter(k => k.romaji !== 'xtsu').map(kana => ({
      ...kana, ...(srsData[kana.romaji] || { mistakes: 0, corrects: 0, nextReview: 0, rep: 0 })
    })).sort((a, b) => b.mistakes - a.mistakes || a.nextReview - b.nextReview);

  // ─── 標題對照 ───
  const headerTitle = {
    menu: 'title', calendar: 'calTitle', table: 'tbTitle', stats: 'stTitle', settings: 'setTitle'
  };
  const headerSub = {
    calendar: 'calSub', table: null, stats: 'stSub', settings: 'setSub'
  };

  const isPlaying = gameState === 'playing';
  const isLangPicker = gameState === 'langPicker';

  return (
    <div className="h-[100dvh] h-screen bg-slate-100 flex items-center justify-center sm:p-4 font-sans selection:bg-rose-200">
      <div className="w-full h-full max-w-md bg-white sm:rounded-3xl shadow-xl flex flex-col overflow-hidden sm:max-h-[95vh]">

        {/* ── Header ── */}
        <div className="bg-rose-500 pt-5 pb-4 px-5 text-white text-center relative flex-shrink-0 z-10">
          {isPlaying && (
            <button onClick={() => setGameState('idle')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-rose-600/30 hover:bg-rose-600 rounded-full transition-colors">
              ✕
            </button>
          )}
          {isLangPicker && (
            <button onClick={() => setGameState('idle')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-rose-600/30 hover:bg-rose-600 rounded-full transition-colors">
              ←
            </button>
          )}

          <h1 className="font-black tracking-wider">
            <DT tKey={isPlaying ? 'title' : isLangPicker ? 'langBtn' : (headerTitle[activeTab] || 'title')}
              spanClass="text-xl leading-none" jpClassName="text-[0.6rem] uppercase tracking-widest opacity-90 mt-0.5 font-medium" />
          </h1>

          {!isPlaying && !isLangPicker && headerSub[activeTab] && (
            <div className="text-rose-100 flex flex-col items-center mt-1 opacity-90">
              <DT tKey={headerSub[activeTab]} spanClass="text-xs font-medium leading-none" jpClassName="mt-0.5 text-[0.6rem]" />
            </div>
          )}
          {!isPlaying && !isLangPicker && activeTab === 'menu' && (
            <div className="text-rose-100 flex flex-col items-center mt-1 opacity-90">
              <DT tKey="sub" spanClass="text-xs font-medium leading-none" jpClassName="mt-0.5 text-[0.6rem]" />
            </div>
          )}
        </div>

        {/* ── 內容區 ── */}
        <div className="p-4 sm:p-5 flex-grow flex flex-col overflow-y-auto bg-slate-50 min-h-0">

          {/* 🟠 答題畫面（覆蓋所有 tab） */}
          {isPlaying && currentQuestion && (
            <div className="flex flex-col h-full">
              {/* 今日統計 */}
              <div className="flex justify-between items-center mb-4 flex-shrink-0 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                <span className="px-2 border-r-2 border-slate-100 pr-4">
                  <DT tKey="mode" flexCol={false} spanClass="text-[0.65rem] text-slate-400 font-bold mb-0.5 block" />
                  <span className="text-sm font-bold text-slate-700 leading-none">{mode === 'hira-to-kata' ? '平→片' : '片→平'}</span>
                </span>
                <div className="flex gap-4 px-2">
                  {['tot', 'corCount', 'wrgCount'].map((key, i) => {
                    const val = dailyStats[getTodayKey()]?.[(i === 0 ? 'total' : i === 1 ? 'correct' : 'wrong')] || 0;
                    const colors = ['text-slate-700', 'text-green-600', 'text-red-500'];
                    return (
                      <div key={key} className="flex flex-col items-center">
                        <DT tKey={key} flexCol={false} spanClass={`text-[0.65rem] font-bold mb-0.5 ${i === 1 ? 'text-green-500/80' : i === 2 ? 'text-red-400' : 'text-slate-400'}`} />
                        <span className={`text-sm font-bold leading-none ${colors[i]}`}>{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 題目 */}
              <div className="flex flex-col items-center justify-center flex-grow mb-4 min-h-[140px] relative">
                {selectedAnswer && !showCorrection && (
                  <div className={`absolute top-0 flex items-center gap-2 font-bold ${selectedAnswer.romaji === currentQuestion.romaji ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedAnswer.romaji === currentQuestion.romaji
                      ? <><CheckCircle2 size={24} /> <DT tKey="cor" flexCol={false} spanClass="leading-tight" /></>
                      : <><XCircle size={24} /> <DT tKey="wrg" flexCol={false} spanClass="leading-tight" /></>
                    }
                  </div>
                )}
                <div className="text-[5.5rem] font-bold text-slate-800 leading-none mt-2 mb-2">
                  {mode === 'hira-to-kata' ? currentQuestion.hiragana : currentQuestion.katakana}
                </div>
                {settings.showRomaji && <div className="text-xl font-bold text-slate-400 mb-2 uppercase tracking-widest">{currentQuestion.romaji}</div>}
                <button onClick={() => playAudio(currentQuestion.katakana)} className="flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors active:scale-95 shadow-sm">
                  <Volume2 size={18} />
                  <DT tKey="pa" flexCol={false} spanClass="font-semibold text-sm" />
                </button>
              </div>

              {/* 答錯提示 */}
              {showCorrection && (
                <button onClick={() => { if (settings.errorDisplayTime === 0) { setShowCorrection(false); generateNextQuestion(mode, srsData, settings); } }}
                  className={`w-full bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex flex-col items-center mb-4 shadow-md flex-shrink-0 ${settings.errorDisplayTime === 0 ? 'cursor-pointer hover:bg-red-100' : 'cursor-default'}`}>
                  <div className="text-red-600 font-bold mb-1 flex items-center gap-1"><XCircle size={16} /> {t('ca')}</div>
                  <div className="text-5xl font-black text-red-700">{mode === 'hira-to-kata' ? currentQuestion.katakana : currentQuestion.hiragana}</div>
                  {settings.showRomaji && <div className="text-lg text-red-500/80 font-bold mt-1 uppercase tracking-widest">{currentQuestion.romaji}</div>}
                </button>
              )}

              {/* 選項 */}
              <div className="grid grid-cols-2 gap-4 mt-auto flex-shrink-0 relative">
                {options.map((opt, idx) => (
                  <button key={`${currentQuestion.romaji}-${opt.romaji}-${idx}`} onClick={() => handleAnswerClick(opt)} disabled={isAnimating}
                    className={`text-4xl font-medium p-6 rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center tracking-widest ${getButtonStyle(opt)}`}>
                    {mode === 'hira-to-kata' ? opt.katakana : opt.hiragana}
                  </button>
                ))}
                {showCorrection && settings.errorDisplayTime === 0 && (
                  <div onClick={() => { setShowCorrection(false); generateNextQuestion(mode, srsData, settings); }}
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-white/30 backdrop-blur-[2px] rounded-2xl">
                    <div className="bg-rose-500 text-white px-5 py-3 rounded-full font-bold shadow-lg animate-bounce text-sm">{t('tapCont')}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🌐 語言選擇（浮層） */}
          {isLangPicker && (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {Object.entries(i18n).map(([code, dict]) => (
                <button key={code} onClick={() => { setSettings({ ...settings, uiLang: code }); setGameState('idle'); }}
                  className={`p-3 rounded-xl border-2 font-medium transition-all ${settings.uiLang === code ? 'bg-rose-100 border-rose-400 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'}`}>
                  {dict.label}
                </button>
              ))}
            </div>
          )}

          {/* ─── Tab: 首頁（選擇練習範圍） ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'menu' && (
            <div className="flex flex-col flex-grow">
              {/* 行選擇 */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-3">
                  <DT tKey="s1" className="items-start" spanClass="font-bold text-slate-700 text-base leading-tight" />
                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                    <button onClick={() => setSelectedRows(rowDefs.map(r => r.id))} className="px-2 py-1 rounded text-xs font-bold text-slate-500 hover:text-rose-500 active:bg-white"><DT tKey="selAll" flexCol={false} /></button>
                    <button onClick={() => setSelectedRows([])} className="px-2 py-1 rounded text-xs font-bold text-slate-500 hover:text-slate-700 active:bg-white"><DT tKey="deselAll" flexCol={false} /></button>
                  </div>
                </div>
                {rowGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-1 h-3.5 rounded-full ${gIdx === 0 ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                      <DT tKey={group.tKey} flexCol={false} spanClass="text-xs font-bold text-slate-500" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map(row => (
                        <button key={row.id} onClick={() => setSelectedRows(p => p.includes(row.id) ? p.filter(id => id !== row.id) : [...p, row.id])}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedRows.includes(row.id) ? 'bg-rose-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-300'}`}>
                          {row.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 段選擇 */}
              <div className="mb-5 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <DT tKey="s2" className="items-start" spanClass="font-bold text-slate-700 text-base leading-tight" />
                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                    <button onClick={() => setSelectedCols(colDefs.map(c => c.id))} className="px-2 py-1 rounded text-xs font-bold text-slate-500 hover:text-rose-500 active:bg-white"><DT tKey="selAll" flexCol={false} /></button>
                    <button onClick={() => setSelectedCols([])} className="px-2 py-1 rounded text-xs font-bold text-slate-500 hover:text-slate-700 active:bg-white"><DT tKey="deselAll" flexCol={false} /></button>
                  </div>
                </div>
                {colGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-1 h-3.5 rounded-full ${gIdx === 0 ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                      <DT tKey={group.tKey} flexCol={false} spanClass="text-xs font-bold text-slate-500" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map(col => (
                        <button key={col.id} onClick={() => setSelectedCols(p => p.includes(col.id) ? p.filter(id => id !== col.id) : [...p, col.id])}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCols.includes(col.id) ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 提示 + 開始按鈕 */}
              <div className="mt-auto">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-center">
                  <span className="text-amber-800 text-xs font-bold flex items-center justify-center gap-1"><Zap size={13} className="text-amber-500" />{t('algoT')}</span>
                  <DT tKey="algoD" spanClass="text-[0.65rem] text-amber-700/80 mt-1 block" />
                </div>
                <div className="mb-3 text-sm font-bold text-slate-600"><DT tKey="s3" flexCol={false} spanClass="leading-tight" /></div>
                <div className="space-y-3">
                  {['hira-to-kata', 'kata-to-hira'].map(m => (
                    <button key={m} onClick={() => startGame(m)} disabled={selectedRows.length === 0 && selectedCols.length === 0}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all group ${selectedRows.length === 0 && selectedCols.length === 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-md'}`}>
                      <DT tKey={m === 'hira-to-kata' ? 'mH2K' : 'mK2H'} className="items-start" spanClass="text-xl font-bold leading-tight" jpClassName="text-[0.7rem] text-slate-400 mt-1" />
                      <Play className="text-slate-300 group-hover:text-rose-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab: 日曆 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'calendar' && (
            <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4">
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20} /></button>
                <span className="font-bold text-slate-700">{calMonth.getFullYear()} - {String(calMonth.getMonth() + 1).padStart(2, '0')}</span>
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20} /></button>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                  {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
              </div>
              {selDateStr && dailyStats[selDateStr] && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-rose-100 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-400" />
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-rose-500" />{selDateStr}</h3>
                  <div className="flex gap-3">
                    {[['tot', 'total', 'bg-slate-50 border-slate-100 text-slate-700'],['corCount','correct','bg-green-50 border-green-100 text-green-600'],['wrgCount','wrong','bg-red-50 border-red-100 text-red-500']].map(([tk, field, cls]) => (
                      <div key={tk} className={`flex flex-col items-center py-3 rounded-2xl flex-1 border ${cls}`}>
                        <DT tKey={tk} spanClass={`text-xs font-bold mb-1 ${cls.split(' ')[2]}`} />
                        <span className={`text-3xl font-black leading-none ${cls.split(' ')[2]}`}>{dailyStats[selDateStr][field] || 0}</span>
                      </div>
                    ))}
                  </div>
                  {dailyStats[selDateStr].wrongChars?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-rose-100">
                      <div className="flex items-center gap-1.5 mb-3"><XCircle size={16} className="text-rose-500" />
                        <DT tKey="todayMistakes" flexCol={false} spanClass="text-sm font-bold text-slate-700" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dailyStats[selDateStr].wrongChars.map(romaji => {
                          const kana = kanaData.find(k => k.romaji === romaji);
                          if (!kana) return null;
                          return (
                            <button key={romaji} onClick={() => playAudio(kana.katakana)}
                              className="flex items-center bg-white border border-red-200 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-red-50 shadow-sm active:scale-95">
                              <span className="text-[1.1rem] font-bold text-slate-700">{kana.hiragana}</span>
                              <span className="text-slate-300 mx-1.5 text-xs">/</span>
                              <span className="text-[1.1rem] font-bold text-slate-600">{kana.katakana}</span>
                              <Volume2 size={14} className="text-red-300 ml-2" />
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

          {/* ─── Tab: 五十音表 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'table' && (
            <div className="flex flex-col flex-grow">
              <div className="flex flex-wrap justify-center gap-2 mb-5 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                {[['hiragana','tbHira','bg-rose-100 text-rose-700'],['katakana','tbKata','bg-indigo-100 text-indigo-700'],['romaji','tbRoma','bg-amber-100 text-amber-700'],['stats','tbStats','bg-emerald-100 text-emerald-700']].map(([key, tk, activeCls]) => (
                  <button key={key} onClick={() => setTableDisplay(p => ({...p, [key]: !p[key]}))}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${tableDisplay[key] ? activeCls + ' shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}>
                    <DT tKey={tk} flexCol={false} spanClass="leading-tight" />
                  </button>
                ))}
              </div>
              {[['grpBasic', tableLayout.seion, 'bg-rose-400', 'grid-cols-5'],['grpDaku', tableLayout.dakuon, 'bg-indigo-400', 'grid-cols-5'],['grpYoon', tableLayout.yoon, 'bg-amber-400', 'grid-cols-3'],['grpSoku', tableLayout.sokuon, 'bg-emerald-400', 'grid-cols-5']].map(([tk, layout, color, cols]) => (
                <div key={tk} className="mb-5">
                  <div className="flex items-center gap-2 mb-3"><div className={`h-4 w-1 ${color} rounded-full`}></div><DT tKey={tk} flexCol={false} spanClass="font-bold text-slate-700" /></div>
                  <div className={`grid ${cols} gap-1.5 ${tk === 'grpYoon' ? 'max-w-[70%]' : ''}`}>
                    {layout.map((row, rIdx) => row.map((col, cIdx) => <KanaCell key={`${tk}-${rIdx}-${cIdx}`} romajiKey={col} />))}
                  </div>
                </div>
              ))}
              <div className="text-center text-xs text-slate-400 mt-2 pb-4 flex items-center justify-center gap-1"><Volume2 size={12} /> {t('pa')}</div>
            </div>
          )}

          {/* ─── Tab: 錯題本 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'stats' && (
            <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-200">
                <DT tKey="ch" spanClass="font-bold text-slate-700" />
                <div className="flex gap-6">
                  <DT tKey="mk" className="w-16 items-center" spanClass="font-bold text-slate-500 text-sm" />
                  <DT tKey="nr" className="w-24 items-end" spanClass="font-bold text-slate-500 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                {getSortedStats().map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-slate-800 w-8">{item.hiragana}</div>
                      <div className="text-xl text-slate-600 w-8">{item.katakana}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">{item.romaji}</div>
                    </div>
                    <div className="flex gap-6 items-center">
                      <div className={`w-16 text-center font-bold text-lg ${item.mistakes > 0 ? 'text-red-500 bg-red-50 py-1 rounded-lg' : 'text-slate-300'}`}>{item.mistakes > 0 ? item.mistakes : '-'}</div>
                      <div className={`w-24 text-right text-xs font-medium ${(!item.nextReview || item.nextReview <= Date.now()) ? 'text-green-600 font-bold' : 'text-slate-400'}`}>{getReviewText(item.nextReview)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Tab: 設定 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'settings' && (
            <div className="flex flex-col flex-grow space-y-5">
              {/* 語言選擇快捷 */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-rose-500" />
                  <DT tKey="langBtn" spanClass="font-bold text-slate-700" />
                </div>
                <button onClick={() => setGameState('langPicker')} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-200 transition-colors">
                  {i18n[settings.uiLang]?.label || 'Language'}
                </button>
              </div>

              {/* 錯誤停留時間 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div><DT tKey="ed" spanClass="font-bold text-slate-700 leading-tight" />
                    <DT tKey="edD" spanClass="text-xs text-slate-500 mt-1" /></div>
                  <span className="text-xl font-bold text-rose-500">{settings.errorDisplayTime === 0 ? t('manual') : `${settings.errorDisplayTime}s`}</span>
                </div>
                <input type="range" min="0" max="10" step="1" value={settings.errorDisplayTime}
                  onChange={e => setSettings({...settings, errorDisplayTime: parseInt(e.target.value)})}
                  className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>

              {/* 語音人聲 */}
              {availableVoices.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                  <DT tKey="voice" spanClass="font-bold text-slate-700 mb-3 block" />
                  <select value={settings.selectedVoiceURI || ''} onChange={e => setSettings({...settings, selectedVoiceURI: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-rose-400 appearance-none">
                    <option value="">-- {t('defVoice')} --</option>
                    {availableVoices.map((v, idx) => <option key={idx} value={v.voiceURI}>{v.name}</option>)}
                  </select>
                </div>
              )}

              {/* 發音模式 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                <DT tKey="am" spanClass="font-bold text-slate-700 mb-3 block" />
                <div className="flex flex-col space-y-2">
                  {[['auto','amA'],['manual','amM'],['repeat','amR']].map(([id, tk]) => (
                    <label key={id} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer ${settings.audioMode === id ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}>
                      <input type="radio" checked={settings.audioMode === id} onChange={() => setSettings({...settings, audioMode: id})} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${settings.audioMode === id ? 'border-rose-500' : 'border-slate-300'}`}>
                        {settings.audioMode === id && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />}
                      </div>
                      <DT tKey={tk} flexCol={false} spanClass={`font-medium text-sm ${settings.audioMode === id ? 'text-rose-700' : 'text-slate-600'}`} />
                    </label>
                  ))}
                </div>
              </div>

              {/* 羅馬拼音 / 日文翻譯 切換 */}
              {[['showRomaji','sr','srD'],['showJpSubtext','sj','sjD']].map(([field, tk, descTk]) => (
                <div key={field} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                  <div><DT tKey={tk} spanClass="font-bold text-slate-700 leading-tight" /><DT tKey={descTk} spanClass="text-xs text-slate-500 mt-1" /></div>
                  <button onClick={() => setSettings({...settings, [field]: !settings[field]})}
                    className={`w-14 h-7 rounded-full relative transition-colors flex-shrink-0 ${settings[field] ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-[4px] transition-all ${settings[field] ? 'left-[32px]' : 'left-[4px]'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── 底部導航列（答題中隱藏） ── */}
        {!isPlaying && !isLangPicker && (
          <BottomNav activeTab={activeTab} onTabChange={tab => { setActiveTab(tab); if (gameState !== 'idle') setGameState('idle'); }} t={t} uiLang={settings.uiLang} />
        )}

      </div>
    </div>
  );
}