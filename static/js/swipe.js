// Touch swipe detection for flashcard-style elements.
//
// Usage:
//   attachSwipe(element, {
//     onLeft:  () => { /* swipe left  → next */ },
//     onRight: () => { /* swipe right → prev */ },
//     onUp:    () => { /* swipe up    → flip */ },
//     onDown:  () => { /* swipe down  → flip */ },
//   });
//
// A movement under SWIPE_THRESHOLD pixels is treated as a tap and lets the
// native click event fire (so existing click handlers on the card still work).
// Larger movements suppress the synthetic click that follows touchend, which
// keeps swipe and click cleanly separated.

const SWIPE_THRESHOLD = 50;      // px to register as a swipe
const SWIPE_DRIFT_MAX = 40;      // perpendicular drift allowed in main axis swipes

function attachSwipe(el, handlers) {
  if (!el || !("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let active = false;

  el.addEventListener("touchstart", (ev) => {
    if (ev.touches.length !== 1) {
      active = false;
      return;
    }
    const t = ev.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
    active = true;
  }, { passive: true });

  el.addEventListener("touchend", (ev) => {
    if (!active) return;
    active = false;
    const touch = ev.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const dt = Date.now() - startTime;
    // Anything under threshold or held too long is treated as a tap/long-press.
    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;
    if (dt > 800) return;

    let used = false;
    if (absX > absY && absY < SWIPE_DRIFT_MAX) {
      if (dx < 0 && handlers.onLeft)  { handlers.onLeft();  used = true; }
      if (dx > 0 && handlers.onRight) { handlers.onRight(); used = true; }
    } else if (absY > absX && absX < SWIPE_DRIFT_MAX) {
      if (dy < 0 && handlers.onUp)   { handlers.onUp();   used = true; }
      if (dy > 0 && handlers.onDown) { handlers.onDown(); used = true; }
    }

    if (used) {
      // Suppress the synthetic click that fires after touchend on most browsers,
      // so a swipe doesn't also trigger the card's click-to-flip handler.
      ev.preventDefault();
      const blocker = (clickEv) => {
        clickEv.stopPropagation();
        clickEv.preventDefault();
        el.removeEventListener("click", blocker, true);
      };
      el.addEventListener("click", blocker, true);
      setTimeout(() => el.removeEventListener("click", blocker, true), 400);
    }
  });

  // Prevent page-level horizontal scroll/swipe gestures from interfering.
  el.addEventListener("touchmove", (ev) => {
    if (!active || ev.touches.length !== 1) return;
    const t = ev.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      ev.preventDefault();
    }
  }, { passive: false });
}

// Make available globally
window.attachSwipe = attachSwipe;
