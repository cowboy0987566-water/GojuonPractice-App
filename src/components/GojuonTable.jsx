import React from 'react';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { DT } from './DT';
import { kanaData, tableLayout } from '../data/kanaData';

const KanaCell = ({ romajiKey, srsData, tableDisplay, playAudio, settings, setViewingKana }) => {
  if (!romajiKey) return <div style={{ padding: '2px' }}></div>;
  const kana = kanaData.find(k => k.romaji === romajiKey);
  if (!kana) return <div style={{ padding: '2px' }}></div>;

  const stats = srsData[romajiKey] || { mistakes: 0, corrects: 0 };
  const fontSize = settings?.tableFontSize || 28;
  const scale = fontSize / 28;
  
  const mainKanaType = settings?.tableMainKana === 'kata' ? 'katakana' : 'hiragana';
  const subKanaType = settings?.tableMainKana === 'kata' ? 'hiragana' : 'katakana';

  return (
    <div
      className="flex flex-col w-full shadow-sm rounded-xl overflow-hidden border border-slate-200 hover:border-rose-400 bg-white transition-colors"
    >
      <button
        onClick={() => setViewingKana ? setViewingKana(kana.romaji) : playAudio(kana.katakana)}
        className="w-full bg-rose-50 flex flex-col active:bg-rose-100 transition-colors"
        style={{ padding: `${4*scale}px ${6*scale}px ${2*scale}px` }}
        title="單字學習"
      >
        <div className="flex-1 w-full flex items-center justify-center" style={{ minHeight: `${48*scale}px` }}>
          {tableDisplay[mainKanaType] && <span className="font-bold text-slate-900 leading-none" style={{ fontSize: `${fontSize}px` }}>{kana[mainKanaType]}</span>}
        </div>
        <div className="flex justify-between items-end w-full leading-none" style={{ marginTop: `${2*scale}px` }}>
          <span className="font-bold text-slate-600" style={{ fontSize: `${16.2*scale}px` }}>{tableDisplay[subKanaType] ? kana[subKanaType] : '\u00A0'}</span>
          <span className="font-bold text-rose-500 uppercase" style={{ fontSize: `${16.2*scale}px` }}>{tableDisplay.romaji ? kana.romaji : '\u00A0'}</span>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); playAudio(kana.katakana); }}
        className="w-full bg-rose-100 flex items-center justify-center active:bg-rose-200 hover:bg-rose-200 transition-colors" 
        style={{ height: `${24*scale}px`, padding: `0 ${6*scale}px` }}
        title="播放發音"
      >
        <Volume2 size={Math.max(10, 14*scale)} className="text-rose-500" />
      </button>
      
      {tableDisplay.stats && (
        <div className="flex gap-1 w-full bg-slate-50 justify-center" style={{ padding: `${4*scale}px ${4*scale}px` }}>
          <div className="flex items-center gap-0.5 text-green-600 font-bold" style={{ fontSize: `${10.4*scale}px` }}>
             <CheckCircle2 size={Math.max(8, 10*scale)} /> <span>{stats.corrects || 0}</span>
          </div>
          <div className="flex items-center gap-0.5 text-rose-500 font-bold" style={{ marginLeft: `${4*scale}px`, fontSize: `${10.4*scale}px` }}>
             <XCircle size={Math.max(8, 10*scale)} /> <span>{stats.mistakes || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const GojuonTable = ({ srsData, tableDisplay, setTableDisplay, playAudio, settings, setSettings, setViewingKana }) => {
  const scale = (settings?.tableFontSize || 28) / 28;
  const gridStyle = scale < 1 ? { gap: `${6 * scale}px` } : undefined;
  return (
    <div className="flex flex-col flex-grow">
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm mb-6 transition-all hover:border-rose-200 overflow-hidden">
        <div className="flex flex-wrap justify-center gap-2 p-3 bg-slate-50/50 border-b border-slate-100">
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

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
             <span className="text-sm font-bold text-slate-800">主要假名顯示</span>
             <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setSettings?.({...settings, tableMainKana: 'hira'})} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${settings?.tableMainKana !== 'kata' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>平假名為主</button>
               <button onClick={() => setSettings?.({...settings, tableMainKana: 'kata'})} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${settings?.tableMainKana === 'kata' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>片假名為主</button>
             </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
             <span className="text-sm font-bold text-slate-800">字體大小調整</span>
             <span className="text-sm font-bold text-rose-500">{settings?.tableFontSize || 28}px</span>
          </div>
          <input type="range" min="10" max="48" step="1" value={settings?.tableFontSize || 28}
            onChange={e => setSettings?.({...settings, tableFontSize: parseInt(e.target.value)})}
            className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-rose-400 rounded-full"></div><DT tKey="grpBasic" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2" style={gridStyle}>
          {tableLayout.seion.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} settings={settings} setViewingKana={setViewingKana} />))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-indigo-400 rounded-full"></div><DT tKey="rowDakuon" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2" style={gridStyle}>
          {tableLayout.dakuon.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} settings={settings} setViewingKana={setViewingKana} />))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-amber-400 rounded-full"></div><DT tKey="rowYoon" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[80%]" style={gridStyle}>
          {tableLayout.yoon.map((row) => row.map((col, idx) => <KanaCell key={idx} romajiKey={col} srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} settings={settings} setViewingKana={setViewingKana} />))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 pl-1"><div className="h-4 w-1 bg-emerald-400 rounded-full"></div><DT tKey="grpSoku" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} /></div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2" style={gridStyle}><KanaCell romajiKey="xtsu" srsData={srsData} tableDisplay={tableDisplay} playAudio={playAudio} settings={settings} setViewingKana={setViewingKana} /></div>
      </div>
    </div>
  );
};
