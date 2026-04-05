import React from 'react';
import { DT } from './DT';
import { kanaData } from '../data/kanaData';

export const StatsView = ({ srsData, settings, t }) => {
  const getReviewText = (nextReview) => {
    if (!nextReview) return <DT tKey="nl" settings={settings} className="items-end leading-tight" />;
    const diffHours = (nextReview - Date.now()) / (1000 * 60 * 60);
    if (diffHours <= 0) return <DT tKey="tr" settings={settings} className="items-end leading-tight" />;
    if (diffHours < 24) return <div className="flex flex-col items-end leading-tight"><span>{t('ab')} {Math.ceil(diffHours)} {t('hl')}</span></div>;
    return <div className="flex flex-col items-end leading-tight"><span>{t('ab')} {Math.ceil(diffHours / 24)} {t('dl')}</span></div>;
  };

  const getSortedStats = () => {
    return kanaData.filter(k => k.romaji !== 'xtsu').map(kana => {
      const data = srsData[kana.romaji] || { mistakes: 0, corrects: 0, nextReview: 0, rep: 0 };
      return { ...kana, ...data };
    }).sort((a, b) => b.mistakes - a.mistakes || a.nextReview - b.nextReview);
  };

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-200">
        <DT tKey="ch" settings={settings} spanClass="font-bold text-slate-700 leading-tight" />
        <div className="flex gap-6 text-sm font-bold text-slate-500">
          <DT tKey="mk" settings={settings} className="w-16 items-center" />
          <DT tKey="nr" settings={settings} className="w-24 items-end" />
        </div>
      </div>
      
      <div className="space-y-2">
        {getSortedStats().map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-slate-800 w-8">{item.hiragana}</div>
              <div className="text-xl text-slate-600 w-8">{item.katakana}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">{item.romaji}</div>
            </div>
            <div className="flex gap-6 items-center">
              <div className={`w-16 text-center font-bold text-lg ${item.mistakes > 0 ? 'text-red-500 bg-red-50 py-1 rounded-lg' : 'text-slate-300'}`}>
                {item.mistakes > 0 ? item.mistakes : '-'}
              </div>
              <div className={`w-24 text-right text-xs font-medium ${(!item.nextReview || item.nextReview <= Date.now()) ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                {getReviewText(item.nextReview)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
