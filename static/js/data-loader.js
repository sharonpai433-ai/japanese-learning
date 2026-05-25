// Shared helpers for loading and filtering vocab/sentences from the Flask API.

async function fetchAllVocab() {
  const res = await fetch("/api/vocab/all");
  if (!res.ok) throw new Error("Failed to load vocab");
  return res.json();
}

async function fetchSentences() {
  const res = await fetch("/api/sentences");
  if (!res.ok) throw new Error("Failed to load sentences");
  return res.json();
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const levels = (params.get("levels") || "beginner").split(",").filter(Boolean);
  const categories = (params.get("categories") || "").split(",").filter(Boolean);
  return { levels, categories };
}

// Flatten vocab data into a list of word objects with level + category metadata.
function flattenWords(vocabData, levels, categories) {
  const out = [];
  for (const level of levels) {
    const levelData = vocabData[level];
    if (!levelData) continue;
    for (const catKey in levelData.categories) {
      if (categories.length > 0 && !categories.includes(`${level}:${catKey}`)) continue;
      const cat = levelData.categories[catKey];
      for (const w of cat.words) {
        out.push({
          ...w,
          level,
          category: catKey,
          category_name_zh: cat.name_zh,
        });
      }
    }
  }
  return out;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sampleDistractors(allWords, correctWord, count) {
  const pool = allWords.filter(
    (w) => w.id !== correctWord.id && w.meaning_zh !== correctWord.meaning_zh
  );
  // Prefer same category for more useful distractors.
  const sameCategory = pool.filter((w) => w.category === correctWord.category);
  const result = [];
  const seenMeanings = new Set([correctWord.meaning_zh]);
  for (const w of shuffleInPlace([...sameCategory])) {
    if (result.length >= count) break;
    if (seenMeanings.has(w.meaning_zh)) continue;
    seenMeanings.add(w.meaning_zh);
    result.push(w);
  }
  if (result.length < count) {
    for (const w of shuffleInPlace([...pool])) {
      if (result.length >= count) break;
      if (seenMeanings.has(w.meaning_zh)) continue;
      seenMeanings.add(w.meaning_zh);
      result.push(w);
    }
  }
  return result;
}
