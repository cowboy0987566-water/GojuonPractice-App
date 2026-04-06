const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. imports
code = code.replace(/import \{ Volume2.*?\} from 'lucide-react';/, "import { Volume2, Play, CheckCircle2, XCircle, CalendarDays, ChevronLeft, ChevronRight, Zap, Globe, Eye, EyeOff, Edit2, KeyRound } from 'lucide-react';");

// 2. Add typingInput state
code = code.replace(/const \[showCorrection, setShowCorrection\] = useState\(false\);/, "const [showCorrection, setShowCorrection] = useState(false);\n  const [typingInput, setTypingInput] = useState('');");

// 3. processAnswer helper
const answerLogic = `
  const processAnswer = (isCorrect, currentSrsData) => {
    updateDailyStats(currentQuestion.romaji, isCorrect, getTodayKey());
    const key = currentQuestion.romaji;
    const item = currentSrsData[key] || { rep: 0, interval: 0, ease: 2.5, nextReview: 0, mistakes: 0, corrects: 0 };
    let grade = isCorrect ? 4 : 0;
    let { rep, interval, ease, mistakes, corrects = 0 } = item;
    if (isCorrect) {
      interval = rep === 0 ? 1 : rep === 1 ? 6 : Math.round(interval * ease);
      rep += 1; corrects += 1;
    } else { rep = 0; interval = 1; mistakes += 1; }
    ease = Math.max(1.3, ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    const updatedSrs = { ...currentSrsData, [key]: { rep, interval, ease, nextReview, mistakes, corrects } };
    setSrsData(updatedSrs);

    if (isCorrect) {
      setTimeout(() => { setShowCorrection(false); setTypingInput(''); generateNextQuestion(mode, updatedSrs, settings); }, 1200);
    } else if (settings.errorDisplayTime > 0) {
      setTimeout(() => { setShowCorrection(false); setTypingInput(''); generateNextQuestion(mode, updatedSrs, settings); }, settings.errorDisplayTime * 1000);
    }
  };

  const handleAnswerClick = (option) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedAnswer(option);
    const isCorrect = option.romaji === currentQuestion.romaji;
    if (!isCorrect) setShowCorrection(true);
    processAnswer(isCorrect, srsData);
  };

  const handleTypingSubmit = (e) => {
    if (e) e.preventDefault();
    if (isAnimating || !typingInput.trim()) return;
    setIsAnimating(true);
    const inputClean = typingInput.trim().toLowerCase();
    const isCorrect = (inputClean === currentQuestion.romaji);
    setSelectedAnswer({ romaji: inputClean });
    if (!isCorrect) setShowCorrection(true);
    processAnswer(isCorrect, srsData);
  };
`;

const handleAnswerClickOldRegex = /const handleAnswerClick = \([^)]+\) => \{[\s\S]*?\}\s*else if \(settings\.errorDisplayTime > 0\) \{[\s\S]*?\}\s*\};/;
code = code.replace(handleAnswerClickOldRegex, answerLogic.trim());

// 4. startGame clear typing input
code = code.replace(/setGameState\('playing'\);\n\s*setShowCorrection\(false\);/, "setGameState('playing');\n    setShowCorrection(false);\n    setTypingInput('');");


fs.writeFileSync('src/App.jsx.bak1', code);
console.log('App.jsx logic patch step 1 complete.');
