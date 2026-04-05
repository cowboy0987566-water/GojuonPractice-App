import { useEffect, useState } from 'react';

export const useSRS = () => {
  const [srsData, setSrsData] = useState(() => {
    try {
      const savedData = localStorage.getItem('gojuon_srs_v1');
      return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_srs_v1', JSON.stringify(srsData));
  }, [srsData]);

  const updateSRS = (romaji, isCorrect) => {
    const key = romaji;
    const item = srsData[key] || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };
    
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
    const updatedSrsData = { ...srsData, [key]: { rep, interval, ease, nextReview, mistakes, corrects } };
    setSrsData(updatedSrsData);
    return updatedSrsData;
  };

  return { srsData, updateSRS, setSrsData };
};

export const useDailyStats = () => {
  const [dailyStats, setDailyStats] = useState(() => {
    try {
      const savedData = localStorage.getItem('gojuon_daily_stats_v1');
      return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('gojuon_daily_stats_v1', JSON.stringify(dailyStats));
  }, [dailyStats]);

  const getTodayKey = (dateObj = new Date()) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const updateDailyStats = (romaji, isCorrect) => {
    const today = getTodayKey();
    setDailyStats(prev => {
      const todayStats = prev[today] || { total: 0, correct: 0, wrong: 0, wrongChars: [] };
      const newWrongChars = [...(todayStats.wrongChars || [])];
      
      if (!isCorrect && !newWrongChars.includes(romaji)) {
        newWrongChars.push(romaji);
      }
      
      return {
        ...prev,
        [today]: {
          total: todayStats.total + 1,
          correct: todayStats.correct + (isCorrect ? 1 : 0),
          wrong: todayStats.wrong + (isCorrect ? 0 : 1),
          wrongChars: newWrongChars
        }
      };
    });
  };

  return { dailyStats, updateDailyStats, getTodayKey, setDailyStats };
};
