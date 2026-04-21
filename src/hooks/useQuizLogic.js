import { useState, useEffect, useCallback, useRef } from 'react';
import { kanaData, rowDefs, colDefs, tableLayout, getTodayKey, shuffleArray, getActiveKana } from '../data/kanaData';
import { computeSRS } from './useSRS';

/**
 * useQuizLogic — 封裝答題流程的所有狀態與邏輯
 *
 * @param {object} config
 * @param {string[]} config.selectedRows      - 已選行 id 陣列
 * @param {string[]} config.selectedCols      - 已選段 id 陣列
 * @param {object}   config.srsData           - SRS 資料
 * @param {function} config.setSrsData        - SRS setter
 * @param {object}   config.settings          - app 設定
 * @param {function} config.updateDailyStats  - useDailyStats 提供的更新函式
 * @param {object[]} config.availableVoices   - 可用語音清單
 * @param {string}   config.gameState         - 目前遊戲狀態（'playing' | 'idle' | …）
 */
export function useQuizLogic({
  selectedRows,
  selectedCols,
  srsData,
  setSrsData,
  settings,
  updateDailyStats,
  availableVoices,
  gameState,
}) {
  // ─── 測驗內部狀態 ───
  const [mode, setMode] = useState('hira-to-kata');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [typingInput, setTypingInput] = useState('');

  // ─── 發音 ───
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

  // 使用 ref 儲存最新的 playAudio 函式，防止依賴變更導致 interval 重建
  const playAudioRef = useRef(playAudio);
  useEffect(() => {
    playAudioRef.current = playAudio;
  }, [playAudio]);

  // ─── 重複播放 effect ───
  useEffect(() => {
    if (
      gameState === 'playing' &&
      currentQuestion &&
      !isAnimating &&
      !showCorrection &&
      settings.audioMode === 'repeat'
    ) {
      const id = setInterval(
        () => playAudioRef.current(currentQuestion.katakana),
        settings.audioInterval * 1000
      );
      return () => clearInterval(id);
    }
  }, [gameState, currentQuestion, isAnimating, showCorrection, settings.audioMode, settings.audioInterval]);

  // ─── 出題 ───
  const generateNextQuestion = useCallback((currentMode, currentSrsData, currentSettings) => {
    const safeKana = kanaData.filter(k => k.romaji !== 'xtsu');
    const selEmpty = selectedRows.length === 0 && selectedCols.length === 0;

    const activeKana = getActiveKana(selectedRows, selectedCols);

    const now = Date.now();
    const dueItems = activeKana.filter(
      k => !currentSrsData[k.romaji] || currentSrsData[k.romaji].nextReview <= now
    );

    // 優先從到期項目出題；完全沒選範圍時退回 safeKana
    const pool =
      dueItems.length > 0
        ? dueItems
        : activeKana.length > 0
          ? activeKana
          : selEmpty ? safeKana : activeKana;
    const finalPool = pool && pool.length > 0 ? pool : safeKana;
    const correctItem = finalPool[Math.floor(Math.random() * finalPool.length)];

    const getCategory = r =>
      tableLayout.seion.flat().includes(r) ? 'seion' :
      tableLayout.dakuon.flat().includes(r) ? 'dakuon' :
      tableLayout.yoon.flat().includes(r) ? 'yoon' : 'all';

    const cat = getCategory(correctItem.romaji);
    const wrongPool = safeKana.filter(k => getCategory(k.romaji) === cat);
    let wrongItems = [];
    while (wrongItems.length < 3) {
      const cand = wrongPool[Math.floor(Math.random() * wrongPool.length)];
      if (cand.romaji !== correctItem.romaji && !wrongItems.find(w => w.romaji === cand.romaji)) {
        wrongItems.push(cand);
      }
    }

    setCurrentQuestion(correctItem);
    setOptions(shuffleArray([correctItem, ...wrongItems]));
    setSelectedAnswer(null);
    setIsAnimating(false);
    if (currentSettings.audioMode !== 'manual') playAudioRef.current(correctItem.katakana);
  }, [selectedRows, selectedCols]);

  // ─── 開始測驗（由 App.jsx 包裝，同時呼叫 setGameState('playing')） ───
  const startGame = useCallback((selectedMode) => {
    setMode(selectedMode);
    setShowCorrection(false);
    setTypingInput('');
    generateNextQuestion(selectedMode, srsData, settings);
  }, [generateNextQuestion, srsData, settings]);

  // ─── 處理作答結果 ───
  const processAnswer = useCallback((isCorrect, currentSrsData, currentMode, currentSettings) => {
    if (!currentQuestion) return;
    updateDailyStats(currentQuestion.romaji, isCorrect, getTodayKey());

    const key = currentQuestion.romaji;
    const newItem = computeSRS(currentSrsData[key], isCorrect);
    const updatedSrs = { ...currentSrsData, [key]: newItem };
    setSrsData(updatedSrs);

    if (isCorrect) {
      setTimeout(() => {
        setShowCorrection(false);
        setTypingInput('');
        generateNextQuestion(currentMode, updatedSrs, currentSettings);
      }, 1200);
    } else if (currentSettings.errorDisplayTime > 0) {
      setTimeout(() => {
        setShowCorrection(false);
        setTypingInput('');
        generateNextQuestion(currentMode, updatedSrs, currentSettings);
      }, currentSettings.errorDisplayTime * 1000);
    }
  }, [currentQuestion, updateDailyStats, setSrsData, generateNextQuestion]);

  // ─── 選項點擊 ───
  const handleAnswerClick = useCallback((option) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedAnswer(option);
    const isCorrect = option.romaji === currentQuestion.romaji;
    if (!isCorrect) setShowCorrection(true);
    processAnswer(isCorrect, srsData, mode, settings);
  }, [isAnimating, currentQuestion, processAnswer, srsData, mode, settings]);

  // ─── 打字模式提交 ───
  const handleTypingSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (isAnimating || !typingInput.trim()) return;
    setIsAnimating(true);
    const inputClean = typingInput.trim().toLowerCase();
    const isCorrect = inputClean === currentQuestion.romaji;
    setSelectedAnswer({ romaji: inputClean });
    if (!isCorrect) setShowCorrection(true);
    processAnswer(isCorrect, srsData, mode, settings);
  }, [isAnimating, typingInput, currentQuestion, processAnswer, srsData, mode, settings]);

  // ─── 手寫進度紀錄（與主測驗 SRS 共用邏輯） ───
  const recordWritingProgress = useCallback((romaji, isCorrect) => {
    updateDailyStats(romaji, isCorrect, getTodayKey());
    setSrsData(prev => {
      const newItem = computeSRS(prev[romaji], isCorrect);
      return { ...prev, [romaji]: newItem };
    });
  }, [updateDailyStats, setSrsData]);

  // ─── 答案按鈕樣式 ───
  const getButtonStyle = useCallback((option) => {
    if (!selectedAnswer) {
      return 'bg-white hover:bg-rose-50 text-slate-950 border-2 border-slate-200 hover:border-rose-300';
    }
    if (option.romaji === currentQuestion?.romaji) {
      return 'bg-green-100 text-green-800 border-2 border-green-500 scale-105 shadow-md';
    }
    if (option.romaji === selectedAnswer.romaji) {
      return 'bg-red-100 text-red-800 border-2 border-red-400 opacity-70';
    }
    return 'bg-white text-slate-600 border-2 border-slate-100 opacity-50';
  }, [selectedAnswer, currentQuestion]);

  return {
    // 狀態
    mode,
    currentQuestion,
    options,
    selectedAnswer,
    isAnimating,
    showCorrection,
    setShowCorrection,
    typingInput,
    setTypingInput,
    // 函式
    playAudio,
    startGame,
    handleAnswerClick,
    handleTypingSubmit,
    recordWritingProgress,
    generateNextQuestion,
    getButtonStyle,
  };
}
