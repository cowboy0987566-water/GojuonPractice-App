import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Play, CheckCircle2, XCircle, CalendarDays, ChevronLeft, ChevronRight, Zap, Globe, Eye, EyeOff, Edit2, KeyRound, Users, Settings2, X, Download, Share } from 'lucide-react';

// 資料層
import { kanaData, tableLayout, rowDefs, rowGroups, colDefs, colGroups, getTodayKey, shuffleArray } from './data/kanaData';
import { i18n } from './data/i18n';

// 邏輯層
import { useSRS, useDailyStats } from './hooks/useSRS';

// 元件層
import { BottomNav } from './components/BottomNav';
import { DT } from './components/DT';
import { GojuonTable } from './components/GojuonTable';
import { StatsView } from './components/StatsView';
import { LearningCalendar } from './components/LearningCalendar';
import { SettingsPanel } from './components/SettingsPanel';

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
  const [typingInput, setTypingInput] = useState('');

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [tableDisplay, setTableDisplay] = useState({ hiragana: true, katakana: true, romaji: true, stats: false });
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [selDateStr, setSelDateStr] = useState(getTodayKey());

  const { srsData, setSrsData, updateSRS } = useSRS();
  const { dailyStats, updateDailyStats } = useDailyStats();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_settings_v1');
      const parsed = saved ? JSON.parse(saved) : {};
      return { showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '', targetKana: 'hira', keepCustomOpen: false, ...parsed };
    } catch { return { showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '', targetKana: 'hira', keepCustomOpen: false }; }
  });

  const [isCustomOpen, setIsCustomOpen] = useState(settings.keepCustomOpen);
  const [activePreset, setActivePreset] = useState(null);

  // 監聽手動修改，若手動修改則取消預設選中狀態
  useEffect(() => {
    if (activePreset) {
      // 這裡簡單處理：只要進入這裡就代表狀態變了，但為了避免 applyPreset 觸發造成的循環，我們只在非 applyPreset 期間重置
    }
  }, [selectedRows, selectedCols]);

  const applyPreset = (presetId) => {
    setActivePreset(presetId);
    switch (presetId) {
      case 'basic':
        setSelectedRows(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa']);
        setSelectedCols(['col-a', 'col-i', 'col-u', 'col-e', 'col-o']);
        break;
      case 'dakuon':
        setSelectedRows(['dakuon']);
        setSelectedCols(['col-a', 'col-i', 'col-u', 'col-e', 'col-o']);
        break;
      case 'yoon':
        setSelectedRows(['yoon']);
        setSelectedCols(['col-ya', 'col-yu', 'col-yo']);
        break;
      case 'all':
        setSelectedRows(rowDefs.map(r => r.id));
        setSelectedCols(colDefs.map(c => c.id));
        break;
    }
    if (!settings.keepCustomOpen) setIsCustomOpen(false);
  };

  useEffect(() => { localStorage.setItem('gojuon_settings_v1', JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setAvailableVoices(window.speechSynthesis.getVoices().filter(v => v.lang.includes('ja') || v.lang.includes('JP')));
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadVoices;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const isIos = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  };

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

      // 如果兩者都有選，取交集
      if (selectedRows.length > 0 && selectedCols.length > 0) return inRow && inCol;
      // 如果只選行
      if (selectedRows.length > 0) return inRow;
      // 如果只選段
      if (selectedCols.length > 0) return inCol;
      
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
    setTypingInput('');
    generateNextQuestion(selectedMode, srsData, settings);
  };

  const processAnswer = (isCorrect, currentSrsData) => {
    updateDailyStats(currentQuestion.romaji, isCorrect, getTodayKey());

    const key = currentQuestion.romaji;
    const item = currentSrsData[key] || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };
    let grade = isCorrect ? 4 : 0;
    let { rep, interval, ease, mistakes, corrects = 0 } = item;
    if (isCorrect) {
      interval = rep === 0 ? 1 : rep === 1 ? 6 : Math.round(interval * ease);
      rep += 1; corrects += 1;
    } else { rep = 0; interval = 1; mistakes += 1; }
    ease = Math.max(1.3, ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    const updatedSrs = { ...currentSrsData, [key]: { rep, interval, ease, nextReview, mistakes, corrects } };
    setSrsData(updatedSrs);

    if (isCorrect) {
      setTimeout(() => { setShowCorrection(false); setTypingInput(''); generateNextQuestion(mode, updatedSrs, settings); }, 1200);
    } else if (settings.errorDisplayTime > 0) {
      setTimeout(() => { setShowCorrection(false); setTypingInput(''); generateNextQuestion(mode, updatedSrs, settings); }, settings.errorDisplayTime * 1000);
    }
  };

  const handleAnswerClick = (option) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedAnswer(option);
    const isCorrect = option.romaji === currentQuestion.romaji;
    if (!isCorrect) setShowCorrection(true);
    processAnswer(isCorrect, srsData);
  };

  const handleTypingSubmit = (e) => {
    if (e) e.preventDefault();
    if (isAnimating || !typingInput.trim()) return;
    setIsAnimating(true);
    const inputClean = typingInput.trim().toLowerCase();
    const isCorrect = (inputClean === currentQuestion.romaji);
    setSelectedAnswer({ romaji: inputClean });
    if (!isCorrect) setShowCorrection(true);
    processAnswer(isCorrect, srsData);
  };

  const getButtonStyle = (option) => {
    if (!selectedAnswer) return 'bg-white hover:bg-rose-50 text-slate-950 border-2 border-slate-200 hover:border-rose-300';
    if (option.romaji === currentQuestion.romaji) return 'bg-green-100 text-green-800 border-2 border-green-500 scale-105 shadow-md';
    if (option.romaji === selectedAnswer.romaji) return 'bg-red-100 text-red-800 border-2 border-red-400 opacity-70';
    return 'bg-white text-slate-600 border-2 border-slate-100 opacity-50';
  };

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
    <div className="h-[100dvh] bg-slate-100 flex items-center justify-center sm:p-4 font-sans selection:bg-rose-200 overflow-hidden">
      <div className="w-full h-full max-w-md bg-white sm:rounded-3xl shadow-xl flex flex-col overflow-hidden sm:max-h-[95vh] relative">

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
            <div className="flex flex-col h-full relative">
              {/* 今日統計 & 快速設定 */}
              <div className="flex justify-between items-center mb-4 flex-shrink-0 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center">
                  <span className="px-2 border-r-2 border-slate-100 pr-4">
                    <DT tKey="mode" flexCol={false} spanClass="text-[0.65rem] text-slate-600 font-bold mb-0.5 block" />
                    <span className="text-sm font-bold text-slate-950 leading-none">
                      {mode === 'recognition' ? (settings.targetKana === 'hira' ? '平→片' : '片→平') : 
                       mode === 'audio-to-kana' ? '聽音' : mode === 'romaji-to-kana' ? '羅→假片' : mode === 'kana-to-romaji' ? '假片→羅' : mode === 'typing' ? '拼寫' : mode}
                    </span>
                  </span>
                  <div className="flex gap-4 px-4">
                    {['tot', 'corCount', 'wrgCount'].map((key, i) => {
                      const val = dailyStats[getTodayKey()]?.[(i === 0 ? 'total' : i === 1 ? 'correct' : 'wrong')] || 0;
                      const colors = ['text-slate-950', 'text-green-600', 'text-red-500'];
                      return (
                        <div key={key} className="flex flex-col items-center">
                          <DT tKey={key} flexCol={false} spanClass={`text-[0.65rem] font-bold mb-0.5 ${i === 1 ? 'text-green-500/80' : i === 2 ? 'text-red-400' : 'text-slate-600'}`} />
                          <span className={`text-sm font-bold leading-none ${colors[i]}`}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => setShowQuickSettings(!showQuickSettings)} className={`p-2 rounded-xl transition-colors ${showQuickSettings ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  <Settings2 size={20} />
                </button>
              </div>

              {/* 快速設定面板 (Overlay) */}
              {showQuickSettings && (
                <div className="absolute top-14 left-0 right-0 z-[60] bg-white border-2 border-rose-100 rounded-3xl shadow-2xl p-5 m-2 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-950 flex items-center gap-2"><Settings2 size={16} /> <DT tKey="setTitle" flexCol={false} /></h3>
                    <button onClick={() => setShowQuickSettings(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="space-y-6">
                    {/* 錯誤提示時間 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <DT tKey="ed" spanClass="text-sm font-bold text-slate-900" />
                        <span className="text-sm font-black text-rose-500">{settings.errorDisplayTime === 0 ? t('manual') : `${settings.errorDisplayTime}s`}</span>
                      </div>
                      <input type="range" min="0" max="10" step="1" value={settings.errorDisplayTime}
                        onChange={e => setSettings({...settings, errorDisplayTime: parseInt(e.target.value)})}
                        className="w-full accent-rose-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    {/* 重複間隔時間 (僅在重複發音模式下顯示) */}
                    {settings.audioMode === 'repeat' && (
                      <div className="pt-2 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <DT tKey="ai" spanClass="text-sm font-bold text-indigo-600" />
                          <span className="text-sm font-black text-indigo-500">{settings.audioInterval}s</span>
                        </div>
                        <input type="range" min="1" max="5" step="1" value={settings.audioInterval}
                          onChange={e => setSettings({...settings, audioInterval: parseInt(e.target.value)})}
                          className="w-full accent-indigo-500 h-2 bg-indigo-50 rounded-lg appearance-none cursor-pointer" />
                      </div>
                    )}
                    {/* 測驗目標切換 (快速設定中) */}
                    <div className="pt-2 border-t border-slate-50">
                        <div className="text-sm font-bold text-slate-900 mb-2"><DT tKey="tgtTitle" flexCol={false} /></div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          {['hira', 'kata'].map(t => (
                            <button key={t} onClick={() => setSettings({ ...settings, targetKana: t })}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.targetKana === t ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                              <DT tKey={t === 'hira' ? 'tgtHira' : 'tgtKata'} flexCol={false} />
                            </button>
                          ))}
                        </div>
                    </div>
                  </div>
                </div>
              )}

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
                
                {mode === 'audio-to-kana' && (
                   <div onClick={() => playAudio(currentQuestion.katakana)} className="flex flex-col items-center justify-center bg-indigo-50 w-32 h-32 rounded-full border-4 border-indigo-100 shadow-inner mb-2 cursor-pointer active:scale-95 transition-transform hover:bg-indigo-100 mt-2">
                      <Volume2 size={48} className="text-indigo-400" />
                   </div>
                )}

                {mode !== 'audio-to-kana' && (
                  <div className={`${mode === 'romaji-to-kana' ? 'text-[4.5rem] uppercase tracking-widest text-indigo-600' : 'text-[4.5rem] sm:text-[5rem] text-slate-950'} font-bold leading-none mt-4 mb-2`}>
                    {mode === 'romaji-to-kana' ? currentQuestion.romaji :
                     settings.targetKana === 'hira' ? currentQuestion.hiragana : currentQuestion.katakana}
                  </div>
                )}

                {settings.showRomaji && mode !== 'romaji-to-kana' && mode !== 'kana-to-romaji' && mode !== 'typing' && (
                   <div className="text-xl font-bold text-slate-600 mb-2 uppercase tracking-widest">{currentQuestion.romaji}</div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {mode !== 'audio-to-kana' && (
                    <button onClick={() => playAudio(currentQuestion.katakana)} className="flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors active:scale-95 shadow-sm">
                      <Volume2 size={18} />
                      <DT tKey="pa" flexCol={false} spanClass="font-semibold text-sm" />
                    </button>
                  )}
                  
                  {availableVoices.length > 1 && (
                    <div className="relative group">
                      <select 
                        value={settings.selectedVoiceURI || ''} 
                        onChange={(e) => {
                          setSettings({ ...settings, selectedVoiceURI: e.target.value });
                          setTimeout(() => playAudio(currentQuestion.katakana), 100);
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      >
                        <option value="">{t('defVoice')}</option>
                        {availableVoices.map((v, idx) => <option key={idx} value={v.voiceURI}>{v.name}</option>)}
                      </select>
                      <button className="flex items-center justify-center p-2 bg-slate-100 text-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                        <Users size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <button onClick={() => setSettings({ ...settings, showRomaji: !settings.showRomaji })} 
                  className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 text-[0.8rem] font-bold shadow-sm ${settings.showRomaji ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'}`}>
                  {settings.showRomaji ? <EyeOff size={14} /> : <Eye size={14} />}
                  <DT tKey="sr" flexCol={false} />
                </button>
              </div>

              {/* 答錯提示 */}
              {showCorrection && (
                <button onClick={() => { if (settings.errorDisplayTime === 0) { setShowCorrection(false); setTypingInput(''); generateNextQuestion(mode, srsData, settings); } }}
                  className={`w-full bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex flex-col items-center mb-4 shadow-md flex-shrink-0 ${settings.errorDisplayTime === 0 ? 'cursor-pointer hover:bg-red-100' : 'cursor-default'}`}>
                  <div className="text-red-600 font-bold mb-1 flex items-center gap-1"><XCircle size={16} /> {t('ca')}</div>
                  <div className="text-4xl font-black text-red-700">
                     {mode === 'recognition' ? (settings.targetKana === 'hira' ? currentQuestion.katakana : currentQuestion.hiragana) : 
                      mode === 'audio-to-kana' || mode === 'romaji-to-kana' ? (settings.targetKana === 'hira' ? currentQuestion.hiragana : currentQuestion.katakana) :
                      currentQuestion.romaji
                     }
                  </div>
                  {settings.showRomaji && mode !== 'kana-to-romaji' && mode !== 'typing' && (
                     <div className="text-lg text-red-500/80 font-bold mt-1 uppercase tracking-widest">{currentQuestion.romaji}</div>
                  )}
                </button>
              )}

              {/* 選項 / 輸入框 */}
              <div className="mt-auto flex-shrink-0 relative">
                
                {mode === 'typing' ? (
                  <form onSubmit={handleTypingSubmit} className="flex flex-col gap-3 pb-2 z-10 w-full relative">
                    <input
                      type="text"
                      value={typingInput}
                      onChange={(e) => setTypingInput(e.target.value)}
                      disabled={isAnimating}
                      autoFocus
                      placeholder={t('typeHint') || 'Type romaji...'}
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full text-center text-3xl font-black p-4 border-2 border-slate-200 rounded-2xl focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 text-slate-950 bg-white shadow-sm"
                    />
                    <button type="submit" disabled={isAnimating || !typingInput.trim()}
                      className="w-full bg-rose-500 text-white font-bold p-4 rounded-2xl disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-95 transition-all text-lg shadow-sm">
                      <DT tKey="submit" flexCol={false} />
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {options.map((opt, idx) => {
                      let displayTxt = '';
                      if (mode === 'kana-to-romaji') displayTxt = opt.romaji.toUpperCase();
                      else if (mode === 'recognition') displayTxt = settings.targetKana === 'hira' ? opt.katakana : opt.hiragana;
                      else displayTxt = settings.targetKana === 'hira' ? opt.hiragana : opt.katakana;

                      return (
                        <button key={`${currentQuestion.romaji}-${opt.romaji}-${idx}`} onClick={() => handleAnswerClick(opt)} disabled={isAnimating}
                          className={`text-3xl sm:text-4xl font-medium p-5 sm:p-6 rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center tracking-widest ${getButtonStyle(opt)}`}>
                          {mode === 'kana-to-romaji' ? <span className="font-bold text-xl sm:text-2xl tracking-widest">{displayTxt}</span> : displayTxt}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {showCorrection && settings.errorDisplayTime === 0 && (
                  <div onClick={() => { setShowCorrection(false); setTypingInput(''); generateNextQuestion(mode, srsData, settings); }}
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-white/40 backdrop-blur-[2px] rounded-2xl">
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
                  className={`p-3 rounded-xl border-2 font-medium transition-all ${settings.uiLang === code ? 'bg-rose-100 border-rose-400 text-rose-700' : 'bg-white border-slate-200 text-slate-900 hover:border-rose-300'}`}>
                  {dict.label}
                </button>
              ))}
            </div>
          )}

          {/* ─── Tab: 首頁（選擇練習範圍） ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'menu' && (
            <div className="flex flex-col flex-grow">

              {/* 🎯 快速預設 */}
              <div className="mb-4">
                 <div className="mb-2 text-sm font-bold text-slate-950 flex items-center justify-between">
                    <DT tKey="presetTitle" flexCol={false} />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {[
                      {id: 'basic', tk: 'presetBasic'},
                      {id: 'dakuon', tk: 'presetDaku'},
                      {id: 'yoon', tk: 'presetYoon'},
                      {id: 'all', tk: 'presetAll'}
                    ].map(p => (
                      <button 
                        key={p.id}
                        onClick={() => applyPreset(p.id)} 
                        className={`py-3 bg-white border-2 font-bold rounded-xl active:scale-95 transition-all shadow-sm text-sm sm:text-base ${activePreset === p.id ? 'border-rose-500 text-rose-600 ring-2 ring-rose-200' : 'border-slate-200 text-slate-800 hover:border-rose-400 hover:text-rose-600'}`}
                      >
                        <DT tKey={p.tk} flexCol={false} />
                      </button>
                    ))}
                 </div>
              </div>

              {/* 🛠️ 進階自訂範圍 折疊區 */}
              <div className="mb-5 bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                 <button onClick={() => setIsCustomOpen(!isCustomOpen)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                       <DT tKey="customRange" flexCol={false} spanClass="font-bold text-slate-800 text-sm" />
                    </div>
                    <div className="text-slate-400">
                       {isCustomOpen ? <ChevronLeft size={18} className="-rotate-90 transition-transform" /> : <ChevronLeft size={18} className="rotate-180 transition-transform" />}
                    </div>
                 </button>
                 
                 {isCustomOpen && (
                   <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                     {/* 行選擇 */}
              <div className="mb-5">
                {rowGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-3">
                    {group.tKey !== 'grpAdv' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-1 h-3.5 rounded-full ${gIdx === 0 ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                        <DT tKey={group.tKey} flexCol={false} spanClass="text-xs font-bold text-slate-800" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {group.items.filter(r => r.id !== 'dakuon' && r.id !== 'yoon').map(row => (
                        <button key={row.id} onClick={() => { setSelectedRows(p => p.includes(row.id) ? p.filter(id => id !== row.id) : [...p, row.id]); setActivePreset(null); }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedRows.includes(row.id) ? 'bg-rose-500 text-white' : 'bg-white border border-slate-200 text-slate-900 hover:border-rose-300'}`}>
                          <DT tKey={row.tKey} flexCol={false} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 段選擇 */}
              <div className="mb-5 pt-4 border-t border-slate-200">
                {colGroups.map((group, gIdx) => (
                  <div key={gIdx} className="mb-3">
                    {group.tKey !== 'grpColYoon' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-1 h-3.5 rounded-full ${gIdx === 0 ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                        <DT tKey={group.tKey} flexCol={false} spanClass="text-xs font-bold text-slate-800" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                       {group.items.map(col => (
                         <button key={col.id} onClick={() => { setSelectedCols(p => p.includes(col.id) ? p.filter(id => id !== col.id) : [...p, col.id]); setActivePreset(null); }}
                           className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCols.includes(col.id) ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-slate-900 hover:border-indigo-300'}`}>
                           <DT tKey={col.tKey} flexCol={false} />
                         </button>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

              {/* 🎯 練習目標切換 (方案B) */}
              <div className="mb-6 pt-4 border-t border-slate-200">
                 <div className="mb-2 text-sm font-bold text-slate-950 flex items-center justify-between">
                    <DT tKey="tgtTitle" flexCol={false} />
                    <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">{settings.targetKana === 'hira' ? 'あかさたな...' : 'アカサタナ...'}</span>
                 </div>
                 <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-100">
                    {['hira', 'kata'].map(t => (
                      <button key={t} onClick={() => setSettings({ ...settings, targetKana: t })}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${settings.targetKana === t ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-800 hover:text-slate-950'}`}>
                        <Zap size={14} className={settings.targetKana === t ? 'text-rose-500' : 'text-slate-300'} />
                        <DT tKey={t === 'hira' ? 'tgtHira' : 'tgtKata'} flexCol={false} />
                      </button>
                    ))}
                 </div>
              </div>

              {/* 🚀 開始按鈕 */}
              <div className="mt-auto">
                <div className="mb-3 text-sm font-bold text-slate-900"><DT tKey="s3" flexCol={false} spanClass="leading-tight" /></div>
                <div className="space-y-4">
                  {/* Basic */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest"><DT tKey="grpTestBasic" flexCol={false}/></div>
                    <div className="grid grid-cols-1 gap-2">
                       <button onClick={() => startGame('recognition')} disabled={selectedRows.length === 0 && selectedCols.length === 0}
                         className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${selectedRows.length === 0 && selectedCols.length === 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm'}`}>
                         <div className="flex flex-col items-start translate-y-[-1px]">
                            <span className="text-[1rem] font-bold text-slate-950 leading-tight">
                               {t(settings.targetKana === 'hira' ? 'mH2K' : 'mK2H')}
                            </span>
                         </div>
                         <Play size={18} className="text-slate-300 group-hover:text-rose-500" />
                       </button>
                       <button onClick={() => startGame('audio-to-kana')} disabled={selectedRows.length === 0 && selectedCols.length === 0}
                         className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${selectedRows.length === 0 && selectedCols.length === 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm'}`}>
                         <DT tKey="mAudio2Kana" className="items-start" spanClass="text-[1rem] font-bold text-slate-950 leading-tight" jpClassName="text-[0.6rem] text-slate-600 mt-0.5" />
                         <Volume2 size={18} className="text-slate-300 group-hover:text-rose-500" />
                       </button>
                    </div>
                  </div>
                  
                  {/* Advanced */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest"><DT tKey="grpTestAdv" flexCol={false}/></div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'romaji-to-kana', tk: 'mRomaji2Kana', icon: KeyRound },
                        { id: 'kana-to-romaji', tk: 'mKana2Romaji', icon: KeyRound },
                        { id: 'typing', tk: 'mTyping', icon: Edit2 } 
                      ].map(m => (
                        <button key={m.id} onClick={() => startGame(m.id)} disabled={selectedRows.length === 0 && selectedCols.length === 0}
                          className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${selectedRows.length === 0 && selectedCols.length === 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm'}`}>
                          <DT tKey={m.tk} className="items-start" spanClass="text-[1rem] font-bold text-slate-950 leading-tight" jpClassName="text-[0.6rem] text-slate-600 mt-0.5" />
                          <m.icon size={18} className="text-slate-300 group-hover:text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab: 日曆 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'calendar' && (
            <LearningCalendar
              dailyStats={dailyStats}
              selDateStr={selDateStr}
              setSelDateStr={setSelDateStr}
              settings={settings}
              t={t}
              playAudio={playAudio}
            />
          )}

          {/* ─── Tab: 五十音表 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'table' && (
            <GojuonTable
              srsData={srsData}
              tableDisplay={tableDisplay}
              setTableDisplay={setTableDisplay}
              playAudio={playAudio}
              settings={settings}
            />
          )}

          {/* ─── Tab: 錯題本 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'stats' && (
            <StatsView
              srsData={srsData}
              settings={settings}
              t={t}
            />
          )}

          {/* ─── Tab: 設定 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'settings' && (
            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
              availableVoices={availableVoices}
              t={t}
              setGameState={setGameState}
              isStandalone={isStandalone}
              deferredPrompt={deferredPrompt}
              handleInstallClick={handleInstallClick}
              isIos={isIos}
            />
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