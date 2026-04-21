import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Volume2, RotateCcw, CheckCircle, Award, ArrowRight, RefreshCw } from 'lucide-react';
import { kanaData, rowDefs, colDefs, shuffleArray, getActiveKana } from '../data/kanaData';
import { KanaCanvas } from './KanaCanvas';
import { BottomNav } from './BottomNav';
import { scoreHandwriting } from '../utils/kanaScorer';

const QUESTIONS_PER_SESSION = 10;



export const KanaWritingQuiz = ({ onClose, playAudio, recordProgress, settings, selectedRows, selectedCols, t, setActiveTab, initialMode = null }) => {
  // 測驗模式: null=選擇畫面 | 'audio' | 'mixed-conversion' | ...
  const [quizMode, setQuizMode] = useState(initialMode);
  // 測驗階段: 'question' | 'result' | 'summary'
  const [phase, setPhase] = useState('question');
  const [questions, setQuestions] = useState([]); // [{ ...kana, qType: 'hira-to-kata' | 'kata-to-hira' }]
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [isScoring, setIsScoring] = useState(false);

  const canvasRef = useRef(null);

  // 用 ref 儲存最新的 playAudio，防止 effect 因函式參照變化重跑
  const playAudioRef = useRef(playAudio);
  useEffect(() => {
    playAudioRef.current = playAudio;
  }, [playAudio]);

  /** 開始一輪測驗 */
  const startQuiz = useCallback((mode) => {
    const activeKana = getActiveKana(selectedRows, selectedCols);
    // 依據首頁「測驗目標」決定轉寫方向
    const selected = shuffleArray([...activeKana]).slice(0, QUESTIONS_PER_SESSION).map(k => ({
      ...k,
      qType: mode === 'mixed-conversion' 
        ? (settings.targetKana === 'hira' ? 'kata-to-hira' : 'hira-to-kata')
        : (mode === 'audio' ? 'audio' : mode)
    }));
    
    setQuizMode(mode);
    setQuestions(selected);
    setQuestionIdx(0);
    setScores([]);
    setCurrentResult(null);
    setPhase('question');
    setIsScoring(false);
  }, [selectedRows, selectedCols, settings.targetKana]);

  // 若外部傳入初始模式，自動啟動
  useEffect(() => {
    if (initialMode && questions.length === 0) {
      startQuiz(initialMode);
    }
  }, [initialMode, startQuiz, questions.length]);

  const currentQ = questions[questionIdx];

  /** 使用者「應該寫出」的字元 */
  const getTargetChar = useCallback(() => {
    if (!currentQ) return '';
    const qType = currentQ.qType;
    if (qType === 'audio')        return settings.targetKana === 'kata' ? currentQ.katakana : currentQ.hiragana;
    if (qType === 'hira-to-kata') return currentQ.katakana;
    if (qType === 'kata-to-hira') return currentQ.hiragana;
    return currentQ.hiragana;
  }, [currentQ, settings.targetKana]);

  /** 出題畫面顯示的提示字元（非音訊模式） */
  const getPromptChar = useCallback(() => {
    if (!currentQ) return null;
    const qType = currentQ.qType;
    if (qType === 'audio') return null;
    return qType === 'hira-to-kata' ? currentQ.hiragana : currentQ.katakana;
  }, [currentQ]);

  /** 音訊模式：進入新題目時自動播放 */
  useEffect(() => {
    if (phase === 'question' && currentQ && currentQ.qType === 'audio') {
      const timer = setTimeout(() => playAudioRef.current(currentQ.katakana), 350);
      return () => clearTimeout(timer);
    }
  }, [questionIdx, phase, currentQ]);

  /** 提交評分 */
  const handleScore = async () => {
    if (isScoring) return;
    setIsScoring(true);
    const canvas = canvasRef.current?.getCanvas();
    const targetChar = getTargetChar();
    const result = scoreHandwriting(canvas, targetChar);
    
    // 判定是否正確 (80分門檻)
    const isCorrect = result.score >= 80;
    
    // 紀錄進度到日曆與 SRS
    if (recordProgress && currentQ) {
      recordProgress(currentQ.romaji, isCorrect);
    }

    setCurrentResult({ ...result, isCorrect, targetChar, kana: currentQ });
    setScores(prev => [...prev, result.score]);
    setPhase('result');
    setIsScoring(false);
  };

  /** 進入下一題 */
  const handleNext = () => {
    if (questionIdx >= questions.length - 1) {
      setPhase('summary');
    } else {
      setQuestionIdx(prev => prev + 1);
      setCurrentResult(null);
      setPhase('question');
      canvasRef.current?.clear();
    }
  };

  /** 統計 */
  const avgScore     = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const perfectCount = scores.filter(s => s >= 85).length;
  const goodCount    = scores.filter(s => s >= 70 && s < 85).length;
  const failCount    = scores.filter(s => s < 70).length;

  // ─────────────────────────────────────────
  // Screen B: 成績總覽
  // ─────────────────────────────────────────
  if (phase === 'summary') {
    const emoji = avgScore >= 85 ? '🏆' : avgScore >= 70 ? '🎉' : avgScore >= 50 ? '💪' : '📚';
    const label = avgScore >= 85 ? '太棒了！' : avgScore >= 70 ? '很不錯！' : avgScore >= 50 ? '繼續加油！' : '多加練習！';

    return (
      <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col">
        <div className="bg-rose-500 pt-5 pb-4 px-4 text-white flex-shrink-0 flex items-center justify-between shadow-md">
          <button onClick={onClose} className="p-2 bg-rose-600/50 hover:bg-rose-600 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <div className="font-black text-lg tracking-widest">測驗結果</div>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-28">
          {/* 總分卡片 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-sm mb-5 text-center">
            <div className="text-5xl mb-2">{emoji}</div>
            <div className="text-5xl font-black text-slate-900 mb-1">
              {avgScore}<span className="text-2xl text-slate-400 font-bold ml-1">分</span>
            </div>
            <div className="text-xl font-black text-rose-500 mb-4">{label}</div>
            <div className="flex justify-center gap-6 pt-4 border-t border-slate-100">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-500">{perfectCount}</div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">優秀 ⭐</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-blue-500">{goodCount}</div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">良好 ✅</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-slate-400">{failCount}</div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">待加強 ❌</div>
              </div>
            </div>
          </div>

          {/* 各題結果 */}
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">各題明細</h3>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, i) => {
              const s = scores[i] ?? 0;
              const cls = s >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : s >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : s >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-600 border-red-200';

              // 目標字（使用者應該寫出的）
              const targetChar = q.qType === 'audio'
                ? (settings.targetKana === 'kata' ? q.katakana : q.hiragana)
                : q.qType === 'hira-to-kata' ? q.katakana : q.hiragana;

              // 提示字（出題時顯示的）
              const promptChar = q.qType === 'audio' ? '🔊'
                : q.qType === 'hira-to-kata' ? q.hiragana : q.katakana;

              return (
                <div key={i} className={`rounded-xl p-1.5 border-2 text-center ${cls}`}>
                  <div className="text-[9px] font-bold opacity-60 leading-none mb-0.5">{promptChar}</div>
                  <div className="text-lg font-black leading-none">{targetChar}</div>
                  <div className="text-[10px] font-bold mt-0.5">{s}分</div>
                </div>
              );
            })}
          </div>

          {/* 操作按鈕 */}
          <div className="space-y-3">
            <button onClick={() => startQuiz(quizMode)}
              className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl text-lg shadow-md hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2">
              <RefreshCw size={20} /> 再來一次
            </button>
          </div>
        </div>

        <BottomNav activeTab="menu" onTabChange={(tab) => { onClose(); setActiveTab(tab); }} t={t} uiLang={settings.uiLang} />
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Screen C: 出題 / 評分結果
  // ─────────────────────────────────────────
  const targetChar = getTargetChar();
  const promptChar = getPromptChar();
  const progressPct = (questionIdx / (questions.length || 1)) * 100;
  const modeLabel = quizMode === 'audio' ? '聽音辨識寫字'
                  : quizMode === 'mixed-conversion' ? '平片假名互轉'
                  : '手寫測驗';

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header with progress */}
      <div className="bg-rose-500 pt-5 pb-3 px-4 text-white flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={onClose} className="p-2 bg-rose-600/50 hover:bg-rose-600 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <div className="font-black text-base tracking-widest">✏️ {t('grpTestWrite')}</div>
            <div className="text-xs text-rose-200 font-bold">{modeLabel}</div>
          </div>
          <div className="text-sm font-black bg-rose-600/40 px-3 py-1 rounded-full">
            {questionIdx + 1} / {questions.length}
          </div>
        </div>
        <div className="h-1.5 bg-rose-400/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-28 flex flex-col items-center gap-4">

          {/* 題目提示區 */}
          {quizMode === 'audio' ? (
            <div className="w-full bg-white rounded-2xl p-4 border-2 border-rose-100 shadow-sm flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-slate-500">
                聽到發音，寫出
                <span className="text-rose-500 mx-1">
                  {settings.targetKana === 'kata' ? '片假名' : '平假名'}
                </span>
              </p>
              <button
                onClick={() => playAudio(currentQ?.katakana)}
                className="flex items-center gap-3 px-8 py-3 bg-rose-100 text-rose-600 rounded-full font-black text-lg hover:bg-rose-200 active:scale-95 transition-all shadow-sm"
              >
                <Volume2 size={24} /> 再次播放
              </button>
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl p-4 border-2 border-indigo-100 shadow-sm flex flex-col items-center gap-1">
              <p className="text-sm font-bold text-slate-500">
                看到<span className={`mx-1 ${quizMode === 'hira-to-kata' ? 'text-indigo-500' : 'text-purple-500'}`}>
                  {quizMode === 'hira-to-kata' ? '平假名' : '片假名'}
                </span>，請寫出對應的<span className={`mx-1 ${quizMode === 'hira-to-kata' ? 'text-indigo-600' : 'text-purple-600'}`}>
                  {quizMode === 'hira-to-kata' ? '片假名' : '平假名'}
                </span>
              </p>
              <div className="text-7xl font-bold text-slate-900 leading-none py-2">{promptChar}</div>
              <div className="text-base text-slate-400 font-bold uppercase tracking-widest">{currentQ?.romaji}</div>
            </div>
          )}

          {/* 手寫板（無引導底圖，完全靠記憶） */}
          <div className="relative">
            <KanaCanvas
              ref={canvasRef}
              char={null}
              showGuide={false}
              strokeColor="#1e293b"
            />

            {/* 評分結果 Overlay */}
            {phase === 'result' && currentResult && (
              <div
                className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center border-4 animate-in fade-in zoom-in duration-300"
                style={{ borderColor: currentResult.color }}
              >
                <div className="text-5xl mb-1">{currentResult.emoji}</div>
                <div className="text-6xl font-black mb-0.5" style={{ color: currentResult.color }}>
                  {currentResult.score}
                </div>
                <div className="text-base font-bold text-slate-500 mb-1">分</div>
                <div className="text-xl font-black mb-4" style={{ color: currentResult.color }}>
                  {currentResult.label}
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-slate-400 font-bold">正確答案</span>
                  <span className="text-4xl font-bold text-slate-800">{currentResult.targetChar}</span>
                  <span className="text-base text-rose-400 uppercase font-black tracking-wider">
                    {currentResult.kana?.romaji}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 控制按鈕 */}
          {phase === 'question' && (
            <div className="flex items-center gap-4 w-full max-w-xs">
              <button
                onClick={() => canvasRef.current?.clear()}
                className="flex-1 py-3.5 bg-white text-slate-600 rounded-2xl font-bold border-2 border-slate-100 shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> 清除
              </button>
              <button
                onClick={handleScore}
                disabled={isScoring}
                className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl font-black shadow-md hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle size={18} /> 評分
              </button>
            </div>
          )}

          {phase === 'result' && (
            <button
              onClick={handleNext}
              className="w-full max-w-xs py-4 bg-rose-500 text-white rounded-2xl font-black text-lg shadow-md hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {questionIdx >= questions.length - 1
                ? <><Award size={20} /> 查看結果</>
                : <><ArrowRight size={20} /> 下一題</>
              }
            </button>
          )}

        </div>
      </div>

      <BottomNav
        activeTab="menu"
        onTabChange={(tab) => { onClose(); setActiveTab(tab); }}
        t={t}
        uiLang={settings.uiLang}
      />
    </div>
  );
};
