import React, { useState, useEffect, useCallback } from 'react';

// 資料層
import { rowDefs, colDefs, getTodayKey } from './data/kanaData';
import { i18n } from './data/i18n';

// 邏輯層
import { useSRS, useDailyStats } from './hooks/useSRS';
import { useQuizLogic } from './hooks/useQuizLogic';

// 元件層
import { BottomNav }       from './components/BottomNav';
import { DT }              from './components/DT';
import { GojuonTable }     from './components/GojuonTable';
import { StatsView }       from './components/StatsView';
import { LearningCalendar} from './components/LearningCalendar';
import { SettingsPanel }   from './components/SettingsPanel';
import { KanaDetailView }  from './components/KanaDetailView';
import { KanaWritingQuiz } from './components/KanaWritingQuiz';
import { QuizScreen }      from './components/QuizScreen';
import { HomeView }        from './components/HomeView';

export default function App() {

  // ─── 視圖路由狀態 ───
  const [activeTab,        setActiveTab]        = useState('menu');
  const [gameState,        setGameState]        = useState('idle');   // idle | playing | langPicker | writing-quiz
  const [writingQuizMode,  setWritingQuizMode]  = useState(null);
  const [viewingKana,      setViewingKana]      = useState(null);

  // ─── 範圍選擇 ───
  const [selectedRows,  setSelectedRows]  = useState([]);
  const [selectedCols,  setSelectedCols]  = useState([]);
  const [activePreset,  setActivePreset]  = useState(null);
  const [isCustomOpen,  setIsCustomOpen]  = useState(false);

  // ─── PWA / 語音 ───
  const [availableVoices, setAvailableVoices] = useState([]);
  const [deferredPrompt,  setDeferredPrompt]  = useState(null);

  // ─── 日曆 ───
  const [selDateStr, setSelDateStr] = useState(getTodayKey());

  // ─── 五十音表顯示 ───
  const [tableDisplay, setTableDisplay] = useState({
    hiragana: true, katakana: true, romaji: true, stats: false,
  });

  // ─── SRS & 每日統計 ───
  const { srsData, setSrsData }         = useSRS();
  const { dailyStats, updateDailyStats } = useDailyStats();

  // ─── 設定 ───
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_settings_v1');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        showRomaji: false, errorDisplayTime: 3, audioMode: 'auto',
        audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false,
        selectedVoiceURI: '', targetKana: 'hira', keepCustomOpen: false,
        ...parsed,
      };
    } catch {
      return {
        showRomaji: false, errorDisplayTime: 3, audioMode: 'auto',
        audioInterval: 3, uiLang: 'zh-TW', showJpSubtext: false,
        selectedVoiceURI: '', targetKana: 'hira', keepCustomOpen: false,
      };
    }
  });

  // 設定持久化
  useEffect(() => {
    localStorage.setItem('gojuon_settings_v1', JSON.stringify(settings));
  }, [settings]);

  // 語音清單載入 & PWA install prompt
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setAvailableVoices(
          window.speechSynthesis.getVoices().filter(v => v.lang.includes('ja') || v.lang.includes('JP'))
        );
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadVoices;

    const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // ─── i18n ───
  const t = useCallback((key, langOverride = null) => {
    const lang = langOverride || settings.uiLang;
    const dict = i18n[lang] || i18n['zh-TW'];
    return dict.t[key] || i18n['zh-TW'].t[key] || key;
  }, [settings.uiLang]);

  // ─── 答題邏輯 hook ───
  const quiz = useQuizLogic({
    selectedRows,
    selectedCols,
    srsData,
    setSrsData,
    settings,
    updateDailyStats,
    availableVoices,
    gameState,
  });

  // ─── 派生狀態 ───
  const isSelectionEmpty = selectedRows.length === 0 && selectedCols.length === 0;
  const isPlaying        = gameState === 'playing';
  const isLangPicker     = gameState === 'langPicker';

  // ─── 開始測驗包裝函式 ───
  const handleStartGame = useCallback((selectedMode) => {
    quiz.startGame(selectedMode);
    setGameState('playing');
  }, [quiz]);

  const handleStartWritingQuiz = useCallback((quizMode) => {
    setWritingQuizMode(quizMode);
    setGameState('writing-quiz');
  }, []);

  // ─── 預設範圍套用 ───
  const applyPreset = (presetId) => {
    setActivePreset(presetId);
    switch (presetId) {
      case 'basic':
        setSelectedRows(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa']);
        setSelectedCols(['col-a', 'col-i', 'col-u', 'col-e', 'col-o']);
        break;
      case 'dakuon':
        setSelectedRows(['dakuon']);
        setSelectedCols([]);
        break;
      case 'yoon':
        setSelectedRows(['yoon']);
        setSelectedCols([]);
        break;
      case 'all':
        setSelectedRows(rowDefs.map(r => r.id));
        setSelectedCols(colDefs.map(c => c.id));
        break;
    }
    if (!settings.keepCustomOpen) setIsCustomOpen(false);
  };

  // ─── PWA 工具 ───
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };
  const isIos        = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // ─── Header 標題對照 ───
  const headerTitle = { menu: 'title', calendar: 'calTitle', table: 'tbTitle', stats: 'stTitle', settings: 'setTitle' };
  const headerSub   = { calendar: 'calSub', table: null, stats: 'stSub', settings: 'setSub' };

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
            <DT
              tKey={isPlaying ? 'title' : isLangPicker ? 'langBtn' : (headerTitle[activeTab] || 'title')}
              settings={settings}
              spanClass="text-xl leading-none"
              jpClassName="text-[0.6rem] uppercase tracking-widest opacity-90 mt-0.5 font-medium"
            />
          </h1>

          {!isPlaying && !isLangPicker && headerSub[activeTab] && (
            <div className="text-rose-100 flex flex-col items-center mt-1 opacity-90">
              <DT tKey={headerSub[activeTab]} settings={settings} spanClass="text-xs font-medium leading-none" jpClassName="mt-0.5 text-[0.6rem]" />
            </div>
          )}
          {!isPlaying && !isLangPicker && activeTab === 'menu' && (
            <div className="text-rose-100 flex flex-col items-center mt-1 opacity-90">
              <DT tKey="sub" settings={settings} spanClass="text-xs font-medium leading-none" jpClassName="mt-0.5 text-[0.6rem]" />
            </div>
          )}
        </div>

        {/* ── 單字詳細視圖（覆蓋全部） ── */}
        {viewingKana && (
          <KanaDetailView
            viewingKana={viewingKana}
            setViewingKana={setViewingKana}
            playAudio={quiz.playAudio}
            settings={settings}
            availableVoices={availableVoices}
            t={t}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ── 手寫測驗（覆蓋全部） ── */}
        {gameState === 'writing-quiz' && (
          <KanaWritingQuiz
            onClose={() => setGameState('idle')}
            playAudio={quiz.playAudio}
            recordProgress={quiz.recordWritingProgress}
            settings={settings}
            selectedRows={selectedRows}
            selectedCols={selectedCols}
            t={t}
            setActiveTab={setActiveTab}
            initialMode={writingQuizMode}
          />
        )}

        {/* ── 內容區 ── */}
        <div className="p-4 sm:p-5 flex-grow flex flex-col overflow-y-auto bg-slate-50 min-h-0">

          {/* 🟠 答題畫面 */}
          {isPlaying && quiz.currentQuestion && (
            <QuizScreen
              currentQuestion={quiz.currentQuestion}
              options={quiz.options}
              selectedAnswer={quiz.selectedAnswer}
              isAnimating={quiz.isAnimating}
              showCorrection={quiz.showCorrection}
              setShowCorrection={quiz.setShowCorrection}
              mode={quiz.mode}
              settings={settings}
              setSettings={setSettings}
              dailyStats={dailyStats}
              typingInput={quiz.typingInput}
              setTypingInput={quiz.setTypingInput}
              handleAnswerClick={quiz.handleAnswerClick}
              handleTypingSubmit={quiz.handleTypingSubmit}
              generateNextQuestion={quiz.generateNextQuestion}
              srsData={srsData}
              playAudio={quiz.playAudio}
              availableVoices={availableVoices}
              getButtonStyle={quiz.getButtonStyle}
              t={t}
            />
          )}

          {/* 🌐 語言選擇 */}
          {isLangPicker && (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {Object.entries(i18n).map(([code, dict]) => (
                <button
                  key={code}
                  onClick={() => { setSettings({ ...settings, uiLang: code }); setGameState('idle'); }}
                  className={`p-3 rounded-xl border-2 font-medium transition-all ${settings.uiLang === code ? 'bg-rose-100 border-rose-400 text-rose-700' : 'bg-white border-slate-200 text-slate-900 hover:border-rose-300'}`}
                >
                  {dict.label}
                </button>
              ))}
            </div>
          )}

          {/* ─── Tab: 首頁 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'menu' && (
            <HomeView
              activePreset={activePreset}
              applyPreset={applyPreset}
              isCustomOpen={isCustomOpen}
              setIsCustomOpen={setIsCustomOpen}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              selectedCols={selectedCols}
              setSelectedCols={setSelectedCols}
              setActivePreset={setActivePreset}
              settings={settings}
              setSettings={setSettings}
              isSelectionEmpty={isSelectionEmpty}
              onStartGame={handleStartGame}
              onStartWritingQuiz={handleStartWritingQuiz}
              t={t}
            />
          )}

          {/* ─── Tab: 日曆 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'calendar' && (
            <LearningCalendar
              dailyStats={dailyStats}
              selDateStr={selDateStr}
              setSelDateStr={setSelDateStr}
              settings={settings}
              t={t}
              playAudio={quiz.playAudio}
            />
          )}

          {/* ─── Tab: 五十音表 ─── */}
          {!isPlaying && !isLangPicker && activeTab === 'table' && (
            <GojuonTable
              srsData={srsData}
              tableDisplay={tableDisplay}
              setTableDisplay={setTableDisplay}
              playAudio={quiz.playAudio}
              settings={settings}
              setSettings={setSettings}
              setViewingKana={setViewingKana}
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

        {/* ── 底部導航列 ── */}
        {!isPlaying && !isLangPicker && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={tab => { setActiveTab(tab); if (gameState !== 'idle') setGameState('idle'); }}
            t={t}
            uiLang={settings.uiLang}
          />
        )}

      </div>
    </div>
  );
}