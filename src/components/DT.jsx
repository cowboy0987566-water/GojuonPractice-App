import React from 'react';
import { i18n } from '../data/i18n';

export const DT = ({ tKey, settings, flexCol = true, className = "", jpClassName = "", spanClass = "" }) => {
  const t = (key, langOverride = null) => {
    const lang = langOverride || settings.uiLang;
    const dict = i18n[lang] || i18n['zh-TW'];
    return dict.t[key] || i18n['zh-TW'].t[key] || key;
  };

  const mainText = t(tKey);
  const jpText = t(tKey, 'ja');
  const showJp = settings.showJpSubtext && settings.uiLang !== 'ja' && mainText !== jpText;

  if (!flexCol) {
    return (
      <>
        <span className={spanClass}>{mainText}</span>
        {showJp && <span className={jpClassName}>{jpText}</span>}
      </>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={spanClass}>{mainText}</span>
      {showJp && <span className={`text-[0.65rem] opacity-70 mt-0.5 ${jpClassName}`}>{jpText}</span>}
    </div>
  );
};
