import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronLeft, ChevronRight, X, Users, Eraser, Languages } from 'lucide-react';
import { kanaData } from '../data/kanaData';
import { kanaVocab } from '../data/kanaVocab';
import { DT } from './DT';
import { KanaCanvas } from './KanaCanvas';
import { BottomNav } from './BottomNav';

export const KanaDetailView = ({ viewingKana, setViewingKana, playAudio, settings, availableVoices, t, setActiveTab }) => {
  // viewingKana is romaji string
  
  const flattedKana = kanaData.filter(k => k.romaji !== 'xtsu'); // Exclude sokuon if needed, but let's keep it safe.

  const currentIndex = flattedKana.findIndex(k => k.romaji === viewingKana);
  const currentKana = flattedKana[currentIndex] || flattedKana[0];
  
  const mainType = settings?.tableMainKana === 'kata' ? 'katakana' : 'hiragana';
  const subType = settings?.tableMainKana === 'kata' ? 'hiragana' : 'katakana';

  const words = kanaVocab[currentKana[mainType]] || [];


  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [slideDirection, setSlideDirection] = useState(null); // 'left' or 'right' for animation
  const [displayType, setDisplayType] = useState(settings?.tableMainKana === 'kata' ? 'katakana' : 'hiragana');
  const canvasRef = useRef(null);
  
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) goNext();
    if (isRightSwipe) goPrev();
  };

  const goNext = () => {
    if (currentIndex < flattedKana.length - 1) {
      setSlideDirection('left');
      setViewingKana(flattedKana[currentIndex + 1].romaji);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setSlideDirection('right');
      setViewingKana(flattedKana[currentIndex - 1].romaji);
    }
  };

  useEffect(() => {
    // Reset slide direction after animation frame
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [viewingKana]);

  // Handle parsing emoji from strings like "蟻 (あり) 🐜"
  const parseWordLine = (line) => {
    // If line is already an object, return it. If it's a legacy string, handle it.
    if (typeof line === 'object') return line;
    
    const match = line.match(/^([^(]+)\(([^)]+)\)$/);
    const sentence = match ? match[1].trim() : line;
    const translation = match ? match[2].trim() : '';
    
    return {
      word: '單字', // Placeholder for legacy strings
      sentence: sentence,
      translation: translation
    };
  };


  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col"
         onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndHandler}>
      
      {/* 頂部導航 */}
      <div className="bg-rose-500 pt-5 pb-4 px-4 text-white flex-shrink-0 flex items-center justify-between shadow-md">
        <button onClick={() => setViewingKana(null)} className="p-2 bg-rose-600/50 hover:bg-rose-600 rounded-full transition-colors active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <div className="font-black text-lg tracking-widest text-center flex-1">
          單字學習
        </div>
        <div className="w-10"></div> {/* Placeholder for centering */}
      </div>

      {/* 滑動內容區 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className={`p-6 pb-20 flex flex-col items-center min-h-full transition-transform duration-300 ${slideDirection === 'left' ? 'animate-in slide-in-from-right' : slideDirection === 'right' ? 'animate-in slide-in-from-left' : ''}`}>
          
          <div className="flex justify-between items-center w-full mb-6">
            <button onClick={goPrev} disabled={currentIndex === 0} className="p-3 bg-white text-slate-400 rounded-full shadow-sm hover:text-rose-500 disabled:opacity-30 disabled:hover:text-slate-400 z-10">
              <ChevronLeft size={24} />
            </button>
            
            {/* 假名手寫練習區 */}
            <div className="relative flex items-center justify-center group mt-4 mb-0 overflow-hidden rounded-2xl">
              <KanaCanvas 
                ref={canvasRef}
                char={currentKana[displayType]} 
                strokeColor="#1e293b" 
              />
              
              {/* 輔助標示：移入手寫板內部角落 */}
              <div className="absolute inset-x-0 bottom-2 px-3 flex justify-between items-baseline pointer-events-none select-none z-20">
                <span className="text-sm font-bold text-slate-400 bg-white/50 backdrop-blur-[2px] px-1.5 py-0.5 rounded shadow-sm border border-slate-100/50">
                  {currentKana[displayType === 'hiragana' ? 'katakana' : 'hiragana']}
                </span>
                <span className="text-sm font-black text-rose-500 uppercase tracking-wider bg-white/50 backdrop-blur-[2px] px-1.5 py-0.5 rounded shadow-sm border border-rose-100/50">
                  {currentKana.romaji}
                </span>
              </div>
            </div>

            <button onClick={goNext} disabled={currentIndex === flattedKana.length - 1} className="p-3 bg-white text-slate-400 rounded-full shadow-sm hover:text-rose-500 disabled:opacity-30 disabled:hover:text-slate-400 z-10">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* 控制按鈕區：[切換] [發音] [橡皮擦] */}
          <div className="flex items-center justify-center gap-6 mt-0 mb-6">
            {/* 1. 切換按鈕 */}
            <button 
              onClick={() => setDisplayType(prev => prev === 'hiragana' ? 'katakana' : 'hiragana')}
              className="flex items-center justify-center w-11 h-11 bg-white text-slate-600 rounded-xl shadow-sm border-2 border-slate-100 hover:border-indigo-200 hover:text-indigo-500 active:scale-90 transition-all group relative"
              title="切換平/片假名"
            >
              <div className="flex flex-col items-center leading-none">
                <span className={`text-[10px] font-bold ${displayType === 'hiragana' ? 'text-indigo-600' : 'text-slate-400'}`}>あ</span>
                <span className={`text-[10px] font-bold ${displayType === 'katakana' ? 'text-rose-600' : 'text-slate-400'}`}>ア</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-100 rounded-full p-0.5 border border-white">
                <Languages size={8} />
              </div>
            </button>

            {/* 2. 發音按鈕 */}
            <button 
              onClick={() => playAudio(currentKana[displayType])} 
              className="flex items-center justify-center w-13 h-13 bg-rose-100 text-rose-600 rounded-full shadow-md hover:bg-rose-200 active:scale-95 transition-all"
              title="播放發音"
            >
              <Volume2 size={24} />
            </button>

            {/* 3. 橡皮擦按鈕 (移到發音按鈕右邊) */}
            <button 
              onClick={() => canvasRef.current?.clear()}
              className="flex items-center justify-center w-11 h-11 bg-white text-rose-500 rounded-xl shadow-sm border-2 border-rose-100 hover:bg-rose-50 active:scale-90 transition-all"
              title="清除筆跡"
            >
              <Eraser size={20} />
            </button>
          </div>

          {/* 單字列表 */}
          <div className="w-full max-w-md space-y-4">
            
            {words.length > 0 ? words.map((item, idx) => {
              const line = parseWordLine(item);
              return (
                <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex-1 flex flex-col gap-3">
                    {/* 單字部分 */}
                    <div className="flex items-center justify-between group">
                      <div className="text-xl font-bold text-rose-600 break-words leading-tight bg-rose-50 px-2 py-1 rounded-lg">
                        {line.word}
                      </div>
                      <button onClick={() => playAudio(line.word.replace(/【[^】]+】/g, '').replace(/\([^)]+\)/g, '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ''))} 
                              className="flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 active:scale-90 transition-transform shadow-sm flex-shrink-0"
                              title="播放單字發音">

                        <Volume2 size={18} />
                      </button>
                    </div>

                    {/* 句子部分 */}
                    <div className="flex flex-col gap-1.5 pl-1 border-l-2 border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-base font-medium text-slate-800 break-words leading-snug">
                          {line.sentence}
                        </div>
                        <button onClick={() => playAudio(line.sentence.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ''))} 
                                className="flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-500 rounded-full hover:bg-indigo-100 active:scale-90 transition-transform shadow-sm flex-shrink-0"
                                title="播放句子發音">
                          <Volume2 size={16} />
                        </button>
                      </div>
                      {line.translation && (
                        <div className="text-sm font-normal text-slate-500 break-words italic pl-1">
                          {line.translation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-slate-400 font-bold bg-white rounded-2xl border-2 border-slate-100 border-dashed">
                尚無登錄單字
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 底部導覽列 */}
      <BottomNav 
        activeTab="table" 
        onTabChange={(tab) => {
          setViewingKana(null);
          setActiveTab(tab);
        }} 
        t={t} 
        uiLang={settings.uiLang} 
      />
    </div>
  );
};
