// LocalStorage helpers for tracking learning progress.

const STORAGE_KEY = "jp_learn_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    console.warn("Failed to load state", e);
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultState() {
  return {
    wordStats: {},   // { wordId: { correct, wrong, lastSeen, kanji, kana, meaning_zh } }
    modeStats: {},   // { modeName: { correct, wrong } }
    examHistory: [], // [{ date, score, total, durationSec }]
    streak: { lastDate: null, count: 0 },
  };
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function updateStreak(state) {
  const today = todayStr();
  const last = state.streak.lastDate;
  if (last === today) return;
  if (!last) {
    state.streak = { lastDate: today, count: 1 };
    return;
  }
  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    state.streak.count += 1;
  } else {
    state.streak.count = 1;
  }
  state.streak.lastDate = today;
}

function recordAnswer(word, correct, mode = "quiz") {
  const state = loadState();
  const id = word.id;
  if (!state.wordStats[id]) {
    state.wordStats[id] = {
      correct: 0,
      wrong: 0,
      lastSeen: null,
      kanji: word.kanji,
      kana: word.kana,
      meaning_zh: word.meaning_zh,
    };
  }
  if (correct) state.wordStats[id].correct += 1;
  else state.wordStats[id].wrong += 1;
  state.wordStats[id].lastSeen = new Date().toISOString();
  // Keep snapshot fields fresh in case the underlying word changed.
  state.wordStats[id].kanji = word.kanji;
  state.wordStats[id].kana = word.kana;
  state.wordStats[id].meaning_zh = word.meaning_zh;

  if (!state.modeStats[mode]) state.modeStats[mode] = { correct: 0, wrong: 0 };
  if (correct) state.modeStats[mode].correct += 1;
  else state.modeStats[mode].wrong += 1;

  updateStreak(state);
  saveState(state);
}

function recordExam(score, total, durationSec) {
  const state = loadState();
  state.examHistory.push({
    date: new Date().toISOString(),
    score,
    total,
    durationSec,
  });
  if (state.examHistory.length > 50) {
    state.examHistory = state.examHistory.slice(-50);
  }
  updateStreak(state);
  saveState(state);
}

function getOverallStats() {
  const state = loadState();
  let correct = 0;
  let wrong = 0;
  let wordsLearned = 0;
  for (const id in state.wordStats) {
    const w = state.wordStats[id];
    correct += w.correct;
    wrong += w.wrong;
    if (w.correct + w.wrong > 0) wordsLearned += 1;
  }
  const total = correct + wrong;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  return {
    correct,
    wrong,
    total,
    accuracy,
    wordsLearned,
    streak: state.streak.count,
    modeStats: state.modeStats,
    examHistory: state.examHistory,
  };
}

function getReviewList(limit = 20) {
  const state = loadState();
  const arr = [];
  for (const id in state.wordStats) {
    const w = state.wordStats[id];
    const total = w.correct + w.wrong;
    if (total === 0) continue;
    const accuracy = w.correct / total;
    if (w.wrong > 0 && accuracy < 0.7) {
      arr.push({
        id,
        ...w,
        accuracy: Math.round(accuracy * 100),
      });
    }
  }
  arr.sort((a, b) => a.accuracy - b.accuracy);
  return arr.slice(0, limit);
}

function resetStats() {
  localStorage.removeItem(STORAGE_KEY);
}
