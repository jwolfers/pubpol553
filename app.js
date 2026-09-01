(() => {
  const screens = [...document.querySelectorAll(".screen")];
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const fullscreen = document.getElementById("fullscreen");
  const label = document.getElementById("screen-label");
  const count = document.getElementById("screen-count");
  const time = document.getElementById("screen-time");
  const timer = document.getElementById("timer");
  const timerValue = document.getElementById("timer-value");
  const timerToggle = document.getElementById("timer-toggle");
  const timerReset = document.getElementById("timer-reset");
  let index = 0;
  let remaining = 0;
  let interval = null;
  const format = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const stopTimer = () => {
    if (interval) window.clearInterval(interval);
    interval = null;
    timerToggle.textContent = "Start";
  };
  const resetTimer = () => {
    stopTimer();
    remaining = Number(screens[index].dataset.timer || 0);
    timerValue.textContent = format(remaining);
  };
  const toggleTimer = () => {
    if (interval) return stopTimer();
    if (remaining <= 0) resetTimer();
    timerToggle.textContent = "Pause";
    interval = window.setInterval(() => {
      remaining -= 1;
      timerValue.textContent = format(Math.max(remaining, 0));
      if (remaining <= 0) stopTimer();
    }, 1000);
  };
  const show = (nextIndex) => {
    index = Math.max(0, Math.min(screens.length - 1, nextIndex));
    screens.forEach((screen, i) => screen.classList.toggle("active", i === index));
    label.textContent = screens[index].dataset.label || "";
    time.textContent = screens[index].dataset.time || "";
    count.textContent = `${index + 1} / ${screens.length}`;
    timer.hidden = !screens[index].dataset.timer;
    resetTimer();
    prev.disabled = index === 0;
    next.disabled = index === screens.length - 1;
  };
  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  timerToggle.addEventListener("click", toggleTimer);
  timerReset.addEventListener("click", resetTimer);
  fullscreen.addEventListener("click", async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  });
  document.addEventListener("keydown", (event) => {
    if (["ArrowRight", "PageDown", "Enter"].includes(event.key) || (event.key === " " && !event.shiftKey)) { event.preventDefault(); show(index + 1); }
    if (["ArrowLeft", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey)) { event.preventDefault(); show(index - 1); }
    if (event.key.toLowerCase() === "f") fullscreen.click();
    if (event.key.toLowerCase() === "t" && !timer.hidden) toggleTimer();
    if (event.key === "Home") show(0);
    if (event.key === "End") show(screens.length - 1);
  });
  show(0);
})();
