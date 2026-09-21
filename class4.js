(() => {
  const svgNamespace = "http://www.w3.org/2000/svg";
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

  const createSvg = (name, attributes = {}, content = "") => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (content !== "") element.textContent = content;
    return element;
  };

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const money = (value) => `$${Number(value).toFixed(2)}`;

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
    window.history.replaceState(null, "", `#screen-${index + 1}`);
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

  const forecastPriceInput = document.getElementById("forecast-price");
  const forecastTradesInput = document.getElementById("forecast-trades");
  const dealPricesInput = document.getElementById("deal-prices");
  const marketMessage = document.getElementById("market-message");
  const actualTrades = document.getElementById("actual-trades");
  const averagePrice = document.getElementById("average-price");
  const medianPrice = document.getElementById("median-price");
  const priceRange = document.getElementById("price-range");
  const showMarketResults = document.getElementById("show-market-results");
  const clearMarket = document.getElementById("clear-market");
  const buyerCountInput = document.getElementById("buyer-count");
  const sellerCountInput = document.getElementById("seller-count");

  const setMarketMessage = (message, kind = "") => {
    marketMessage.textContent = message;
    marketMessage.className = `form-message${kind ? ` ${kind}` : ""}`;
  };

  const saveMarketState = () => {
    try {
      window.localStorage.setItem("pubpol553-class4-market", JSON.stringify({
        forecastPrice: forecastPriceInput.value,
        forecastTrades: forecastTradesInput.value,
        dealPrices: dealPricesInput.value,
        buyers: buyerCountInput.value,
        sellers: sellerCountInput.value
      }));
    } catch (_error) {
      // The class still works if browser storage is unavailable.
    }
  };

  const restoreMarketState = () => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("pubpol553-class4-market") || "null");
      if (!saved) return;
      forecastPriceInput.value = saved.forecastPrice || "";
      forecastTradesInput.value = saved.forecastTrades || "";
      dealPricesInput.value = saved.dealPrices || "";
      buyerCountInput.value = saved.buyers || "12";
      sellerCountInput.value = saved.sellers || "12";
    } catch (_error) {
      // Ignore a missing or malformed saved state.
    }
  };

  const calculateMarketResults = () => {
    const tokens = dealPricesInput.value.trim().split(/[\s,;]+/).filter(Boolean);
    const prices = tokens.map(Number);
    if (!prices.length || prices.some((value) => !Number.isFinite(value) || value < 0)) {
      setMarketMessage("Enter at least one nonnegative transaction price.", "error");
      return;
    }

    const ordered = [...prices].sort((a, b) => a - b);
    const mean = prices.reduce((sum, value) => sum + value, 0) / prices.length;
    const middle = Math.floor(ordered.length / 2);
    const median = ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;

    actualTrades.textContent = String(prices.length);
    averagePrice.textContent = money(mean);
    medianPrice.textContent = money(median);
    priceRange.textContent = `${money(ordered[0])}–${money(ordered.at(-1))}`;

    const comparisons = [];
    const priceForecast = Number(forecastPriceInput.value);
    const tradeForecast = Number(forecastTradesInput.value);
    if (forecastPriceInput.value !== "" && Number.isFinite(priceForecast)) comparisons.push(`price forecast missed by ${money(Math.abs(priceForecast - mean))}`);
    if (forecastTradesInput.value !== "" && Number.isFinite(tradeForecast)) comparisons.push(`trade forecast missed by ${Math.abs(tradeForecast - prices.length)}`);
    setMarketMessage(comparisons.length ? `Results calculated. The ${comparisons.join("; the ")}.` : "Results calculated.", "success");
    saveMarketState();
  };

  showMarketResults.addEventListener("click", calculateMarketResults);
  clearMarket.addEventListener("click", () => {
    forecastPriceInput.value = "";
    forecastTradesInput.value = "";
    dealPricesInput.value = "";
    actualTrades.textContent = "?";
    averagePrice.textContent = "?";
    medianPrice.textContent = "?";
    priceRange.textContent = "?";
    setMarketMessage("Enter each deal price, separated by commas or spaces.");
    saveMarketState();
  });

  [forecastPriceInput, forecastTradesInput, dealPricesInput, buyerCountInput, sellerCountInput].forEach((element) => {
    element.addEventListener("change", saveMarketState);
  });

  const hatGrid = document.getElementById("hat-grid");
  const hatCurves = document.getElementById("hat-curves");
  const hatCover = document.getElementById("hat-cover");
  const predictedHatPrice = document.getElementById("predicted-hat-price");
  const predictedHatQuantity = document.getElementById("predicted-hat-quantity");
  const hatChartDescription = document.getElementById("hat-chart-desc");
  let hatForecastVisible = false;

  const birthdayDemand = (price, buyers) => buyers * clamp((32 - price) / 31, 0, 1);
  const birthdaySupply = (price, sellers) => sellers * clamp(price / 12, 0, 1);

  const expectedHatEquilibrium = (buyers, sellers) => {
    let low = 0;
    let high = 32;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const midpoint = (low + high) / 2;
      if (birthdayDemand(midpoint, buyers) > birthdaySupply(midpoint, sellers)) low = midpoint;
      else high = midpoint;
    }
    const price = (low + high) / 2;
    return { price, quantity: (birthdayDemand(price, buyers) + birthdaySupply(price, sellers)) / 2 };
  };

  const niceMaximum = (value, roughSteps = 5) => {
    if (value <= 0) return roughSteps;
    const rawStep = value / roughSteps;
    const power = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / power;
    const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return Math.ceil(value / (multiplier * power)) * multiplier * power;
  };

  const readParticipantCounts = () => ({
    buyers: Math.max(1, Math.round(Number(buyerCountInput.value) || 1)),
    sellers: Math.max(1, Math.round(Number(sellerCountInput.value) || 1))
  });

  const drawHatForecast = () => {
    const { buyers, sellers } = readParticipantCounts();
    buyerCountInput.value = buyers;
    sellerCountInput.value = sellers;
    const equilibrium = expectedHatEquilibrium(buyers, sellers);
    const bounds = { left: 80, right: 690, top: 24, bottom: 402 };
    const xMaximum = niceMaximum(Math.max(buyers, sellers), 5);
    const yMaximum = 32;
    const x = (quantity) => bounds.left + (quantity / xMaximum) * (bounds.right - bounds.left);
    const y = (price) => bounds.bottom - (price / yMaximum) * (bounds.bottom - bounds.top);

    hatGrid.replaceChildren();
    hatCurves.replaceChildren();

    for (let tick = 0; tick <= 5; tick += 1) {
      const quantity = (xMaximum / 5) * tick;
      const position = x(quantity);
      hatGrid.append(
        createSvg("line", { x1: position, y1: bounds.top, x2: position, y2: bounds.bottom, class: "grid-line" }),
        createSvg("text", { x: position, y: bounds.bottom + 25, class: "axis-tick", "text-anchor": "middle" }, Number.isInteger(quantity) ? quantity : quantity.toFixed(1))
      );
    }
    for (let tick = 0; tick <= 4; tick += 1) {
      const price = (yMaximum / 4) * tick;
      const position = y(price);
      hatGrid.append(
        createSvg("line", { x1: bounds.left, y1: position, x2: bounds.right, y2: position, class: "grid-line" }),
        createSvg("text", { x: bounds.left - 12, y: position + 5, class: "axis-tick", "text-anchor": "end" }, `$${price}`)
      );
    }
    hatGrid.append(
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis-line" }),
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis-line" }),
      createSvg("text", { x: (bounds.left + bounds.right) / 2, y: 460, class: "axis-label", "text-anchor": "middle" }, "Hats traded"),
      createSvg("text", { x: 18, y: 215, class: "axis-label", "text-anchor": "middle", transform: "rotate(-90 18 215)" }, "Price per hat")
    );

    const demandPath = `M ${x(0)} ${y(32)} L ${x(buyers)} ${y(1)} L ${x(buyers)} ${y(0)}`;
    const supplyPath = `M ${x(0)} ${y(0)} L ${x(sellers)} ${y(12)} L ${x(sellers)} ${y(32)}`;
    hatCurves.append(
      createSvg("path", { d: demandPath, class: "hat-demand" }),
      createSvg("path", { d: supplyPath, class: "hat-supply" }),
      createSvg("line", { x1: x(equilibrium.quantity), y1: y(equilibrium.price), x2: x(equilibrium.quantity), y2: bounds.bottom, class: "guide-line" }),
      createSvg("line", { x1: bounds.left, y1: y(equilibrium.price), x2: x(equilibrium.quantity), y2: y(equilibrium.price), class: "guide-line" }),
      createSvg("circle", { cx: x(equilibrium.quantity), cy: y(equilibrium.price), r: 9, class: "hat-equilibrium" }),
      createSvg("text", { x: x(Math.min(buyers * .25, xMaximum * .25)), y: y(24), class: "curve-label", fill: "#1167b1" }, "Demand"),
      createSvg("text", { x: x(Math.min(sellers * .62, xMaximum * .62)), y: y(9), class: "curve-label", fill: "#c74440" }, "Supply")
    );

    predictedHatPrice.textContent = money(equilibrium.price);
    predictedHatQuantity.textContent = `${equilibrium.quantity.toFixed(1)} hats`;
    hatChartDescription.textContent = `Expected demand and supply for ${buyers} buyers and ${sellers} sellers intersect near a price of ${money(equilibrium.price)} and ${equilibrium.quantity.toFixed(1)} trades.`;
    hatCover.classList.toggle("hidden", hatForecastVisible);
    updateTrialMarket();
    saveMarketState();
  };

  document.getElementById("reveal-hat-forecast").addEventListener("click", () => {
    hatForecastVisible = true;
    drawHatForecast();
  });
  document.getElementById("hide-hat-forecast").addEventListener("click", () => {
    hatForecastVisible = false;
    hatCover.classList.remove("hidden");
  });
  buyerCountInput.addEventListener("input", drawHatForecast);
  sellerCountInput.addEventListener("input", drawHatForecast);

  const trialPrice = document.getElementById("trial-price");
  const trialPriceSlider = document.getElementById("trial-price-slider");
  const trialQd = document.getElementById("trial-qd");
  const trialQs = document.getElementById("trial-qs");
  const trialState = document.getElementById("trial-state");
  const trialPressure = document.getElementById("trial-pressure");
  const marketStatePanel = trialState.closest(".market-state");

  function updateTrialMarket() {
    const { buyers, sellers } = readParticipantCounts();
    const price = clamp(Number(trialPrice.value) || 0, 0, 32);
    trialPrice.value = price;
    trialPriceSlider.value = price;
    const demanded = birthdayDemand(price, buyers);
    const supplied = birthdaySupply(price, sellers);
    const difference = demanded - supplied;
    const tolerance = Math.max(.12, Math.max(buyers, sellers) * .015);
    trialQd.textContent = demanded.toFixed(1);
    trialQs.textContent = supplied.toFixed(1);
    marketStatePanel.classList.remove("shortage", "surplus", "equilibrium");
    if (difference > tolerance) {
      trialState.textContent = "Shortage";
      trialPressure.textContent = `${difference.toFixed(1)} more hats demanded than supplied. Price pressure points up.`;
      marketStatePanel.classList.add("shortage");
    } else if (difference < -tolerance) {
      trialState.textContent = "Surplus";
      trialPressure.textContent = `${Math.abs(difference).toFixed(1)} more hats supplied than demanded. Price pressure points down.`;
      marketStatePanel.classList.add("surplus");
    } else {
      trialState.textContent = "Near equilibrium";
      trialPressure.textContent = "Buyers’ and sellers’ plans are roughly balanced.";
      marketStatePanel.classList.add("equilibrium");
    }
  }

  trialPrice.addEventListener("input", updateTrialMarket);
  trialPriceSlider.addEventListener("input", () => {
    trialPrice.value = trialPriceSlider.value;
    updateTrialMarket();
  });

  const elasticityValues = { inelastic: .35, unit: 1, elastic: 2.5 };
  const shiftSizes = { small: 6, large: 14 };
  const directionValues = { decrease: -1, none: 0, increase: 1 };
  const wbMarket = document.getElementById("wb-market");
  const wbPriceLabel = document.getElementById("wb-price-label");
  const wbQuantityLabel = document.getElementById("wb-quantity-label");
  const wbChartTitle = document.getElementById("wb-chart-title");
  const wbGrid = document.getElementById("wb-grid");
  const wbOldCurves = document.getElementById("wb-old-curves");
  const wbNewCurves = document.getElementById("wb-new-curves");
  const wbAnnotations = document.getElementById("wb-annotations");
  const workbenchCover = document.getElementById("workbench-cover");
  const workbenchResult = document.getElementById("workbench-result");
  let workbenchRevealed = false;

  const selectedValue = (attribute, name) => document.querySelector(`[${attribute}="${name}"] .selected`)?.dataset.value;
  const setSelected = (attribute, name, value) => {
    const group = document.querySelector(`[${attribute}="${name}"]`);
    if (!group) return;
    [...group.querySelectorAll("button")].forEach((button) => button.classList.toggle("selected", button.dataset.value === value));
  };

  const workbenchState = () => {
    const demandElasticity = elasticityValues[selectedValue("data-control", "demandElasticity")] || 1;
    const supplyElasticity = elasticityValues[selectedValue("data-control", "supplyElasticity")] || 1;
    const demandDirection = directionValues[selectedValue("data-control", "demandShift")] ?? 0;
    const supplyDirection = directionValues[selectedValue("data-control", "supplyShift")] ?? 0;
    const demandSize = shiftSizes[selectedValue("data-control", "demandSize")] || 6;
    const supplySize = shiftSizes[selectedValue("data-control", "supplySize")] || 6;
    return {
      demandElasticity,
      supplyElasticity,
      demandShift: demandDirection * demandSize,
      supplyShift: supplyDirection * supplySize
    };
  };

  const curvePath = (kind, elasticity, shift, xScale, yScale) => {
    const points = [];
    for (let quantity = 0; quantity <= 100; quantity += .5) {
      const price = kind === "demand"
        ? 50 - (quantity - 50 - shift) / elasticity
        : 50 + (quantity - 50 - shift) / elasticity;
      if (price >= 0 && price <= 100) points.push([xScale(quantity), yScale(price)]);
    }
    return points.map(([x, y], pointIndex) => `${pointIndex ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  };

  const changeDescription = (change) => {
    const magnitude = Math.abs(change);
    const direction = magnitude < .5 ? "little change" : change > 0 ? "rise" : "fall";
    const size = magnitude < 2 ? "none" : magnitude < 10 ? "small" : magnitude < 20 ? "moderate" : "large";
    const symbol = magnitude < .5 ? "≈" : change > 0 ? "↑" : "↓";
    return { direction, size, symbol, magnitude };
  };

  const drawWorkbench = (reveal = workbenchRevealed) => {
    workbenchRevealed = reveal;
    const state = workbenchState();
    const bounds = { left: 78, right: 688, top: 24, bottom: 444 };
    const x = (quantity) => bounds.left + (quantity / 100) * (bounds.right - bounds.left);
    const y = (price) => bounds.bottom - (price / 100) * (bounds.bottom - bounds.top);
    wbChartTitle.textContent = wbMarket.value.trim() || "Market";

    wbGrid.replaceChildren();
    wbOldCurves.replaceChildren();
    wbNewCurves.replaceChildren();
    wbAnnotations.replaceChildren();

    for (let tick = 0; tick <= 5; tick += 1) {
      const value = tick * 20;
      wbGrid.append(
        createSvg("line", { x1: x(value), y1: bounds.top, x2: x(value), y2: bounds.bottom, class: "grid-line" }),
        createSvg("line", { x1: bounds.left, y1: y(value), x2: bounds.right, y2: y(value), class: "grid-line" }),
        createSvg("text", { x: x(value), y: bounds.bottom + 24, class: "axis-tick", "text-anchor": "middle" }, value),
        createSvg("text", { x: bounds.left - 10, y: y(value) + 5, class: "axis-tick", "text-anchor": "end" }, value)
      );
    }
    wbGrid.append(
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis-line" }),
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis-line" }),
      createSvg("text", { x: (bounds.left + bounds.right) / 2, y: 502, class: "axis-label", "text-anchor": "middle" }, wbQuantityLabel.value.trim() || "Quantity"),
      createSvg("text", { x: 18, y: 232, class: "axis-label", "text-anchor": "middle", transform: "rotate(-90 18 232)" }, wbPriceLabel.value.trim() || "Price")
    );

    const demandOld = createSvg("path", {
      d: curvePath("demand", state.demandElasticity, 0, x, y),
      class: `wb-demand-old${reveal ? " wb-old-faded" : ""}`
    });
    const supplyOld = createSvg("path", {
      d: curvePath("supply", state.supplyElasticity, 0, x, y),
      class: `wb-supply-old${reveal ? " wb-old-faded" : ""}`
    });
    wbOldCurves.append(demandOld, supplyOld);

    const labelAtPrice = 66;
    const oldDemandLabelQ = 50 - state.demandElasticity * (labelAtPrice - 50);
    const oldSupplyLabelQ = 50 + state.supplyElasticity * (labelAtPrice - 50);
    wbAnnotations.append(
      createSvg("circle", { cx: x(50), cy: y(50), r: 6, class: "wb-point-old" }),
      createSvg("text", { x: x(clamp(oldDemandLabelQ, 4, 96)), y: y(labelAtPrice) - 8, class: "wb-label", fill: reveal ? "#718597" : "#1167b1" }, reveal ? "D₀" : "Demand"),
      createSvg("text", { x: x(clamp(oldSupplyLabelQ, 4, 96)), y: y(labelAtPrice) - 8, class: "wb-label", fill: reveal ? "#718597" : "#c74440" }, reveal ? "S₀" : "Supply")
    );

    if (!reveal) {
      workbenchCover.classList.remove("hidden");
      workbenchResult.hidden = true;
      return;
    }

    const priceChangePoints = (state.demandShift - state.supplyShift) / (state.demandElasticity + state.supplyElasticity);
    const quantityChangePoints = (
      state.supplyElasticity * state.demandShift + state.demandElasticity * state.supplyShift
    ) / (state.demandElasticity + state.supplyElasticity);
    const newPrice = clamp(50 + priceChangePoints, 0, 100);
    const newQuantity = clamp(50 + quantityChangePoints, 0, 100);

    wbNewCurves.append(
      createSvg("path", { d: curvePath("demand", state.demandElasticity, state.demandShift, x, y), class: "wb-demand-old wb-new" }),
      createSvg("path", { d: curvePath("supply", state.supplyElasticity, state.supplyShift, x, y), class: "wb-supply-old wb-new" })
    );

    const newDemandLabelQ = 50 + state.demandShift - state.demandElasticity * (labelAtPrice - 50);
    const newSupplyLabelQ = 50 + state.supplyShift + state.supplyElasticity * (labelAtPrice - 50);
    wbAnnotations.append(
      createSvg("line", { x1: x(newQuantity), y1: y(newPrice), x2: x(newQuantity), y2: bounds.bottom, class: "wb-projection" }),
      createSvg("line", { x1: bounds.left, y1: y(newPrice), x2: x(newQuantity), y2: y(newPrice), class: "wb-projection" }),
      createSvg("circle", { cx: x(newQuantity), cy: y(newPrice), r: 9, class: "wb-point-new" }),
      createSvg("text", { x: x(clamp(newDemandLabelQ, 4, 96)), y: y(labelAtPrice) - 8, class: "wb-label", fill: "#1167b1" }, state.demandShift ? "D₁" : "D"),
      createSvg("text", { x: x(clamp(newSupplyLabelQ, 4, 96)), y: y(labelAtPrice) - 8, class: "wb-label", fill: "#c74440" }, state.supplyShift ? "S₁" : "S")
    );

    const pricePercent = ((newPrice - 50) / 50) * 100;
    const quantityPercent = ((newQuantity - 50) / 50) * 100;
    const priceResult = changeDescription(pricePercent);
    const quantityResult = changeDescription(quantityPercent);
    workbenchResult.replaceChildren();
    const priceSpan = document.createElement("span");
    const quantitySpan = document.createElement("span");
    const adjustmentSpan = document.createElement("span");
    priceSpan.innerHTML = `Price <strong>${priceResult.symbol} ${priceResult.magnitude.toFixed(1)}%</strong> (${priceResult.size})`;
    quantitySpan.innerHTML = `Quantity <strong>${quantityResult.symbol} ${quantityResult.magnitude.toFixed(1)}%</strong> (${quantityResult.size})`;
    const mainly = Math.abs(pricePercent) > Math.abs(quantityPercent) * 1.2
      ? "mostly through price"
      : Math.abs(quantityPercent) > Math.abs(pricePercent) * 1.2
        ? "mostly through quantity"
        : "through both price and quantity";
    adjustmentSpan.textContent = `Adjustment occurs ${mainly}.`;
    workbenchResult.append(priceSpan, quantitySpan, adjustmentSpan);
    workbenchResult.hidden = false;
    workbenchCover.classList.add("hidden");
  };

  document.querySelectorAll("[data-control] button, [data-prediction] button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.parentElement;
      [...group.querySelectorAll("button")].forEach((peer) => peer.classList.toggle("selected", peer === button));
      if (group.dataset.control) drawWorkbench(false);
    });
  });

  [wbMarket, wbPriceLabel, wbQuantityLabel].forEach((input) => input.addEventListener("input", () => drawWorkbench(false)));
  document.getElementById("reveal-workbench").addEventListener("click", () => drawWorkbench(true));
  document.getElementById("hide-workbench").addEventListener("click", () => drawWorkbench(false));

  const clearPredictions = () => {
    document.querySelectorAll("[data-prediction] button").forEach((button) => button.classList.remove("selected"));
  };

  const applyPreset = (preset) => {
    if (preset === "housing-short") {
      wbMarket.value = "Rental housing after 2,000 workers arrive";
      wbPriceLabel.value = "Monthly rent";
      wbQuantityLabel.value = "Occupied rental units";
      setSelected("data-control", "demandElasticity", "unit");
      setSelected("data-control", "supplyElasticity", "inelastic");
      setSelected("data-control", "demandShift", "increase");
      setSelected("data-control", "demandSize", "large");
      setSelected("data-control", "supplyShift", "none");
      setSelected("data-control", "supplySize", "small");
    } else if (preset === "housing-long") {
      wbMarket.value = "Rental housing after 2,000 workers arrive";
      wbPriceLabel.value = "Monthly rent";
      wbQuantityLabel.value = "Occupied rental units";
      setSelected("data-control", "demandElasticity", "unit");
      setSelected("data-control", "supplyElasticity", "elastic");
      setSelected("data-control", "demandShift", "increase");
      setSelected("data-control", "demandSize", "large");
      setSelected("data-control", "supplyShift", "none");
      setSelected("data-control", "supplySize", "small");
    } else {
      wbMarket.value = "Your market";
      wbPriceLabel.value = "Price";
      wbQuantityLabel.value = "Quantity";
      setSelected("data-control", "demandElasticity", "unit");
      setSelected("data-control", "supplyElasticity", "unit");
      setSelected("data-control", "demandShift", "none");
      setSelected("data-control", "demandSize", "small");
      setSelected("data-control", "supplyShift", "none");
      setSelected("data-control", "supplySize", "small");
    }
    clearPredictions();
    drawWorkbench(false);
  };

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });
  document.getElementById("reset-workbench").addEventListener("click", () => applyPreset("housing-short"));

  const oldFare = document.getElementById("old-fare");
  const newFare = document.getElementById("new-fare");
  const oldRiders = document.getElementById("old-riders");
  const newRiders = document.getElementById("new-riders");
  const fareAnswer = document.getElementById("fare-answer");

  const revealFare = () => {
    const p1 = Number(oldFare.value);
    const p2 = Number(newFare.value);
    const q1 = Number(oldRiders.value);
    const q2 = Number(newRiders.value);
    if (![p1, p2, q1, q2].every((value) => Number.isFinite(value) && value > 0) || p1 === p2) {
      fareAnswer.textContent = "Enter positive values and two different fares.";
      fareAnswer.hidden = false;
      return;
    }
    const priceChange = (p2 - p1) / ((p2 + p1) / 2);
    const quantityChange = (q2 - q1) / ((q2 + q1) / 2);
    const elasticity = Math.abs(quantityChange / priceChange);
    const oldRevenue = p1 * q1;
    const newRevenue = p2 * q2;
    const revenueChange = ((newRevenue - oldRevenue) / oldRevenue) * 100;
    const type = elasticity < 1 ? "inelastic" : elasticity > 1 ? "elastic" : "unit elastic";
    const movement = revenueChange > .05 ? "rises" : revenueChange < -.05 ? "falls" : "hardly changes";
    fareAnswer.textContent = `Demand is ${type}: elasticity ≈ ${elasticity.toFixed(2)}. Daily fare revenue ${movement} from ${money(oldRevenue)} to ${money(newRevenue)}, a ${Math.abs(revenueChange).toFixed(1)}% ${revenueChange >= 0 ? "increase" : "decrease"}.`;
    fareAnswer.hidden = false;
  };

  document.getElementById("reveal-fare").addEventListener("click", revealFare);
  [oldFare, newFare, oldRiders, newRiders].forEach((input) => input.addEventListener("input", () => { fareAnswer.hidden = true; }));

  restoreMarketState();
  drawHatForecast();
  updateTrialMarket();
  drawWorkbench(false);
  const initialHash = window.location.hash.match(/^#screen-(\d+)$/);
  showScreen(initialHash ? Number(initialHash[1]) - 1 : 0);
})();
