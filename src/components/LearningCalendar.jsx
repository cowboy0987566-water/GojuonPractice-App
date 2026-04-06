import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, XCircle } from 'lucide-react';
import { DT } from './DT';
import { kanaData } from '../data/kanaData';

export const LearningCalendar = ({ dailyStats, selDateStr, setSelDateStr, settings, t, playAudio }) => {
  const [calMonth, setCalMonth] = useState(new Date());

  const getTodayKey = (dateObj = new Date()) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
    const days = [];
    const todayStr = getTodayKey();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="p-1"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const d = String(i).padStart(2, '0');
        const m = String(calMonth.getMonth() + 1).padStart(2, '0');
        const y = calMonth.getFullYear();
      const dateStr = `${y}-${m}-${d}`;
      const stats = dailyStats[dateStr];
      const hasData = stats && stats.total > 0;
      const isSelected = selDateStr === dateStr;
      const isToday = todayStr === dateStr;

      days.push(
        <button
          key={`day-${i}`}
          onClick={() => setSelDateStr(dateStr)}
          className={`relative p-1 rounded-xl text-sm font-bold flex flex-col items-center justify-start transition-all min-h-[4rem] pt-1.5
            ${isSelected ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-slate-100 text-slate-950'}
            ${isToday && !isSelected ? 'border-2 border-rose-400 text-rose-600' : 'border-2 border-transparent'}
          `}
        >
          <span className="leading-none mb-1">{i}</span>
          {hasData && (
            <div className="flex flex-col w-full gap-[3px] px-0.5 mt-auto mb-0.5">
              <div className={`text-[0.55rem] w-full text-center rounded py-[1.5px] font-bold ${isSelected ? 'bg-rose-600/50 text-rose-100' : 'bg-slate-200/60 text-slate-800'}`}>{stats.total}</div>
              <div className={`text-[0.55rem] w-full text-center rounded py-[1.5px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100/60 text-red-500'}`}>{stats.wrong}</div>
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
        <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}><ChevronLeft size={20} /></button>
        <div className="font-bold text-slate-950 text-lg">{calMonth.getFullYear()} - {String(calMonth.getMonth() + 1).padStart(2, '0')}</div>
        <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}><ChevronRight size={20} /></button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-600 mb-2">
          <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
        </div>
        <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
      </div>

      {selDateStr && dailyStats[selDateStr] && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-rose-100 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-400"></div>
          <h3 className="font-bold text-slate-950 mb-4 text-sm flex items-center gap-2"><CalendarDays size={18} />{selDateStr}</h3>
          
          <div className="flex justify-between gap-3 text-center">
            <div className="bg-slate-50 p-2 rounded-xl flex-1"><DT tKey="tot" settings={settings} spanClass="text-[0.65rem] text-slate-800"/><div className="text-xl font-black">{dailyStats[selDateStr].total}</div></div>
            <div className="bg-green-50 p-2 rounded-xl flex-1"><DT tKey="corCount" settings={settings} spanClass="text-[0.65rem] text-green-600"/><div className="text-xl font-black text-green-600">{dailyStats[selDateStr].correct}</div></div>
            <div className="bg-red-50 p-2 rounded-xl flex-1"><DT tKey="wrgCount" settings={settings} spanClass="text-[0.65rem] text-red-500"/><div className="text-xl font-black text-red-500">{dailyStats[selDateStr].wrong}</div></div>
          </div>

          {dailyStats[selDateStr].wrongChars?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-100 flex flex-wrap gap-2">
              {dailyStats[selDateStr].wrongChars.map(romaji => {
                const kana = kanaData.find(k => k.romaji === romaji);
                if (!kana) return null;
                return (
                  <button key={romaji} onClick={() => playAudio(kana.katakana)} className="bg-red-50 border border-red-200 px-2 py-1 rounded-lg text-sm font-bold text-slate-950">
                    {kana.hiragana} / {kana.katakana}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
