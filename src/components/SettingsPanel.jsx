import React from 'react';
import { DT } from './DT';
import { i18n } from '../data/i18n';

export const SettingsPanel = ({ settings, setSettings, availableVoices, t }) => {
  return (
    <div className="flex flex-col flex-grow space-y-6">
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col mr-4">
            <DT tKey="ed" settings={settings} spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
            <div className="text-xs text-slate-500 mt-1">
              <DT tKey="edD" settings={settings} spanClass="" jpClassName="mt-0.5" />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold text-rose-500 leading-tight">
              {settings.errorDisplayTime === 0 ? t('manual') : `${settings.errorDisplayTime} s`}
            </span>
          </div>
        </div>
        <input
          type="range" min="0" max="10" step="1"
          value={settings.errorDisplayTime}
          onChange={(e) => setSettings({ ...settings, errorDisplayTime: parseInt(e.target.value) })}
          className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {availableVoices.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col space-y-4">
          <div className="flex flex-col">
            <DT tKey="voice" settings={settings} spanClass="font-bold text-slate-700 leading-tight" jpClassName="mb-1" />
            <div className="text-xs text-slate-500">
              <DT tKey="voiceD" settings={settings} flexCol={false} jpClassName="block mt-0.5 opacity-70 text-[0.65rem]" />
            </div>
          </div>
          <select
            value={settings.selectedVoiceURI || ''}
            onChange={(e) => setSettings({ ...settings, selectedVoiceURI: e.target.value })}
            className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-rose-400 appearance-none"
          >
            <option value="">-- {t('defVoice')} --</option>
            {availableVoices.map((voice, idx) => (
              <option key={idx} value={voice.voiceURI}>{voice.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col space-y-4">
        <DT tKey="am" settings={settings} spanClass="font-bold text-slate-700 leading-tight" />
        <div className="flex flex-col space-y-2">
          {['auto', 'manual', 'repeat'].map(m => (
            <label key={m} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer ${settings.audioMode === m ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}>
              <input type="radio" checked={settings.audioMode === m} onChange={() => setSettings({ ...settings, audioMode: m })} className="hidden" />
              <DT tKey={m === 'auto' ? 'amA' : m === 'manual' ? 'amM' : 'amR'} settings={settings} spanClass="text-sm font-medium" />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
        <DT tKey="sr" settings={settings} spanClass="font-bold text-slate-700" />
        <button onClick={() => setSettings({ ...settings, showRomaji: !settings.showRomaji })} className={`w-12 h-6 rounded-full ${settings.showRomaji ? 'bg-green-500' : 'bg-slate-300'}`} />
      </div>
    </div>
  );
};
