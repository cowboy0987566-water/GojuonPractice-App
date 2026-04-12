import fs from 'fs';

const lines = fs.readFileSync('/Users/mywater888gmail.com/Library/Mobile Documents/com~apple~CloudDocs/ 50音單字.txt', 'utf-8').split('\n').filter(l => l.trim().length > 0);

const vocabMap = {};

for (const line of lines) {
  if (line.includes('假名') || line.includes('Dakuon') || line.includes('Yōon')) continue;
  
  const parts = line.split(',');
  if (parts.length < 2) continue;

  const kanaPart = parts[0].trim();
  if (kanaPart.includes('極少使用') || kanaPart.includes('無開頭名詞') || kanaPart.includes('極少見')) continue;

  let hira = kanaPart.split('/')[0]?.trim();
  if (!hira) continue;

  const word1 = parts[1]?.trim();
  const word2 = parts[2]?.trim();

  const parseWord = (wstr) => {
     if (!wstr || wstr.includes('極少使用') || wstr.includes('無開頭名詞')) return null;
     return wstr;
  };

  const w1 = parseWord(word1);
  const w2 = parseWord(word2);

  const words = [];
  if (w1) words.push(w1);
  if (w2) words.push(w2);

  if (words.length > 0) {
    vocabMap[hira] = words;
  }
}

console.log(JSON.stringify(vocabMap, null, 2));
