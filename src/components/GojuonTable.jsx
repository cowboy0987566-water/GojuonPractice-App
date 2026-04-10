import React from 'react';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { DT } from './DT';
import { kanaData, tableLayout } from '../data/kanaData';

const KanaCell = ({ romajiKey, srsData, tableDisplay, playAudio }) => {
  if (!romajiKey) return <div className="p-1"></div>;
  const kana = kanaData.find(k => k.romaji === romajiKey);
  if (!kana) return <div className="p-1"></div>;

  const stats = srsData[romajiKey] || { mistakes: 0, corrects: 0 };
  
  return (
    <button
      onClick={() => playAudio(kana.katakana)}
      className="flex flex-col w-full active:scale-95 transition-transform hover:opacity-85 shadow-sm"
      title="播放發音"
    >
      <div className="w-full aspect-[4/5] bg-[#b1eee4] flex flex-col px-1.5 py-1">
        <div className="flex-1 flex items-center justify-center">
          {tableDisplay.hiragana && <span className="text-2xl sm:text-3xl font-medium text-slate-900">{kana.hiragana}</span>}
        </div>
        <div className="flex justify-between items-end w-full leading-none mt-1">
          <span className="text-sm font-medium text-slate-700">{tableDisplay.katakana ? kana.katakana : '\u00A0'}</span>
          <span className="text-sm font-medium text-slate-700">{tableDisplay.romaji ? kana.romaji : '\u00A0'}</span>
        </div>
      </div>
      <div className="h-7 sm:h-8 w-full bg-[#52bfb2] flex items-center px-1.5">
        <Volume2 size={18} className="text-[#0e6157]" fill="currentColor" strokeWidth={1} />
      </div>
      
      {tableDisplay.stats && (
        <div className="flex gap-1 py-1 px-1 w-full bg-white justify-center border-x border-b border-slate-100">
          <div className="flex items-center gap-0.5 text-green-600 text-[0.65rem] font-bold">
             <CheckCircle2 size={10} /> <span>{stats.corrects || 0}</span>
          </div>
          <div className="flex items-center gap-0.5 text-rose-500 text-[0.65rem] font-bold ml-1">
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
            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${tableDisplay[type] ? 'bg-rose-100 text-rose-700 shadow-inner' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <DT tKey={{hiragana:'tbHira', katakana:'tbKata', romaji:'tbRoma', stats:'tbStats'}[type]} settings={settings} flexCol={false} spanClass="leading-tight"/>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-rose-400 rounded-full"></div><DT tKey="grpBasic" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {tableLayout.seion.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} />))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-indigo-400 rounded-full"></div><DT tKey="rowDakuon" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {tableLayout.dakuon.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} />))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-amber-400 rounded-full"></div><DT tKey="rowYoon" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[80%]">
          {tableLayout.yoon.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} />))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-emerald-400 rounded-full"></div><DT tKey="grpSoku" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2"><KanaCell romajiKey="xtsu" srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} /></div>
      </div>
    </div>
  );
};
