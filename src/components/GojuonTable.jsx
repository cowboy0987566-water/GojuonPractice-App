import React from 'react';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { DT } from './DT';
import { kanaData, tableLayout } from '../data/kanaData';

const KanaCell = ({ romajiKey, srsData, tableDisplay, playAudio }) => {
  if (!romajiKey) return <div className="p-1"></div>;
  const kana = kanaData.find(k => k.romaji === romajiKey);
  if (!kana) return <div className="p-1"></div>;

  const stats = srsData[romajiKey] || { mistakes: 0, corrects: 0 };
  const hasDisplay = tableDisplay.hiragana || tableDisplay.katakana || tableDisplay.romaji;

  return (
    <button
      onClick={() => playAudio(kana.katakana)}
      className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 shadow-sm transition-all active:scale-95 min-h-[4rem]"
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

export const GojuonTable = ({ srsData, tableDisplay, setTableDisplay, playAudio, settings }) => {
  return (
    <div className="flex flex-col flex-grow">
      <div className="flex flex-wrap justify-center gap-2 mb-6 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
        {['hiragana', 'katakana', 'romaji', 'stats'].map(type => (
          <button
            key={type}
            onClick={() => setTableDisplay(prev => ({...prev, [type]: !prev[type]}))}
            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${tableDisplay[type] ? 'bg-rose-100 text-rose-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <DT tKey={{hiragana:'tbHira', katakana:'tbKata', romaji:'tbRoma', stats:'tbStats'}[type]} settings={settings} flexCol={false} spanClass="leading-tight"/>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-rose-400 rounded-full"></div><DT tKey="grpBasic" settings={settings} spanClass="font-bold text-slate-700" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {tableLayout.seion.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} />))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-indigo-400 rounded-full"></div><DT tKey="rowDakuon" settings={settings} spanClass="font-bold text-slate-700" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {tableLayout.dakuon.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} />))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-amber-400 rounded-full"></div><DT tKey="rowYoon" settings={settings} spanClass="font-bold text-slate-700" flexCol={false} /></div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[80%]">
          {tableLayout.yoon.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} />))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-emerald-400 rounded-full"></div><DT tKey="grpSoku" settings={settings} spanClass="font-bold text-slate-700" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2"><KanaCell romajiKey="xtsu" srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} /></div>
      </div>
    </div>
  );
};
