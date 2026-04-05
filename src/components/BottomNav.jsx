import React from 'react';
import { Home, CalendarDays, LayoutGrid, BarChart3, Settings } from 'lucide-react';

// homeLabel: 若 t('homeBtn') 未定義，回退各語系預設文字
const homeLabels = {
  'zh-TW': '首頁', 'ja': 'ホーム', 'en': 'Home', 'zh-CN': '首页',
  'ko': '홈', 'es': 'Inicio', 'fr': 'Accueil', 'de': 'Start',
  'it': 'Home', 'pt': 'Início', 'ru': 'Главная', 'vi': 'Trang chủ',
  'th': 'หน้าหลัก', 'id': 'Beranda', 'ms': 'Utama', 'ar': 'الرئيسية',
  'hi': 'होम', 'tr': 'Ana Sayfa', 'nl': 'Start', 'pl': 'Strona'
};

const tabs = [
  { id: 'menu',     icon: Home,         labelKey: 'HOME'   },
  { id: 'calendar', icon: CalendarDays, labelKey: 'calBtn' },
  { id: 'table',    icon: LayoutGrid,   labelKey: 'tbBtn'  },
  { id: 'stats',    icon: BarChart3,    labelKey: 'stBtn'  },
  { id: 'settings', icon: Settings,     labelKey: 'setBtn' },
];

export const BottomNav = ({ activeTab, onTabChange, t, uiLang }) => {
  return (
    <nav className="flex-shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch">
        {tabs.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id;
          const label = labelKey === 'HOME' ? (homeLabels[uiLang] || homeLabels['zh-TW']) : t(labelKey);
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 gap-1 transition-all relative
                ${isActive ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600 active:text-rose-500'}`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-rose-500 rounded-full" />
              )}
              <Icon size={22} className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[0.6rem] font-bold leading-none tracking-wide ${isActive ? 'text-rose-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
