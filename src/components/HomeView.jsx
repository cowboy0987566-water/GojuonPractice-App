import React from 'react';
import {
  Play, Volume2, Edit2, KeyRound,
  PenLine, Zap, ChevronLeft,
} from 'lucide-react';
import { DT } from './DT';
import { rowDefs, rowGroups, colDefs, colGroups } from '../data/kanaData';

/**
 * HomeView — 首頁（選範圍 + 開始測驗）
 *
 * 將原本在 App.jsx 中 `{activeTab === 'menu' && (…)}` 的整段 JSX 萃取為獨立元件。
 */
export const HomeView = ({
  // 預設選擇
  activePreset,
  applyPreset,
  // 自訂範圍
  isCustomOpen,
  setIsCustomOpen,
  selectedRows,
  setSelectedRows,
  selectedCols,
  setSelectedCols,
  setActivePreset,
  // 設定
  settings,
  setSettings,
  // 選擇狀態
  isSelectionEmpty,
  // 開始測驗
  onStartGame,
  onStartWritingQuiz,
  // i18n
  t,
}) => {
  return (
    <div className="flex flex-col flex-grow">

      {/* ── 快速預設 ── */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-bold text-slate-950 flex items-center justify-between">
          <DT tKey="presetTitle" settings={settings} flexCol={false} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'basic',  tk: 'presetBasic' },
            { id: 'dakuon', tk: 'presetDaku'  },
            { id: 'yoon',   tk: 'presetYoon'  },
            { id: 'all',    tk: 'presetAll'   },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`py-3 bg-white border-2 font-bold rounded-xl active:scale-95 transition-all shadow-sm text-sm sm:text-base ${
                activePreset === p.id
                  ? 'border-rose-500 text-rose-600 ring-2 ring-rose-200'
                  : 'border-slate-200 text-slate-800 hover:border-rose-400 hover:text-rose-600'
              }`}
            >
              <DT tKey={p.tk} settings={settings} flexCol={false} />
            </button>
          ))}
        </div>
      </div>

      {/* ── 進階自訂範圍（折疊） ── */}
      <div className="mb-5 bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DT tKey="customRange" settings={settings} flexCol={false} spanClass="font-bold text-slate-800 text-sm" />
          </div>
          <div className="text-slate-400">
            {isCustomOpen
              ? <ChevronLeft size={18} className="-rotate-90 transition-transform" />
              : <ChevronLeft size={18} className="rotate-180 transition-transform" />}
          </div>
        </button>

        {isCustomOpen && (
          <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">

            {/* 行選擇 */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                  <DT tKey="s1" settings={settings} flexCol={false} spanClass="font-bold text-slate-700" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRows(rowDefs.map(r => r.id))}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded transition-colors"
                  >
                    <DT tKey="selAll" settings={settings} />
                  </button>
                  <button
                    onClick={() => setSelectedRows([])}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                  >
                    <DT tKey="deselAll" settings={settings} />
                  </button>
                </div>
              </div>

              {rowGroups.map((group, gIdx) => (
                <div key={gIdx} className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-1 h-3.5 rounded-full ${gIdx === 0 ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                    <DT tKey={group.tKey} settings={settings} flexCol={false} spanClass="text-xs font-bold text-slate-800" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(row => (
                      <button
                        key={row.id}
                        onClick={() => {
                          setSelectedRows(p => p.includes(row.id) ? p.filter(id => id !== row.id) : [...p, row.id]);
                          setActivePreset(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedRows.includes(row.id)
                            ? 'bg-rose-500 text-white'
                            : 'bg-white border border-slate-200 text-slate-900 hover:border-rose-300'
                        }`}
                      >
                        <DT tKey={row.tKey} settings={settings} flexCol={false} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 段選擇 */}
            <div className="mb-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                  <DT tKey="s2" settings={settings} flexCol={false} spanClass="font-bold text-slate-700" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCols(colDefs.map(c => c.id))}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                  >
                    <DT tKey="selAll" settings={settings} />
                  </button>
                  <button
                    onClick={() => setSelectedCols([])}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                  >
                    <DT tKey="deselAll" settings={settings} />
                  </button>
                </div>
              </div>

              {colGroups.map((group, gIdx) => (
                <div key={gIdx} className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-1 h-3.5 rounded-full ${gIdx === 0 ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                    <DT tKey={group.tKey} settings={settings} flexCol={false} spanClass="text-xs font-bold text-slate-800" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(col => (
                      <button
                        key={col.id}
                        onClick={() => {
                          setSelectedCols(p => p.includes(col.id) ? p.filter(id => id !== col.id) : [...p, col.id]);
                          setActivePreset(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedCols.includes(col.id)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white border border-slate-200 text-slate-900 hover:border-indigo-300'
                        }`}
                      >
                        <DT tKey={col.tKey} settings={settings} flexCol={false} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ── 練習目標切換 ── */}
      <div className="mb-6 pt-4 border-t border-slate-200">
        <div className="mb-2 text-sm font-bold text-slate-950 flex items-center justify-between">
          <DT tKey="tgtTitle" settings={settings} flexCol={false} />
          <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
            {settings.targetKana === 'hira' ? 'あかさたな...' : 'アカサタナ...'}
          </span>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-100">
          {['hira', 'kata'].map(kanaType => (
            <button
              key={kanaType}
              onClick={() => setSettings({ ...settings, targetKana: kanaType })}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                settings.targetKana === kanaType ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-800 hover:text-slate-950'
              }`}
            >
              <Zap size={14} className={settings.targetKana === kanaType ? 'text-rose-500' : 'text-slate-300'} />
              <DT tKey={kanaType === 'hira' ? 'tgtHira' : 'tgtKata'} settings={settings} flexCol={false} />
            </button>
          ))}
        </div>
      </div>

      {/* ── 開始測驗按鈕群組 ── */}
      <div className="mt-auto">
        <div className="mb-3 text-sm font-bold text-slate-900">
          <DT tKey="s3" settings={settings} flexCol={false} spanClass="leading-tight" />
        </div>

        <div className="space-y-4">
          {/* 基本測驗 */}
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              <DT tKey="grpTestBasic" settings={settings} flexCol={false} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onStartGame('recognition')}
                disabled={isSelectionEmpty}
                className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${
                  isSelectionEmpty
                    ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-start translate-y-[-1px]">
                  <span className="text-[1rem] font-bold text-slate-950 leading-tight">
                    {t(settings.targetKana === 'hira' ? 'mH2K' : 'mK2H')}
                  </span>
                </div>
                <Play size={18} className="text-slate-300 group-hover:text-rose-500" />
              </button>

              <button
                onClick={() => onStartGame('audio-to-kana')}
                disabled={isSelectionEmpty}
                className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${
                  isSelectionEmpty
                    ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm'
                }`}
              >
                <DT tKey="mAudio2Kana" settings={settings} className="items-start" spanClass="text-[1rem] font-bold text-slate-950 leading-tight" jpClassName="text-[0.6rem] text-slate-600 mt-0.5" />
                <Volume2 size={18} className="text-slate-300 group-hover:text-rose-500" />
              </button>
            </div>
          </div>

          {/* 手寫練習 */}
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">{t('grpTestWrite')}</div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onStartWritingQuiz('audio')}
                disabled={isSelectionEmpty}
                className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${
                  isSelectionEmpty
                    ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                    : 'bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-start text-left">
                  <span className={`text-[1rem] font-black leading-tight ${isSelectionEmpty ? 'text-slate-400' : 'text-rose-600'}`}>
                    🔊 {t('mWriteAudio')}
                  </span>
                  <span className="text-[0.7rem] text-slate-400 mt-0.5">{t('mWriteAudioD')}</span>
                </div>
                <Volume2 size={18} className={isSelectionEmpty ? 'text-slate-300' : 'text-rose-400 group-hover:text-rose-600'} />
              </button>

              <button
                onClick={() => onStartWritingQuiz('mixed-conversion')}
                disabled={isSelectionEmpty}
                className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${
                  isSelectionEmpty
                    ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                    : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-start text-left">
                  <span className={`text-[1rem] font-black leading-tight ${isSelectionEmpty ? 'text-slate-400' : 'text-indigo-600'}`}>
                    🔄 {t('mWriteMixed')}
                  </span>
                  <span className="text-[0.7rem] text-slate-400 mt-0.5">{t('mWriteMixedD')}</span>
                </div>
                <PenLine size={18} className={isSelectionEmpty ? 'text-slate-300' : 'text-indigo-400 group-hover:text-indigo-600'} />
              </button>
            </div>
          </div>

          {/* 進階測驗 */}
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              <DT tKey="grpTestAdv" settings={settings} flexCol={false} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'romaji-to-kana', tk: 'mRomaji2Kana', icon: KeyRound },
                { id: 'kana-to-romaji', tk: 'mKana2Romaji', icon: KeyRound },
                { id: 'typing',         tk: 'mTyping',       icon: Edit2   },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => onStartGame(m.id)}
                  disabled={isSelectionEmpty}
                  className={`w-full flex items-center justify-between px-4 py-4 border-2 rounded-xl transition-all group ${
                    isSelectionEmpty
                      ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                      : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm'
                  }`}
                >
                  <DT tKey={m.tk} settings={settings} className="items-start" spanClass="text-[1rem] font-bold text-slate-950 leading-tight" jpClassName="text-[0.6rem] text-slate-600 mt-0.5" />
                  <m.icon size={18} className={isSelectionEmpty ? 'text-slate-300' : 'text-slate-300 group-hover:text-indigo-500'} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
