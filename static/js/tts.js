// Japanese Text-to-Speech helper using browser Web Speech API.

let cachedJaVoice = null;

function loadVoices() {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    };
  });
}

async function getJapaneseVoice() {
  if (cachedJaVoice) return cachedJaVoice;
  const voices = await loadVoices();
  cachedJaVoice =
    voices.find((v) => v.lang === "ja-JP" && v.name.includes("Kyoko")) ||
    voices.find((v) => v.lang === "ja-JP") ||
    voices.find((v) => v.lang && v.lang.startsWith("ja"));
  return cachedJaVoice;
}

async function speakJapanese(text, rate = 0.9) {
  if (!text) return;
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = rate;
  utter.pitch = 1;
  const voice = await getJapaneseVoice();
  if (voice) utter.voice = voice;
  speechSynthesis.speak(utter);
}

// Pre-warm voices on first user interaction (some browsers need this).
window.addEventListener("click", () => loadVoices(), { once: true });
