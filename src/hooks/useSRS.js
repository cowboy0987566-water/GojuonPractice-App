import { useState, useEffect } from 'react';

/**
 * computeSRS — SRS 計算純函式（單一真實來源）
 * 不依賴任何外部 state，可在任何地方安全呼叫。
 * @param {object} item  - 目前的 SRS 項目（或 undefined 表示首次）
 * @param {boolean} isCorrect - 是否答對
 * @returns {object} 新的 SRS 項目
 */
export function computeSRS(item, isCorrect) {
  const safe = item || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };
  let { rep, interval, ease, mistakes, corrects = 0 } = safe;
  const grade = isCorrect ? 4 : 0;

  if (isCorrect) {
    interval = rep === 0 ? 1 : rep === 1 ? 6 : Math.round(interval * ease);
    rep += 1;
    corrects += 1;
  } else {
    rep = 0;
    interval = 1;
    mistakes += 1;
  }

  ease = Math.max(1.3, ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { rep, interval, ease, nextReview, mistakes, corrects };
}

export const useSRS = () => {
  const [srsData, setSrsData] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_srs_v1');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_srs_v1', JSON.stringify(srsData));
  }, [srsData]);

  /**
   * updateSRS — 更新單一假名的 SRS 資料並寫回 state
   * 底層使用 computeSRS 純函式計算
   */
  const updateSRS = (romaji, isCorrect) => {
    const newItem = computeSRS(srsData[romaji], isCorrect);
    const updated = { ...srsData, [romaji]: newItem };
    setSrsData(updated);
    return updated;
  };

  return { srsData, setSrsData, updateSRS };
};

export const useDailyStats = () => {
  const [dailyStats, setDailyStats] = useState(() => {
    try {
      const saved = localStorage.getItem('gojuon_daily_stats_v1');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_daily_stats_v1', JSON.stringify(dailyStats));
  }, [dailyStats]);

  const updateDailyStats = (romaji, isCorrect, todayKey) => {
    setDailyStats(prev => {
      const todayStats = prev[todayKey] || { total: 0, correct: 0, wrong: 0, wrongChars: [] };
      const newWrongChars = [...(todayStats.wrongChars || [])];
      if (!isCorrect && !newWrongChars.includes(romaji)) newWrongChars.push(romaji);
      return {
        ...prev,
        [todayKey]: {
          total: todayStats.total + 1,
          correct: todayStats.correct + (isCorrect ? 1 : 0),
          wrong: todayStats.wrong + (isCorrect ? 0 : 1),
          wrongChars: newWrongChars
        }
      };
    });
  };

  return { dailyStats, updateDailyStats };
};
