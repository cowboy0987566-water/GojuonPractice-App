import React, { useState } from 'react';
import {
  Volume2, CheckCircle2, XCircle,
  Eye, EyeOff, Users, Settings2, X,
} from 'lucide-react';
import { DT } from './DT';
import { getTodayKey } from '../data/kanaData';

/**
 * QuizScreen — 答題畫面
 *
 * 將原本在 App.jsx 中 `{isPlaying && currentQuestion && (…)}` 的整段 JSX 萃取為獨立元件。
 * showQuickSettings 為本元件自身的 UI 狀態，不需要傳出到 App 層。
 */
export const QuizScreen = ({
  currentQuestion,
  options,
  selectedAnswer,
  isAnimating,
  showCorrection,
  setShowCorrection,
  mode,
  settings,
  setSettings,
  dailyStats,
  typingInput,
  setTypingInput,
  handleAnswerClick,
  handleTypingSubmit,
  generateNextQuestion,
  srsData,
  playAudio,
  availableVoices,
  getButtonStyle,
  t,
}) => {
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  if (!currentQuestion) return null;

  // 模式標籤（顯示於統計列）
  const modeLabel =
    mode === 'recognition'    ? (settings.targetKana === 'hira' ? '平→片' : '片→平') :
    mode === 'audio-to-kana'  ? '聽音' :
    mode === 'romaji-to-kana' ? '羅→假片' :
    mode === 'kana-to-romaji' ? '假片→羅' :
    mode === 'typing'         ? '拼寫' : mode;

  return (
    <div className="flex flex-col h-full relative">

      {/* ── 今日統計 & 快速設定入口 ── */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center">
          <span className="px-2 border-r-2 border-slate-100 pr-4">
            <DT tKey="mode" settings={settings} flexCol={false} spanClass="text-[0.65rem] text-slate-600 font-bold mb-0.5 block" />
            <span className="text-sm font-bold text-slate-950 leading-none">{modeLabel}</span>
          </span>
          <div className="flex gap-4 px-4">
            {['tot', 'corCount', 'wrgCount'].map((key, i) => {
              const val = dailyStats[getTodayKey()]?.[(i === 0 ? 'total' : i === 1 ? 'correct' : 'wrong')] || 0;
              const colors = ['text-slate-950', 'text-green-600', 'text-red-500'];
              return (
                <div key={key} className="flex flex-col items-center">
                  <DT
                    tKey={key}
                    settings={settings}
                    flexCol={false}
                    spanClass={`text-[0.65rem] font-bold mb-0.5 ${i === 1 ? 'text-green-500/80' : i === 2 ? 'text-red-400' : 'text-slate-600'}`}
                  />
                  <span className={`text-sm font-bold leading-none ${colors[i]}`}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setShowQuickSettings(!showQuickSettings)}
          className={`p-2 rounded-xl transition-colors ${showQuickSettings ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* ── 快速設定面板 (Overlay) ── */}
      {showQuickSettings && (
        <div className="absolute top-14 left-0 right-0 z-[60] bg-white border-2 border-rose-100 rounded-3xl shadow-2xl p-5 m-2 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <Settings2 size={16} />
              <DT tKey="setTitle" settings={settings} flexCol={false} />
            </h3>
            <button
              onClick={() => setShowQuickSettings(false)}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-6">
            {/* 錯誤提示時間 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <DT tKey="ed" settings={settings} spanClass="text-sm font-bold text-slate-900" />
                <span className="text-sm font-black text-rose-500">
                  {settings.errorDisplayTime === 0 ? t('manual') : `${settings.errorDisplayTime}s`}
                </span>
              </div>
              <input
                type="range" min="0" max="10" step="1"
                value={settings.errorDisplayTime}
                onChange={e => setSettings({ ...settings, errorDisplayTime: parseInt(e.target.value) })}
                className="w-full accent-rose-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 重複間隔時間（僅在重複發音模式下顯示） */}
            {settings.audioMode === 'repeat' && (
              <div className="pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <DT tKey="ai" settings={settings} spanClass="text-sm font-bold text-indigo-600" />
                  <span className="text-sm font-black text-indigo-500">{settings.audioInterval}s</span>
                </div>
                <input
                  type="range" min="1" max="5" step="1"
                  value={settings.audioInterval}
                  onChange={e => setSettings({ ...settings, audioInterval: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 h-2 bg-indigo-50 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* 測驗目標切換 */}
            <div className="pt-2 border-t border-slate-50">
              <div className="text-sm font-bold text-slate-900 mb-2">
                <DT tKey="tgtTitle" settings={settings} flexCol={false} />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {['hira', 'kata'].map(tk => (
                  <button
                    key={tk}
                    onClick={() => setSettings({ ...settings, targetKana: tk })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.targetKana === tk ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <DT tKey={tk === 'hira' ? 'tgtHira' : 'tgtKata'} settings={settings} flexCol={false} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 題目顯示區 ── */}
      <div className="flex flex-col items-center justify-center flex-grow mb-4 min-h-[140px] relative">
        {/* 答對/答錯即時回饋 */}
        {selectedAnswer && !showCorrection && (
          <div className={`absolute top-0 flex items-center gap-2 font-bold ${selectedAnswer.romaji === currentQuestion.romaji ? 'text-green-500' : 'text-red-500'}`}>
            {selectedAnswer.romaji === currentQuestion.romaji
              ? <><CheckCircle2 size={24} /> <DT tKey="cor" settings={settings} flexCol={false} spanClass="leading-tight" /></>
              : <><XCircle size={24} /> <DT tKey="wrg" settings={settings} flexCol={false} spanClass="leading-tight" /></>
            }
          </div>
        )}

        {/* 聽音模式：大圓形播放按鈕 */}
        {mode === 'audio-to-kana' && (
          <div
            onClick={() => playAudio(currentQuestion.katakana)}
            className="flex flex-col items-center justify-center bg-indigo-50 w-32 h-32 rounded-full border-4 border-indigo-100 shadow-inner mb-2 cursor-pointer active:scale-95 transition-transform hover:bg-indigo-100 mt-2"
          >
            <Volume2 size={48} className="text-indigo-400" />
          </div>
        )}

        {/* 其他模式：顯示假名/羅馬字 */}
        {mode !== 'audio-to-kana' && (
          <div className={`${mode === 'romaji-to-kana' ? 'text-[4.5rem] uppercase tracking-widest text-indigo-600' : 'text-[4.5rem] sm:text-[5rem] text-slate-950'} font-bold leading-none mt-4 mb-2`}>
            {mode === 'romaji-to-kana'
              ? currentQuestion.romaji
              : settings.targetKana === 'hira' ? currentQuestion.hiragana : currentQuestion.katakana}
          </div>
        )}

        {/* 羅馬字提示 */}
        {settings.showRomaji && mode !== 'romaji-to-kana' && mode !== 'kana-to-romaji' && mode !== 'typing' && (
          <div className="text-xl font-bold text-slate-600 mb-2 uppercase tracking-widest">{currentQuestion.romaji}</div>
        )}

        {/* 播放 & 語音切換按鈕 */}
        <div className="flex items-center gap-2 mt-2">
          {mode !== 'audio-to-kana' && (
            <button
              onClick={() => playAudio(currentQuestion.katakana)}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors active:scale-95 shadow-sm"
            >
              <Volume2 size={18} />
              <DT tKey="pa" settings={settings} flexCol={false} spanClass="font-semibold text-sm" />
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

        {/* 顯示/隱藏羅馬字切換鈕 */}
        <button
          onClick={() => setSettings({ ...settings, showRomaji: !settings.showRomaji })}
          className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 text-[0.8rem] font-bold shadow-sm ${settings.showRomaji ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'}`}
        >
          {settings.showRomaji ? <EyeOff size={14} /> : <Eye size={14} />}
          <DT tKey="sr" settings={settings} flexCol={false} />
        </button>
      </div>

      {/* ── 答錯提示 ── */}
      {showCorrection && (
        <button
          onClick={() => {
            if (settings.errorDisplayTime === 0) {
              setShowCorrection(false);
              setTypingInput('');
              generateNextQuestion(mode, srsData, settings);
            }
          }}
          className={`w-full bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex flex-col items-center mb-4 shadow-md flex-shrink-0 ${settings.errorDisplayTime === 0 ? 'cursor-pointer hover:bg-red-100' : 'cursor-default'}`}
        >
          <div className="text-red-600 font-bold mb-1 flex items-center gap-1"><XCircle size={16} /> {t('ca')}</div>
          <div className="text-4xl font-black text-red-700">
            {mode === 'recognition'
              ? (settings.targetKana === 'hira' ? currentQuestion.katakana : currentQuestion.hiragana)
              : mode === 'audio-to-kana' || mode === 'romaji-to-kana'
                ? (settings.targetKana === 'hira' ? currentQuestion.hiragana : currentQuestion.katakana)
                : currentQuestion.romaji}
          </div>
          {settings.showRomaji && mode !== 'kana-to-romaji' && mode !== 'typing' && (
            <div className="text-lg text-red-500/80 font-bold mt-1 uppercase tracking-widest">{currentQuestion.romaji}</div>
          )}
        </button>
      )}

      {/* ── 選項 / 輸入框 ── */}
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
            <button
              type="submit"
              disabled={isAnimating || !typingInput.trim()}
              className="w-full bg-rose-500 text-white font-bold p-4 rounded-2xl disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-95 transition-all text-lg shadow-sm"
            >
              <DT tKey="submit" settings={settings} flexCol={false} />
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
                <button
                  key={`${currentQuestion.romaji}-${opt.romaji}-${idx}`}
                  onClick={() => handleAnswerClick(opt)}
                  disabled={isAnimating}
                  className={`text-3xl sm:text-4xl font-medium p-5 sm:p-6 rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center tracking-widest ${getButtonStyle(opt)}`}
                >
                  {mode === 'kana-to-romaji'
                    ? <span className="font-bold text-xl sm:text-2xl tracking-widest">{displayTxt}</span>
                    : displayTxt}
                </button>
              );
            })}
          </div>
        )}

        {/* 手動翻頁覆蓋層（errorDisplayTime === 0 時） */}
        {showCorrection && settings.errorDisplayTime === 0 && (
          <div
            onClick={() => {
              setShowCorrection(false);
              setTypingInput('');
              generateNextQuestion(mode, srsData, settings);
            }}
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-white/40 backdrop-blur-[2px] rounded-2xl"
          >
            <div className="bg-rose-500 text-white px-5 py-3 rounded-full font-bold shadow-lg animate-bounce text-sm">
              {t('tapCont')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
