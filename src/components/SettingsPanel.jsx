import React from 'react';
import { Globe, Download, Share, RotateCcw } from 'lucide-react';
import { DT } from './DT';
import { i18n } from '../data/i18n';

export const SettingsPanel = ({ 
  settings, setSettings, availableVoices, t, 
  setGameState, isStandalone, deferredPrompt, handleInstallClick, isIos 
}) => {
  const clearCacheAndRestart = () => {
    if (confirm('確定要清除快取並重新啟動嗎？這將重置所有暫存資源。')) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) { registration.unregister(); }
        });
      }
      if ('caches' in window) {
        caches.keys().then(names => {
          for (let name of names) caches.delete(name);
        });
      }
      window.location.reload(true);
    }
  };

  return (
    <div className="flex flex-col flex-grow space-y-5 pb-6">
      {/* 語言選擇快捷 */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-rose-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
            <Globe size={20} />
          </div>
          <DT tKey="langBtn" settings={settings} spanClass="font-bold text-slate-950" flexCol={false} />
        </div>
        <button onClick={() => setGameState('langPicker')} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-200 transition-colors">
          {i18n[settings.uiLang]?.label || 'Language'}
        </button>
      </div>

      {/* 錯誤停留時間 */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-rose-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <DT tKey="ed" settings={settings} spanClass="font-bold text-slate-950 leading-tight" />
            <DT tKey="edD" settings={settings} spanClass="text-xs text-slate-800 mt-1" />
          </div>
          <span className="text-xl font-bold text-rose-500">{settings.errorDisplayTime === 0 ? t('manual') : `${settings.errorDisplayTime}s`}</span>
        </div>
        <input type="range" min="0" max="10" step="1" value={settings.errorDisplayTime}
          onChange={e => setSettings({...settings, errorDisplayTime: parseInt(e.target.value)})}
          className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
      </div>

      {/* 語音人聲 */}
      {availableVoices.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-rose-200">
          <DT tKey="voice" settings={settings} spanClass="font-bold text-slate-950 mb-3 block" />
          <select value={settings.selectedVoiceURI || ''} onChange={e => setSettings({...settings, selectedVoiceURI: e.target.value})}
            className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-950 font-medium focus:outline-none focus:border-rose-400 appearance-none">
            <option value="">-- {t('defVoice')} --</option>
            {availableVoices.map((v, idx) => <option key={idx} value={v.voiceURI}>{v.name}</option>)}
          </select>
        </div>
      )}

      {/* 發音模式 */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-rose-200">
        <DT tKey="am" settings={settings} spanClass="font-bold text-slate-950 mb-4 block" />
        <div className="flex flex-col space-y-2">
          {[['auto','amA'],['manual','amM'],['repeat','amR']].map(([id, tk]) => (
            <div key={id} className="flex flex-col space-y-2">
              <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${settings.audioMode === id ? 'border-rose-400 bg-rose-50' : 'border-slate-50 hover:border-slate-200'}`}>
                <input type="radio" checked={settings.audioMode === id} onChange={() => setSettings({...settings, audioMode: id})} className="hidden" />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${settings.audioMode === id ? 'border-rose-500' : 'border-slate-300'}`}>
                  {settings.audioMode === id && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />}
                </div>
                <DT tKey={tk} settings={settings} flexCol={false} spanClass={`font-medium text-sm ${settings.audioMode === id ? 'text-rose-700' : 'text-slate-900'}`} />
              </label>
              
              {id === 'repeat' && settings.audioMode === 'repeat' && (
                <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <DT tKey="ai" settings={settings} spanClass="text-xs font-bold text-rose-600" />
                    <span className="text-sm font-black text-rose-500">{settings.audioInterval}s</span>
                  </div>
                  <input type="range" min="1" max="5" step="1" value={settings.audioInterval}
                    onChange={e => setSettings({...settings, audioInterval: parseInt(e.target.value)})}
                    className="w-full accent-rose-500 h-1.5 bg-rose-100 rounded-lg appearance-none cursor-pointer" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 顯示設定開關 */}
      <div className="space-y-4">
        {[['showRomaji','sr','srD'],['showJpSubtext','sj','sjD'],['keepCustomOpen','keepCustomOpen','keepCustomOpenD']].map(([field, tk, descTk]) => (
          <div key={field} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-rose-200">
            <div className="flex-grow pr-4">
              <DT tKey={tk} settings={settings} spanClass="font-bold text-slate-950 leading-tight" />
              <DT tKey={descTk} settings={settings} spanClass="text-xs text-slate-800 mt-1" />
            </div>
            <button onClick={() => setSettings({...settings, [field]: !settings[field]})}
              className={`w-14 h-7 rounded-full relative transition-colors flex-shrink-0 ${settings[field] ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-[4px] transition-all ${settings[field] ? 'left-[32px]' : 'left-[4px]'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* PWA 安裝按鈕 */}
      {!isStandalone() && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="bg-rose-50 rounded-3xl p-6 border-2 border-rose-100 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm">
                <Download size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-950 text-lg leading-tight"><DT tKey="pwaTitle" settings={settings} flexCol={false} /></h3>
                <p className="text-xs text-slate-800 mt-0.5"><DT tKey="pwaSub" settings={settings} flexCol={false} /></p>
              </div>
            </div>

            {deferredPrompt ? (
              <button onClick={handleInstallClick} className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Download size={20} />
                <DT tKey="pwaBtn" settings={settings} flexCol={false} />
              </button>
            ) : (
              <div className="bg-white/80 p-5 rounded-2xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-sm mb-2">
                  <Share size={18} />
                  <DT tKey={isIos() ? 'pwaIos' : 'pwaTitle'} settings={settings} flexCol={false} />
                </div>
                <div className="text-sm text-slate-900 leading-relaxed font-medium bg-rose-50/50 p-3 rounded-xl">
                  <DT tKey="pwaIosStep" settings={settings} flexCol={false} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 緊急修復區塊 */}
      <div className="mt-4 pt-4 border-t border-slate-100 mb-10">
        <div className="bg-slate-100 rounded-3xl p-6 border-2 border-slate-200">
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-950 text-sm leading-tight mb-1">
              <DT tKey="clearCache" settings={settings} flexCol={false} />
            </h3>
            <button onClick={clearCacheAndRestart} className="w-full mt-3 py-3 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-rose-500 hover:border-rose-200">
              <RotateCcw size={16} />
              <DT tKey="clearCacheBtn" settings={settings} flexCol={false} spanClass="text-xs" />
            </button>
            <p className="mt-2 text-[0.7rem] text-slate-600 leading-tight">
              <DT tKey="clearCacheSub" settings={settings} flexCol={false} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
