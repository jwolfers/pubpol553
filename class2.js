(() => {
  const screens = [...document.querySelectorAll(".screen")];
  const previousButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const fullscreenButton = document.getElementById("fullscreen");
  const screenLabel = document.getElementById("screen-label");
  const screenCount = document.getElementById("screen-count");
  const screenTime = document.getElementById("screen-time");
  const timer = document.getElementById("timer");
  const timerValue = document.getElementById("timer-value");
  const timerToggle = document.getElementById("timer-toggle");
  const timerReset = document.getElementById("timer-reset");

  let index = 0;
  let remaining = 0;
  let interval = null;

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const stopTimer = () => {
    if (interval) window.clearInterval(interval);
    interval = null;
    timerToggle.textContent = "Start";
  };

  const resetTimer = () => {
    stopTimer();
    remaining = Number(screens[index].dataset.timer || 0);
    timerValue.textContent = formatTime(remaining);
  };

  const toggleTimer = () => {
    if (interval) {
      stopTimer();
      return;
    }
    if (remaining <= 0) resetTimer();
    timerToggle.textContent = "Pause";
    interval = window.setInterval(() => {
      remaining -= 1;
      timerValue.textContent = formatTime(Math.max(remaining, 0));
      if (remaining <= 0) stopTimer();
    }, 1000);
  };

  const showScreen = (nextIndex) => {
    index = Math.max(0, Math.min(screens.length - 1, nextIndex));
    screens.forEach((screen, screenIndex) => screen.classList.toggle("active", screenIndex === index));
    screenLabel.textContent = screens[index].dataset.label || "";
    screenTime.textContent = screens[index].dataset.time || "";
    screenCount.textContent = `${index + 1} / ${screens.length}`;
    timer.hidden = !screens[index].dataset.timer;
    resetTimer();
    previousButton.disabled = index === 0;
    nextButton.disabled = index === screens.length - 1;
  };

  previousButton.addEventListener("click", () => showScreen(index - 1));
  nextButton.addEventListener("click", () => showScreen(index + 1));
  timerToggle.addEventListener("click", toggleTimer);
  timerReset.addEventListener("click", resetTimer);

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_error) {
      fullscreenButton.textContent = "Full screen unavailable";
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditing = target instanceof HTMLElement && (
      target.matches("input, button, select, textarea") || target.isContentEditable
    );
    if (isEditing) return;

    if (["ArrowRight", "PageDown", "Enter"].includes(event.key) || (event.key === " " && !event.shiftKey)) {
      event.preventDefault();
      showScreen(index + 1);
    }
    if (["ArrowLeft", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey)) {
      event.preventDefault();
      showScreen(index - 1);
    }
    if (event.key.toLowerCase() === "f") fullscreenButton.click();
    if (event.key.toLowerCase() === "t" && !timer.hidden) toggleTimer();
    if (event.key === "Home") showScreen(0);
    if (event.key === "End") showScreen(screens.length - 1);
  });

  const rows = [...document.querySelectorAll("[data-demand-row]")];
  const plotButton = document.getElementById("plot-demand");
  const hideButton = document.getElementById("hide-demand");
  const resetButton = document.getElementById("reset-demand");
  const message = document.getElementById("builder-message");
  const chartCover = document.getElementById("chart-cover");
  const chartGrid = document.getElementById("chart-grid");
  const chartData = document.getElementById("chart-data");
  const chartDescription = document.getElementById("chart-desc");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const defaultPrices = [50, 40, 30, 20, 10, 5];

  const createSvg = (name, attributes = {}, text = "") => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text) element.textContent = text;
    return element;
  };

  const clearInvalid = () => {
    rows.forEach((row) => {
      row.querySelector(".price-input").classList.remove("invalid-input");
      row.querySelector(".quantity-input").classList.remove("invalid-input");
    });
  };

  const setMessage = (text, kind = "") => {
    message.textContent = text;
    message.className = `builder-message${kind ? ` ${kind}` : ""}`;
  };

  const readSchedule = () => {
    clearInvalid();
    const schedule = rows.map((row) => {
      const priceInput = row.querySelector(".price-input");
      const quantityInput = row.querySelector(".quantity-input");
      return {
        price: priceInput.value === "" ? NaN : Number(priceInput.value),
        quantity: quantityInput.value === "" ? NaN : Number(quantityInput.value),
        priceInput,
        quantityInput
      };
    });

    const missing = schedule.filter(({ price, quantity }) => !Number.isFinite(price) || !Number.isFinite(quantity));
    if (missing.length) {
      missing.forEach(({ price, quantity, priceInput, quantityInput }) => {
        if (!Number.isFinite(price)) priceInput.classList.add("invalid-input");
        if (!Number.isFinite(quantity)) quantityInput.classList.add("invalid-input");
      });
      setMessage("Enter a price and a headcount in every row.", "error");
      return null;
    }

    const invalidNumbers = schedule.filter(({ price, quantity }) => price < 0 || quantity < 0 || !Number.isInteger(quantity));
    if (invalidNumbers.length) {
      invalidNumbers.forEach(({ price, quantity, priceInput, quantityInput }) => {
        if (price < 0) priceInput.classList.add("invalid-input");
        if (quantity < 0 || !Number.isInteger(quantity)) quantityInput.classList.add("invalid-input");
      });
      setMessage("Prices must be nonnegative; headcounts must be whole, nonnegative numbers.", "error");
      return null;
    }

    for (let rowIndex = 1; rowIndex < schedule.length; rowIndex += 1) {
      if (schedule[rowIndex].price >= schedule[rowIndex - 1].price) {
        schedule[rowIndex - 1].priceInput.classList.add("invalid-input");
        schedule[rowIndex].priceInput.classList.add("invalid-input");
        setMessage("List prices from highest to lowest.", "error");
        return null;
      }
      if (schedule[rowIndex].quantity < schedule[rowIndex - 1].quantity) {
        schedule[rowIndex - 1].quantityInput.classList.add("invalid-input");
        schedule[rowIndex].quantityInput.classList.add("invalid-input");
        setMessage("As price falls, the number willing to buy should not fall. Check these counts.", "error");
        return null;
      }
    }

    return schedule;
  };

  const niceMaximum = (value, roughSteps) => {
    if (value <= 0) return roughSteps;
    const rawStep = value / roughSteps;
    const power = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / power;
    const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const step = multiplier * power;
    return Math.ceil(value / step) * step;
  };

  const drawChart = (schedule) => {
    const bounds = { left: 76, right: 696, top: 24, bottom: 405 };
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const xMaximum = niceMaximum(Math.max(...schedule.map(({ quantity }) => quantity), 1), 5);
    const yMaximum = niceMaximum(Math.max(...schedule.map(({ price }) => price), 1), 5);
    const x = (quantity) => bounds.left + (quantity / xMaximum) * width;
    const y = (price) => bounds.bottom - (price / yMaximum) * height;

    chartGrid.replaceChildren();
    chartData.replaceChildren();

    const tickCount = 5;
    for (let tick = 0; tick <= tickCount; tick += 1) {
      const xValue = (xMaximum / tickCount) * tick;
      const yValue = (yMaximum / tickCount) * tick;
      const xPosition = x(xValue);
      const yPosition = y(yValue);

      chartGrid.append(
        createSvg("line", { x1: xPosition, y1: bounds.top, x2: xPosition, y2: bounds.bottom, class: "grid-line" }),
        createSvg("text", { x: xPosition, y: bounds.bottom + 25, class: "axis-tick", "text-anchor": "middle" }, Number.isInteger(xValue) ? xValue : xValue.toFixed(1)),
        createSvg("line", { x1: bounds.left, y1: yPosition, x2: bounds.right, y2: yPosition, class: "grid-line" }),
        createSvg("text", { x: bounds.left - 12, y: yPosition + 5, class: "axis-tick", "text-anchor": "end" }, `$${Number.isInteger(yValue) ? yValue : yValue.toFixed(1)}`)
      );
    }

    chartGrid.append(
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis-line" }),
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis-line" })
    );

    let path = `M ${x(0)} ${y(schedule[0].price)}`;
    schedule.forEach(({ price, quantity }, scheduleIndex) => {
      path += ` H ${x(quantity)}`;
      if (scheduleIndex < schedule.length - 1) path += ` V ${y(schedule[scheduleIndex + 1].price)}`;
    });

    chartData.append(createSvg("path", { d: path, class: "curve-line" }));
    schedule.forEach(({ price, quantity }) => {
      chartData.append(createSvg("circle", { cx: x(quantity), cy: y(price), r: 7, class: "curve-point" }));
    });

    chartCover.classList.add("hidden");
    chartDescription.textContent = `A staircase market demand curve based on six observations. At ${schedule.map(({ price, quantity }) => `$${price}, ${quantity} hats`).join("; at ")}.`;
    setMessage(`Curve drawn from ${schedule.length} price-and-quantity plans.`, "success");
  };

  plotButton.addEventListener("click", () => {
    const schedule = readSchedule();
    if (schedule) drawChart(schedule);
  });

  hideButton.addEventListener("click", () => {
    chartCover.classList.remove("hidden");
    setMessage("Curve hidden. The numbers are still here.");
  });

  resetButton.addEventListener("click", () => {
    rows.forEach((row, rowIndex) => {
      row.querySelector(".price-input").value = defaultPrices[rowIndex];
      row.querySelector(".quantity-input").value = "";
    });
    clearInvalid();
    chartGrid.replaceChildren();
    chartData.replaceChildren();
    chartCover.classList.remove("hidden");
    chartDescription.textContent = "An empty chart until quantities are entered and the Draw curve button is pressed.";
    setMessage("Start at $50 and work down.");
    rows[0].querySelector(".quantity-input").focus();
  });

  rows.forEach((row) => {
    const priceInput = row.querySelector(".price-input");
    const quantityInput = row.querySelector(".quantity-input");
    priceInput.addEventListener("input", () => {
      quantityInput.setAttribute("aria-label", `Quantity demanded at ${priceInput.value || "this"} dollars`);
    });
  });

  showScreen(0);
})();
