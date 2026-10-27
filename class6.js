(() => {
  const svgNS = "http://www.w3.org/2000/svg";
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

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const dollars = (value) => `$${Math.round(value).toLocaleString()}`;
  const svgElement = (name, attributes = {}, text = "") => {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== "") element.textContent = text;
    return element;
  };
  const appendSvg = (parent, name, attributes = {}, text = "") => {
    const element = svgElement(name, attributes, text);
    parent.append(element);
    return element;
  };

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
      timerValue.textContent = formatTime(Math.max(0, remaining));
      if (remaining <= 0) stopTimer();
    }, 1000);
  };
  const showScreen = (nextIndex) => {
    index = clamp(nextIndex, 0, screens.length - 1);
    screens.forEach((screen, screenIndex) => screen.classList.toggle("active", screenIndex === index));
    screenLabel.textContent = screens[index].dataset.label || "";
    screenCount.textContent = `${index + 1} / ${screens.length}`;
    screenTime.textContent = screens[index].dataset.time || "";
    timer.hidden = !screens[index].dataset.timer;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === screens.length - 1;
    resetTimer();
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
    const editing = target instanceof HTMLElement && (target.matches("input, button, select, textarea") || target.isContentEditable);
    if (editing) return;
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

  document.getElementById("reveal-corn").addEventListener("click", (event) => {
    const answer = document.getElementById("corn-answer");
    answer.hidden = !answer.hidden;
    event.currentTarget.textContent = answer.hidden ? "Reveal the economic answer" : "Hide the economic answer";
  });

  const demandPrice = (quantity) => (100 - quantity) / 3;
  const supplyPrice = (quantity) => quantity / 2;
  const worldPrice = 10;
  const autarkyPrice = 20;
  const autarkyQuantity = 40;
  const freeTradeSupply = 20;
  const freeTradeDemand = 70;

  const makeAxes = (svg, options = {}) => {
    const bounds = options.bounds || { left: 72, right: 770, top: 28, bottom: 430 };
    const qMax = options.qMax || 100;
    const pMax = options.pMax || 35;
    const x = (q) => bounds.left + (q / qMax) * (bounds.right - bounds.left);
    const y = (p) => bounds.bottom - (p / pMax) * (bounds.bottom - bounds.top);
    svg.replaceChildren();
    [0, 20, 40, 60, 80, 100].forEach((q) => {
      appendSvg(svg, "line", { x1: x(q), y1: bounds.top, x2: x(q), y2: bounds.bottom, class: "grid-line" });
      appendSvg(svg, "text", { x: x(q), y: bounds.bottom + 25, class: "tick-text", "text-anchor": "middle" }, q);
    });
    [0, 10, 20, 30].forEach((p) => {
      appendSvg(svg, "line", { x1: bounds.left, y1: y(p), x2: bounds.right, y2: y(p), class: "grid-line" });
      appendSvg(svg, "text", { x: bounds.left - 12, y: y(p) + 5, class: "tick-text", "text-anchor": "end" }, `$${p}`);
    });
    appendSvg(svg, "line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis" });
    appendSvg(svg, "line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis" });
    appendSvg(svg, "text", { x: (bounds.left + bounds.right) / 2, y: 490, class: "axis-label", "text-anchor": "middle" }, "Quantity in the domestic market");
    appendSvg(svg, "text", { x: 20, y: (bounds.top + bounds.bottom) / 2, class: "axis-label", transform: `rotate(-90 20 ${(bounds.top + bounds.bottom) / 2})`, "text-anchor": "middle" }, "Price");
    return { bounds, x, y };
  };
  const curve = (x, y, fn, qStart, qEnd, points = 80) => {
    const commands = [];
    for (let i = 0; i <= points; i += 1) {
      const q = qStart + ((qEnd - qStart) * i) / points;
      commands.push(`${i === 0 ? "M" : "L"}${x(q).toFixed(1)},${y(fn(q)).toFixed(1)}`);
    }
    return commands.join(" ");
  };
  const drawBaseCurves = (svg, x, y) => {
    appendSvg(svg, "path", { d: curve(x, y, demandPrice, 0, 100), class: "demand-line" });
    appendSvg(svg, "path", { d: curve(x, y, supplyPrice, 0, 70), class: "supply-line" });
    appendSvg(svg, "text", { x: x(81), y: y(demandPrice(81)) - 12, class: "curve-label demand-label" }, "Domestic demand");
    appendSvg(svg, "text", { x: x(60), y: y(supplyPrice(60)) - 12, class: "curve-label supply-label", "text-anchor": "middle" }, "Domestic supply");
  };

  const tradeChart = document.getElementById("trade-chart");
  const drawTradeMarket = (state) => {
    const { bounds, x, y } = makeAxes(tradeChart);
    drawBaseCurves(tradeChart, x, y);
    if (state === "closed") {
      appendSvg(tradeChart, "line", { x1: x(autarkyQuantity), y1: y(autarkyPrice), x2: x(autarkyQuantity), y2: bounds.bottom, class: "guide-line" });
      appendSvg(tradeChart, "line", { x1: bounds.left, y1: y(autarkyPrice), x2: x(autarkyQuantity), y2: y(autarkyPrice), class: "guide-line" });
      appendSvg(tradeChart, "circle", { cx: x(autarkyQuantity), cy: y(autarkyPrice), r: 8, class: "market-point" });
      appendSvg(tradeChart, "text", { x: x(autarkyQuantity) + 14, y: y(autarkyPrice) - 12, class: "chart-note" }, "Domestic equilibrium");
      document.getElementById("market-price").textContent = "$20";
      document.getElementById("market-supply").textContent = "40";
      document.getElementById("market-demand").textContent = "40";
      document.getElementById("market-imports").textContent = "0";
    } else {
      appendSvg(tradeChart, "line", { x1: bounds.left, y1: y(worldPrice), x2: bounds.right, y2: y(worldPrice), class: "world-line" });
      appendSvg(tradeChart, "text", { x: bounds.right - 6, y: y(worldPrice) - 10, class: "curve-label world-label", "text-anchor": "end" }, "World price = $10");
      appendSvg(tradeChart, "line", { x1: x(freeTradeSupply), y1: y(worldPrice), x2: x(freeTradeSupply), y2: bounds.bottom, class: "guide-line" });
      appendSvg(tradeChart, "line", { x1: x(freeTradeDemand), y1: y(worldPrice), x2: x(freeTradeDemand), y2: bounds.bottom, class: "guide-line" });
      appendSvg(tradeChart, "circle", { cx: x(freeTradeSupply), cy: y(worldPrice), r: 7, class: "market-point" });
      appendSvg(tradeChart, "circle", { cx: x(freeTradeDemand), cy: y(worldPrice), r: 7, class: "market-point" });
      appendSvg(tradeChart, "line", { x1: x(freeTradeSupply), y1: y(worldPrice) + 32, x2: x(freeTradeDemand), y2: y(worldPrice) + 32, class: "import-gap" });
      appendSvg(tradeChart, "text", { x: x((freeTradeSupply + freeTradeDemand) / 2), y: y(worldPrice) + 59, class: "import-text", "text-anchor": "middle" }, "50 imports");
      appendSvg(tradeChart, "text", { x: x(freeTradeSupply), y: bounds.bottom - 10, class: "chart-note", "text-anchor": "middle" }, "Produce 20");
      appendSvg(tradeChart, "text", { x: x(freeTradeDemand), y: bounds.bottom - 10, class: "chart-note", "text-anchor": "middle" }, "Buy 70");
      document.getElementById("market-price").textContent = "$10";
      document.getElementById("market-supply").textContent = "20";
      document.getElementById("market-demand").textContent = "70";
      document.getElementById("market-imports").textContent = "50";
    }
    document.querySelectorAll("[data-trade-state]").forEach((button) => button.classList.toggle("selected", button.dataset.tradeState === state));
  };
  document.querySelectorAll("[data-trade-state]").forEach((button) => button.addEventListener("click", () => drawTradeMarket(button.dataset.tradeState)));
  drawTradeMarket("closed");

  document.getElementById("reveal-distribution").addEventListener("click", (event) => {
    const screen = document.querySelector(".distribution-screen");
    const revealed = screen.classList.toggle("revealed");
    event.currentTarget.textContent = revealed ? "Hide the distribution" : "Reveal the distribution";
  });

  const tariffChart = document.getElementById("tariff-chart");
  const tariffSlider = document.getElementById("tariff-slider");
  const freeTradeTotal = (() => {
    const consumerSurplus = .5 * ((100 / 3) - worldPrice) * freeTradeDemand;
    const producerSurplus = .5 * worldPrice * freeTradeSupply;
    return consumerSurplus + producerSurplus;
  })();
  const polygonPoints = (points, x, y) => points.map(([q, p]) => `${x(q)},${y(p)}`).join(" ");
  const drawTariff = (tariff) => {
    const { bounds, x, y } = makeAxes(tariffChart);
    const domesticPrice = Math.min(autarkyPrice, worldPrice + tariff);
    const quantityDemanded = Math.max(0, 100 - 3 * domesticPrice);
    const quantitySupplied = 2 * domesticPrice;
    const imports = Math.max(0, quantityDemanded - quantitySupplied);
    const revenue = tariff * imports;
    const consumerSurplus = .5 * ((100 / 3) - domesticPrice) * quantityDemanded;
    const producerSurplus = .5 * domesticPrice * quantitySupplied;
    const deadweightLoss = Math.max(0, freeTradeTotal - consumerSurplus - producerSurplus - revenue);

    if (tariff > 0 && imports > 0) {
      appendSvg(tariffChart, "polygon", { points: polygonPoints([[freeTradeSupply, worldPrice], [quantitySupplied, worldPrice], [quantitySupplied, domesticPrice]], x, y), class: "dwl-area" });
      appendSvg(tariffChart, "polygon", { points: polygonPoints([[quantityDemanded, domesticPrice], [quantityDemanded, worldPrice], [freeTradeDemand, worldPrice]], x, y), class: "dwl-area" });
      appendSvg(tariffChart, "rect", { x: x(quantitySupplied), y: y(domesticPrice), width: x(quantityDemanded) - x(quantitySupplied), height: y(worldPrice) - y(domesticPrice), class: "revenue-area" });
    }
    drawBaseCurves(tariffChart, x, y);
    appendSvg(tariffChart, "line", { x1: bounds.left, y1: y(worldPrice), x2: bounds.right, y2: y(worldPrice), class: "world-line" });
    appendSvg(tariffChart, "text", { x: bounds.right - 5, y: y(worldPrice) + 22, class: "curve-label world-label", "text-anchor": "end" }, "World price = $10");
    if (tariff > 0) {
      appendSvg(tariffChart, "line", { x1: bounds.left, y1: y(domesticPrice), x2: bounds.right, y2: y(domesticPrice), class: "tariff-line" });
      appendSvg(tariffChart, "text", { x: bounds.right - 5, y: y(domesticPrice) - 10, class: "curve-label tariff-label", "text-anchor": "end" }, imports > 0 ? `Domestic price = $${domesticPrice}` : "Prohibitive tariff");
    }
    appendSvg(tariffChart, "line", { x1: x(quantitySupplied), y1: y(domesticPrice), x2: x(quantitySupplied), y2: bounds.bottom, class: "guide-line" });
    appendSvg(tariffChart, "line", { x1: x(quantityDemanded), y1: y(domesticPrice), x2: x(quantityDemanded), y2: bounds.bottom, class: "guide-line" });
    appendSvg(tariffChart, "circle", { cx: x(quantitySupplied), cy: y(domesticPrice), r: 7, class: "market-point" });
    appendSvg(tariffChart, "circle", { cx: x(quantityDemanded), cy: y(domesticPrice), r: 7, class: "market-point" });
    if (imports > 0) {
      appendSvg(tariffChart, "line", { x1: x(quantitySupplied), y1: y(domesticPrice) + 30, x2: x(quantityDemanded), y2: y(domesticPrice) + 30, class: "import-gap" });
      appendSvg(tariffChart, "text", { x: x((quantitySupplied + quantityDemanded) / 2), y: y(domesticPrice) + 57, class: "import-text", "text-anchor": "middle" }, `${imports} imports`);
    }

    tariffSlider.value = String(tariff);
    document.getElementById("tariff-output").textContent = `$${tariff}`;
    document.getElementById("tariff-price").textContent = `$${domesticPrice}`;
    document.getElementById("tariff-imports").textContent = String(imports);
    document.getElementById("tariff-revenue").textContent = dollars(revenue);
    document.getElementById("tariff-dwl").textContent = dollars(deadweightLoss);
    document.querySelectorAll("[data-tariff]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.tariff) === tariff));
    const story = document.getElementById("tariff-story");
    if (tariff === 0) story.textContent = "Buyers enjoy the world price. Domestic sellers face foreign competition.";
    else if (imports === 0) story.textContent = "The tariff is prohibitive: imports disappear, revenue returns to zero, and the domestic market is effectively closed.";
    else story.textContent = `Domestic production rises to ${quantitySupplied}; purchases fall to ${quantityDemanded}. The tariff transfers income and also destroys some gains from trade.`;
  };
  tariffSlider.addEventListener("input", () => drawTariff(Number(tariffSlider.value)));
  document.querySelectorAll("[data-tariff]").forEach((button) => button.addEventListener("click", () => drawTariff(Number(button.dataset.tariff))));
  document.getElementById("reset-tariff").addEventListener("click", () => drawTariff(0));
  drawTariff(0);

  document.getElementById("reveal-dashboard").addEventListener("click", (event) => {
    const screen = document.querySelector(".dashboard-screen");
    const revealed = screen.classList.toggle("revealed");
    event.currentTarget.textContent = revealed ? "Hide the numbers" : "Reveal the numbers";
  });

  const caseAnswers = {
    efficient: "If there is no domestic substitute, the exemption prevents needless damage to an American industry. That is a real efficiency argument.",
    warning: "The need for an exemption reveals how a broad tariff can tax American producers’ inputs and undermine the very production it was meant to encourage.",
    favoritism: "A case-by-case exemption process rewards access and lobbying. Identical economic harms may receive different treatment depending on political influence.",
    all: "Exactly. The exemption may be sensible, may reveal a design failure, and may reward political access—all at once. Policy analysis is allowed to be annoying."
  };
  document.querySelectorAll("[data-case-answer]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-case-answer]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const response = document.getElementById("case-response");
    response.textContent = caseAnswers[button.dataset.caseAnswer];
    response.hidden = false;
  }));

  const cabinetCases = {
    chips: { label: "National security", title: "The United States relies on East Asia for leading-edge semiconductors.", detail: "Would a tariff build resilience—or make every U.S. chip-using industry less competitive? Compare tariffs with stockpiles, subsidies, alliances, and diversified suppliers." },
    batteries: { label: "Infant industry", title: "Domestic battery makers say they need temporary protection while they learn and scale.", detail: "What milestone ends the protection? What prevents an infant industry from becoming a politically powerful adult still living at home?" },
    steel: { label: "Unfair competition", title: "Foreign steel arrives below the price domestic mills say is sustainable.", detail: "Is it predatory dumping, a government subsidy, excess capacity, or comparative advantage? What evidence separates these stories?" },
    labor: { label: "Minimum standards", title: "Imported goods may contain inputs produced with forced labor.", detail: "Should the instrument target the product, the firm, the country, or the labor practice? Who is protected, and who may lose work?" },
    autos: { label: "Jobs and communities", title: "An auto plant closure would remove the economic anchor of a town.", detail: "The cost is not just wages. It includes local suppliers, tax revenue, identity, and place. Is a tariff the best community policy—or merely the most visible?" }
  };
  const cabinetCase = document.getElementById("cabinet-case");
  document.querySelectorAll("[data-cabinet]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-cabinet]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = cabinetCases[button.dataset.cabinet];
    cabinetCase.replaceChildren(
      Object.assign(document.createElement("small"), { textContent: item.label }),
      Object.assign(document.createElement("strong"), { textContent: item.title }),
      Object.assign(document.createElement("span"), { textContent: item.detail })
    );
  }));
  document.getElementById("reset-cabinet").addEventListener("click", () => {
    document.querySelectorAll("[data-cabinet]").forEach((button) => button.classList.remove("selected"));
    cabinetCase.innerHTML = "<small>Select a case</small><strong>Then make the strongest case for—and against—protection.</strong>";
  });

  const productivityChart = document.getElementById("productivity-chart");
  const drawProductivity = () => {
    const bounds = { left: 68, right: 715, top: 28, bottom: 360 };
    const x = (value) => bounds.left + (value / 110) * (bounds.right - bounds.left);
    const y = (value) => bounds.bottom - (value / 110) * (bounds.bottom - bounds.top);
    productivityChart.replaceChildren();
    [0, 25, 50, 75, 100].forEach((value) => {
      appendSvg(productivityChart, "line", { x1: x(value), y1: bounds.top, x2: x(value), y2: bounds.bottom, class: "grid-line" });
      appendSvg(productivityChart, "line", { x1: bounds.left, y1: y(value), x2: bounds.right, y2: y(value), class: "grid-line" });
      appendSvg(productivityChart, "text", { x: x(value), y: bounds.bottom + 24, class: "tick-text", "text-anchor": "middle" }, `${value}%`);
      appendSvg(productivityChart, "text", { x: bounds.left - 10, y: y(value) + 5, class: "tick-text", "text-anchor": "end" }, `${value}%`);
    });
    appendSvg(productivityChart, "line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis" });
    appendSvg(productivityChart, "line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis" });
    appendSvg(productivityChart, "text", { x: (bounds.left + bounds.right) / 2, y: 407, class: "axis-label", "text-anchor": "middle" }, "Productivity (% of U.S. level)");
    appendSvg(productivityChart, "text", { x: 18, y: 195, class: "axis-label", transform: "rotate(-90 18 195)", "text-anchor": "middle" }, "Wages (% of U.S. level)");
    appendSvg(productivityChart, "line", { x1: x(2), y1: y(3), x2: x(103), y2: y(98), class: "productivity-trend" });
    const countries = [
      ["United States", 100, 100], ["Canada", 68, 74], ["Germany", 68, 68], ["France", 72, 57],
      ["Japan", 57, 56], ["South Korea", 63, 50], ["Mexico", 17, 13], ["China", 15, 10], ["Brazil", 15, 7], ["India", 5, 1]
    ];
    countries.forEach(([name, productivity, wage]) => {
      appendSvg(productivityChart, "circle", { cx: x(productivity), cy: y(wage), r: name === "United States" ? 8 : 6, class: "productivity-point" });
      if (["United States", "Germany", "Mexico", "China", "India"].includes(name)) {
        appendSvg(productivityChart, "text", { x: x(productivity) + 9, y: y(wage) - 8, class: "country-label" }, name);
      }
    });
  };
  drawProductivity();
  document.getElementById("reveal-productivity").addEventListener("click", (event) => {
    const screen = document.querySelector(".productivity-screen");
    const revealed = screen.classList.toggle("revealed");
    event.currentTarget.textContent = revealed ? "Hide the relationship" : "Reveal the relationship";
  });

  const shirtResponses = {
    agree: "Perhaps—but only if the extra $5 reaches workers, buyers keep buying, and firms do not move production elsewhere. A higher retail price is not itself a wage policy.",
    disagree: "A blanket rejection misses the worker’s next-best alternative. Yet ‘the alternative is worse’ cannot justify every condition. Ask what more targeted policy could improve the job without destroying it.",
    depends: "Good. It depends on the demand response, how the extra revenue is distributed, enforcement, firms’ ability to relocate, and workers’ actual alternatives. ‘Or what?’ is the beginning of the analysis."
  };
  document.querySelectorAll("[data-shirt]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-shirt]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const response = document.getElementById("shirt-response");
    response.textContent = shirtResponses[button.dataset.shirt];
    response.hidden = false;
  }));

  const instrumentResponses = {
    ban: "The ban may stop the practice in goods sold here. It can also remove workers’ current best option. Ask whether the threat of losing market access changes practices before it destroys jobs.",
    tariff: "A tariff sends money to the importing government, not automatically to foreign workers. It is a very indirect labor-standard policy.",
    standards: "This targets the stated problem more closely. The hard questions are enforcement, supply-chain traceability, and whether one rich country’s standard is appropriate everywhere.",
    support: "Direct tools may improve workers’ alternatives rather than take the current one away. They require money, state capacity, and cooperation—and are less politically theatrical than a tariff."
  };
  document.querySelectorAll("[data-instrument]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-instrument]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    document.getElementById("instrument-response").textContent = instrumentResponses[button.dataset.instrument];
  }));

  const claims = {
    cooperation: { label: "What it reveals", title: "Voluntary trade is positive-sum cooperation, not a medal table.", detail: "What it can hide: bargaining power, coercion, security dependence, and the fact that gains within each country are unevenly distributed." },
    people: { label: "What it reveals", title: "People and firms make the trades; a national deficit is not a national profit-and-loss statement.", detail: "What it can hide: governments write the rules, supply public goods, manage security risks, and redistribute the gains and losses." },
    consumers: { label: "What it reveals", title: "Cheap imports raise real purchasing power, often through thousands of small, nearly invisible gains.", detail: "What it can hide: producer losses are visible, concentrated, politically organized, and sometimes devastating to a place." },
    opportunity: { label: "What it reveals", title: "Imports create opportunity for buyers; exports create opportunity for sellers; imported inputs create jobs too.", detail: "What it can hide: workers cannot costlessly become someone else, move somewhere else, or wait decades for a region to adjust." }
  };
  const claimStage = document.getElementById("claim-stage");
  document.querySelectorAll("[data-claim]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-claim]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = claims[button.dataset.claim];
    claimStage.replaceChildren(
      Object.assign(document.createElement("small"), { textContent: item.label }),
      Object.assign(document.createElement("strong"), { textContent: item.title }),
      Object.assign(document.createElement("span"), { textContent: item.detail })
    );
  }));
  document.getElementById("reset-claims").addEventListener("click", () => {
    document.querySelectorAll("[data-claim]").forEach((button) => button.classList.remove("selected"));
    claimStage.innerHTML = "<small>Choose a claim</small><strong>Ask what this framing helps us see—and what it might hide.</strong>";
  });

  const hashMatch = window.location.hash.match(/screen-(\d+)/);
  showScreen(hashMatch ? Number(hashMatch[1]) - 1 : 0);
})();
