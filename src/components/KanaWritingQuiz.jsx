import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Volume2, RotateCcw, CheckCircle, Award, ArrowRight, RefreshCw } from 'lucide-react';
import { kanaData, rowDefs, colDefs, shuffleArray } from '../data/kanaData';
import { KanaCanvas } from './KanaCanvas';
import { BottomNav } from './BottomNav';
import { scoreHandwriting } from '../utils/kanaScorer';

const QUESTIONS_PER_SESSION = 10;

/** 根據已選行/段過濾出有效假名（與 App.jsx 邏輯一致） */
function getActiveKana(selectedRows, selectedCols) {
  const safeKana = kanaData.filter(k => k.romaji !== 'xtsu');
  const filtered = kanaData.filter(kana => {
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

  // 如果選出來是有東西的，就用選出的。否則退回到「全部」（safeKana），與 App.jsx 行為一致
  const pool = filtered.length > 0 ? filtered : safeKana;
  return pool;
}

export const KanaWritingQuiz = ({ onClose, playAudio, settings, selectedRows, selectedCols, t, setActiveTab, initialMode = null }) => {
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

  /** 開始一輪測驗 */
  const startQuiz = useCallback((mode) => {
    const activeKana = getActiveKana(selectedRows, selectedCols);
    // 為每題隨機決定方向
    const selected = shuffleArray([...activeKana]).slice(0, QUESTIONS_PER_SESSION).map(k => ({
      ...k,
      qType: mode === 'mixed-conversion' 
        ? (Math.random() > 0.5 ? 'hira-to-kata' : 'kata-to-hira')
        : (mode === 'audio' ? 'audio' : mode)
    }));
    
    setQuizMode(mode);
    setQuestions(selected);
    setQuestionIdx(0);
    setScores([]);
    setCurrentResult(null);
    setPhase('question');
  }, [selectedRows, selectedCols]);

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
      const timer = setTimeout(() => playAudio(currentQ.katakana), 350);
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
    setCurrentResult({ ...result, targetChar, kana: currentQ });
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
  // Screen A: 模式選擇
  // ─────────────────────────────────────────
  if (quizMode === null) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col">
        <div className="bg-rose-500 pt-5 pb-4 px-4 text-white flex-shrink-0 flex items-center justify-between shadow-md">
          <button onClick={onClose} className="p-2 bg-rose-600/50 hover:bg-rose-600 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <div className="font-black text-lg tracking-widest">✏️ 手寫測驗</div>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-28">
          <p className="text-slate-400 text-sm text-center mb-6 font-medium">
            選擇測驗模式，在手寫板上寫出正確的假名
          </p>

          <div className="space-y-4">
            {/* 聽音寫字 */}
            <button onClick={() => startQuiz('audio')}
              className="w-full bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm text-left hover:border-rose-300 hover:shadow-md active:scale-[0.98] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Volume2 size={28} className="text-rose-500" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-lg">聽音寫字</div>
                  <div className="text-slate-500 text-sm mt-1">聽到發音，寫出對應的假名</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    難度 ⭐⭐⭐
                  </div>
                </div>
              </div>
            </button>

            {/* 平 → 片 */}
            <button onClick={() => startQuiz('hira-to-kata')}
              className="w-full bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm text-left hover:border-indigo-300 hover:shadow-md active:scale-[0.98] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-xl font-black text-indigo-600">あ→ア</span>
                </div>
                <div>
                  <div className="font-black text-slate-900 text-lg">平假名 → 片假名</div>
                  <div className="text-slate-500 text-sm mt-1">看到平假名，寫出對應的片假名</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    難度 ⭐⭐
                  </div>
                </div>
              </div>
            </button>

            {/* 片 → 平 */}
            <button onClick={() => startQuiz('kata-to-hira')}
              className="w-full bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm text-left hover:border-purple-300 hover:shadow-md active:scale-[0.98] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-xl font-black text-purple-600">ア→あ</span>
                </div>
                <div>
                  <div className="font-black text-slate-900 text-lg">片假名 → 平假名</div>
                  <div className="text-slate-500 text-sm mt-1">看到片假名，寫出對應的平假名</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    難度 ⭐⭐
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <BottomNav activeTab="menu" onTabChange={(tab) => { onClose(); setActiveTab(tab); }} t={t} uiLang={settings.uiLang} />
      </div>
    );
  }

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
              return (
                <div key={i} className={`rounded-xl p-2 border-2 text-center ${cls}`}>
                  <div className="text-lg font-black">
                    {quizMode === 'hira-to-kata' ? q.katakana : q.hiragana}
                  </div>
                  <div className="text-[10px] font-bold">{s}分</div>
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
            <button onClick={() => setQuizMode(null)}
              className="w-full py-4 bg-white text-slate-700 font-black rounded-2xl text-lg shadow-sm border-2 border-slate-100 hover:bg-slate-50 active:scale-95 transition-all">
              選擇其他模式
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
  const progressPct = (questionIdx / questions.length) * 100;
  const modeLabel = quizMode === 'audio' ? '聽音寫字'
                  : quizMode === 'hira-to-kata' ? '平 → 片'
                  : '片 → 平';

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header with progress */}
      <div className="bg-rose-500 pt-5 pb-3 px-4 text-white flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={() => setQuizMode(null)} className="p-2 bg-rose-600/50 hover:bg-rose-600 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <div className="font-black text-base tracking-widest">✏️ 手寫測驗</div>
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
