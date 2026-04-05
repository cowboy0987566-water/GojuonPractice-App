import { useState, useEffect } from 'react';

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

  const updateSRS = (romaji, isCorrect) => {
    const item = srsData[romaji] || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };
    let grade = isCorrect ? 4 : 0;
    let { rep, interval, ease, mistakes, corrects = 0 } = item;

    if (isCorrect) {
      if (rep === 0) interval = 1;
      else if (rep === 1) interval = 6;
      else interval = Math.round(interval * ease);
      rep += 1;
      corrects += 1;
    } else {
      rep = 0;
      interval = 1;
      mistakes += 1;
    }

    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    const updated = { ...srsData, [romaji]: { rep, interval, ease, nextReview, mistakes, corrects } };
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
