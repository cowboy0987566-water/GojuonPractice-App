import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, Play, RefreshCw, Home, CheckCircle2, XCircle, BarChart3, Settings, Globe, LayoutGrid, CalendarDays, Zap } from 'lucide-react';

// 資料層
import { kanaData, tableLayout, rowDefs, colDefs, rowGroups, colGroups } from './data/kanaData';
import { i18n } from './data/i18n';

// 邏輯層 (Hooks)
import { useSRS, useDailyStats } from './hooks/useSRS';

// 元件層
import { DT } from './components/DT';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { LearningCalendar } from './components/LearningCalendar';
import { GojuonTable } from './components/GojuonTable';
import { StatsView } from './components/StatsView';

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
  const [selDateStr, setSelDateStr] = useState('');

  const { srsData, updateSRS } = useSRS();
  const { dailyStats, updateDailyStats, getTodayKey } = useDailyStats();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_settings_v1');
      return saved ? JSON.parse(saved) : {
        showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: ''
      };
    } catch (e) {
      return { showRomaji: false, errorDisplayTime: 3, audioMode: 'auto', audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false, selectedVoiceURI: '' };
    }
  });

  useEffect(() => { localStorage.setItem('gojuon_settings_v1', JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const t = useCallback((key, langOverride = null) => {
    const lang = langOverride || settings.uiLang;
    const dict = i18n[lang] || i18n['zh-TW'];
    return dict.t[key] || i18n['zh-TW'].t[key] || key;
  }, [settings.uiLang]);

  const playAudio = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      if (settings.selectedVoiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
        if (voice) utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, [settings.selectedVoiceURI, availableVoices]);

  const generateNextQuestion = useCallback((currentMode, currentSrsData, currentSettings) => {
    const activeKana = kanaData.filter(kana => {
      if (kana.romaji === 'xtsu') return false;
      const rMatch = rowDefs.find(r => r.chars.includes(kana.romaji));
      const cMatch = colDefs.find(c => c.chars.includes(kana.romaji));
      if (selectedRows.length > 0 && selectedCols.length > 0) return rMatch && selectedRows.includes(rMatch.id) && cMatch && selectedCols.includes(cMatch.id);
      if (selectedRows.length > 0) return rMatch && selectedRows.includes(rMatch.id);
      if (selectedCols.length > 0) return cMatch && selectedCols.includes(cMatch.id) && !tableLayout.dakuon.flat().includes(kana.romaji);
      return false;
    });

    const now = Date.now();
    const pool = activeKana.filter(k => !currentSrsData[k.romaji] || currentSrsData[k.romaji].nextReview <= now);
    const finalPool = pool.length > 0 ? pool : (activeKana.length > 0 ? activeKana : kanaData.filter(k => k.romaji !== 'xtsu'));
    const correctItem = finalPool[Math.floor(Math.random() * finalPool.length)];

    const wrongItems = [];
    const safePool = kanaData.filter(k => k.romaji !== 'xtsu' && k.romaji !== correctItem.romaji);
    while (wrongItems.length < 3) {
      const cand = safePool[Math.floor(Math.random() * safePool.length)];
      if (!wrongItems.find(w => w.romaji === cand.romaji)) wrongItems.push(cand);
    }

    const optionsArr = [correctItem, ...wrongItems].sort(() => Math.random() - 0.5);
    setSelectedAnswer(null);
    setCurrentQuestion(correctItem);
    setOptions(optionsArr);
    setIsAnimating(false);
    if (currentSettings.audioMode !== 'manual') playAudio(correctItem.katakana);
  }, [playAudio, selectedRows, selectedCols]);

  const handleAnswerClick = (option) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedAnswer(option);
    const isCorrect = option.romaji === currentQuestion.romaji;
    if (!isCorrect) setShowCorrection(true);

    updateDailyStats(currentQuestion.romaji, isCorrect);
    const updatedSrs = updateSRS(currentQuestion.romaji, isCorrect);

    if (isCorrect) {
      setTimeout(() => { generateNextQuestion(mode, updatedSrs, settings); }, 1200);
    } else if (settings.errorDisplayTime > 0) {
      setTimeout(() => { setShowCorrection(false); generateNextQuestion(mode, updatedSrs, settings); }, settings.errorDisplayTime * 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col relative max-h-[95vh]">
        <Header 
          gameState={gameState} 
          prevGameState={prevGameState} 
          setGameState={setGameState} 
          settings={settings}
          tKey={gameState === 'stats' ? 'stTitle' : gameState === 'settings' ? 'setTitle' : gameState === 'langPicker' ? 'langBtn' : gameState === 'table' ? 'tbTitle' : gameState === 'calendar' ? 'calTitle' : 'title'}
        />

        <div className="p-4 sm:p-5 flex-grow flex flex-col overflow-y-auto bg-slate-50 relative">
          {gameState === 'menu' && (
            <>
              <div className="flex justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <button onClick={() => setGameState('settings')} className="flex-1 flex flex-col items-center"><Settings size={20} /><DT tKey="setBtn" settings={settings} spanClass="text-[0.6rem] font-bold" /></button>
                <button onClick={() => setGameState('langPicker')} className="flex-1 flex flex-col items-center"><Globe size={20} /><DT tKey="langBtn" settings={settings} spanClass="text-[0.6rem] font-bold" /></button>
                <button onClick={() => { setSelDateStr(getTodayKey()); setGameState('calendar'); }} className="flex-1 flex flex-col items-center"><CalendarDays size={20} /><DT tKey="calBtn" settings={settings} spanClass="text-[0.6rem] font-bold" /></button>
                <button onClick={() => setGameState('table')} className="flex-1 flex flex-col items-center"><LayoutGrid size={20} /><DT tKey="tbBtn" settings={settings} spanClass="text-[0.6rem] font-bold" /></button>
                <button onClick={() => setGameState('stats')} className="flex-1 flex flex-col items-center"><BarChart3 size={20} /><DT tKey="stBtn" settings={settings} spanClass="text-[0.6rem] font-bold" /></button>
              </div>

              <div className="mb-6">
                <DT tKey="s1" settings={settings} spanClass="font-bold text-slate-700 text-lg mb-4" />
                <div className="flex flex-wrap gap-2">
                  {rowDefs.map(row => (
                    <button key={row.id} onClick={() => setSelectedRows(prev => prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id])} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedRows.includes(row.id) ? 'bg-rose-500 text-white' : 'bg-white border border-slate-200'}`}>
                      {row.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 pt-5 border-t border-slate-200">
                <DT tKey="s2" settings={settings} spanClass="font-bold text-slate-700 text-lg mb-4" />
                <div className="flex flex-wrap gap-2">
                  {colDefs.map(col => (
                    <button key={col.id} onClick={() => setSelectedCols(prev => prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id])} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedCols.includes(col.id) ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200'}`}>
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <button onClick={() => { setMode('hira-to-kata'); setGameState('playing'); generateNextQuestion('hira-to-kata', srsData, settings); }} className="w-full flex items-center justify-between p-4 border-2 rounded-2xl bg-white hover:bg-rose-50"><DT tKey="mH2K" settings={settings} spanClass="text-xl font-bold" /><Play /></button>
                <button onClick={() => { setMode('kata-to-hira'); setGameState('playing'); generateNextQuestion('kata-to-hira', srsData, settings); }} className="w-full flex items-center justify-between p-4 border-2 rounded-2xl bg-white hover:bg-rose-50"><DT tKey="mK2H" settings={settings} spanClass="text-xl font-bold" /><Play /></button>
              </div>
            </>
          )}

          {gameState === 'playing' && currentQuestion && (
            <div className="flex flex-col h-full">
              <div className="text-[5.5rem] font-bold text-slate-800 text-center flex-grow flex items-center justify-center">
                {mode === 'hira-to-kata' ? currentQuestion.hiragana : currentQuestion.katakana}
              </div>
              {showCorrection && (
                <div className="bg-red-50 border-2 border-red-400 p-4 rounded-2xl text-center mb-4 cursor-pointer" onClick={() => { setShowCorrection(false); generateNextQuestion(mode, srsData, settings); }}>
                   <div className="text-red-600 font-bold">{t('ca')}</div>
                   <div className="text-5xl font-black">{mode === 'hira-to-kata' ? currentQuestion.katakana : currentQuestion.hiragana}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-auto">
                {options.map(opt => (
                  <button key={`${currentQuestion.romaji}-${opt.romaji}`} onClick={() => handleAnswerClick(opt)} className={`text-4xl p-6 rounded-2xl transition-all border-2 ${selectedAnswer?.romaji === opt.romaji ? (opt.romaji === currentQuestion.romaji ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-400') : 'bg-white'}`}>
                    {mode === 'hira-to-kata' ? opt.katakana : opt.hiragana}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} availableVoices={availableVoices} t={t} />}
          {gameState === 'calendar' && <LearningCalendar dailyStats={dailyStats} selDateStr={selDateStr} setSelDateStr={setSelDateStr} settings={settings} t={t} playAudio={playAudio} />}
          {gameState === 'table' && <GojuonTable srsData={srsData} tableDisplay={tableDisplay} setTableDisplay={setTableDisplay} playAudio={playAudio} settings={settings} />}
          {gameState === 'stats' && <StatsView srsData={srsData} settings={settings} t={t} />}
          {gameState === 'langPicker' && (
             <div className="grid grid-cols-2 gap-3">
               {Object.entries(i18n).map(([code, dict]) => (
                 <button key={code} onClick={() => { setSettings({...settings, uiLang: code}); setGameState('menu'); }} className={`p-3 rounded-xl border-2 ${settings.uiLang === code ? 'bg-rose-100 border-rose-400' : 'bg-white'}`}>{dict.label}</button>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}