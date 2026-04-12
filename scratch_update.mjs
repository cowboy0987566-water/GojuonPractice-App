import fs from 'fs';

const lines = fs.readFileSync('/Users/mywater888gmail.com/Library/Mobile Documents/com~apple~CloudDocs/ 50音單字.txt', 'utf-8').split('\n').filter(l => l.trim().length > 0);

const vocabMap = {};
for (const line of lines) {
  if (line.includes('單字【漢字】') || line.includes('Dakuon') || line.includes('Yōon')) continue;
  
  const parts = line.split(',');
  if (parts.length < 2) continue;

  const kanaPart = parts[0].trim();
  const kanas = kanaPart.split('/').map(k => k.trim());
  
  const parseWordLine = (wstr) => {
     if (!wstr) return null;
     const trimmed = wstr.trim();
     if (trimmed.includes('極少使用') || trimmed.includes('無開頭名詞') || trimmed.includes('常用文本') || trimmed.includes('極少見')) return null;
     
     // Expected format: "單字【漢字】 (翻譯) 符號：例句 (翻譯)"
     const colonIndex = trimmed.indexOf('：');
     if (colonIndex === -1) {
       return { word: trimmed, sentence: '', translation: '' };
     }

     const wordPart = trimmed.substring(0, colonIndex).trim();
     const sentencePart = trimmed.substring(colonIndex + 1).trim();

     // Sentence might have translation in parentheses
     const transMatch = sentencePart.match(/^([^(]+)\(([^)]+)\)$/);
     const sentence = transMatch ? transMatch[1].trim() : sentencePart;
     const translation = transMatch ? transMatch[2].trim() : '';

     return {
       word: wordPart,
       sentence: sentence,
       translation: translation
     };
  };

  const words = [];
  for (let i = 1; i < parts.length; i++) {
    const w = parseWordLine(parts[i]);
    if (w) words.push(w);
  }

  if (words.length > 0) {
    kanas.forEach(k => {
      vocabMap[k] = words;
    });
  }
}

const content = `export const kanaVocab = ${JSON.stringify(vocabMap, null, 2)};\n`;
fs.writeFileSync('/Users/mywater888gmail.com/GojuonPractice/src/data/kanaVocab.js', content, 'utf-8');
console.log('done');
