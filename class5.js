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

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const money = (value) => `$${Number(value).toFixed(2)}`;
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const createSvg = (name, attributes = {}, content = "") => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (content !== "") element.textContent = content;
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
    const isEditing = target instanceof HTMLElement && (
      target.matches("input, textarea, button, select") || target.isContentEditable
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

  const policyInput = document.getElementById("policy-input");
  const policyOptions = document.getElementById("policy-options");
  let policies = [];
  try {
    policies = JSON.parse(window.localStorage.getItem("pubpol553-class5-policies") || "[]");
    if (!Array.isArray(policies)) policies = [];
  } catch (_error) {
    policies = [];
  }

  const savePolicies = () => {
    try {
      window.localStorage.setItem("pubpol553-class5-policies", JSON.stringify(policies));
    } catch (_error) {
      // The sorter still works when storage is unavailable.
    }
  };
  const renderPolicies = () => {
    document.querySelectorAll("[data-policy-list]").forEach((list) => list.replaceChildren());
    policies.forEach((policy, policyIndex) => {
      const list = document.querySelector(`[data-policy-list="${policy.category}"]`);
      if (!list) return;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "policy-chip";
      chip.textContent = policy.text;
      chip.title = "Remove this policy";
      chip.addEventListener("click", () => {
        policies.splice(policyIndex, 1);
        savePolicies();
        renderPolicies();
      });
      list.append(chip);
    });
    policyOptions.replaceChildren();
    policies.forEach((policy) => {
      const option = document.createElement("option");
      option.value = policy.text;
      policyOptions.append(option);
    });
    document.getElementById("undo-policy").disabled = policies.length === 0;
  };
  document.querySelectorAll("[data-policy-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = policyInput.value.trim();
      if (!text) {
        policyInput.focus();
        return;
      }
      policies.push({ text, category: button.dataset.policyCategory });
      policyInput.value = "";
      savePolicies();
      renderPolicies();
      policyInput.focus();
    });
  });
  document.getElementById("undo-policy").addEventListener("click", () => {
    policies.pop();
    savePolicies();
    renderPolicies();
  });
  document.getElementById("clear-policies").addEventListener("click", () => {
    policies = [];
    savePolicies();
    renderPolicies();
  });
  renderPolicies();

  const afterTaxStory = document.getElementById("after-tax-story");
  const revealTwoPrices = document.getElementById("reveal-two-prices");
  revealTwoPrices.addEventListener("click", () => {
    const revealed = afterTaxStory.classList.toggle("revealed");
    revealTwoPrices.textContent = revealed ? "Hide the two prices" : "Reveal the two prices";
  });

  let selectedRemitter = "seller";
  const remitterLabel = document.getElementById("remitter-label");
  const sameOutcome = document.getElementById("same-outcome");
  document.querySelectorAll("[data-remitter]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRemitter = button.dataset.remitter;
      document.querySelectorAll("[data-remitter]").forEach((peer) => peer.classList.toggle("selected", peer === button));
      remitterLabel.textContent = selectedRemitter === "seller" ? "Seller remits $6" : "Buyer remits $6";
    });
  });
  const revealInvariance = document.getElementById("reveal-invariance");
  revealInvariance.addEventListener("click", () => {
    const revealed = sameOutcome.classList.toggle("revealed");
    revealInvariance.textContent = revealed ? "Hide the comparison" : "Reveal the comparison";
  });

  const elasticityText = {
    "0.35": {
      demand: "Buyers have few good alternatives and find it hard to walk away.",
      supply: "Sellers have few alternative uses for their resources."
    },
    "1": {
      demand: "Buyers have some ability to walk away.",
      supply: "Sellers have some ability to use their resources elsewhere."
    },
    "2.5": {
      demand: "Buyers have many alternatives and can readily walk away.",
      supply: "Sellers can readily redirect their resources elsewhere."
    }
  };
  let incidenceRemitter = "seller";
  const selectedElasticity = (side) => Number(document.querySelector(`[data-elasticity="${side}"] .selected`)?.dataset.value || 1);
  const updateIncidence = () => {
    const demandElasticity = selectedElasticity("demand");
    const supplyElasticity = selectedElasticity("supply");
    const enteredTax = Number(document.getElementById("tax-size").value);
    const tax = clamp(Number.isFinite(enteredTax) ? enteredTax : 6, 1, 20);
    const buyerFraction = supplyElasticity / (supplyElasticity + demandElasticity);
    const sellerFraction = 1 - buyerFraction;
    const buyerBurden = tax * buyerFraction;
    const sellerBurden = tax * sellerFraction;
    const buyerPrice = 20 + buyerBurden;
    const sellerPrice = 20 - sellerBurden;

    document.getElementById("buyer-fill").style.height = `${buyerFraction * 100}%`;
    document.getElementById("seller-fill").style.height = `${sellerFraction * 100}%`;
    document.getElementById("buyer-fill-label").textContent = buyerFraction > .14 ? `Buyer ${money(buyerBurden)}` : "";
    document.getElementById("seller-fill-label").textContent = sellerFraction > .14 ? `Seller ${money(sellerBurden)}` : "";
    document.getElementById("live-jar-total").textContent = `${money(tax)} tax`;
    document.getElementById("incidence-buyer-price").textContent = money(buyerPrice);
    document.getElementById("incidence-seller-price").textContent = money(sellerPrice);
    document.getElementById("buyer-share").textContent = `Buyer fills ${Math.round(buyerFraction * 100)}% of the jar`;
    document.getElementById("seller-share").textContent = `Seller fills ${Math.round(sellerFraction * 100)}% of the jar`;
    document.getElementById("remittance-note").textContent = incidenceRemitter === "seller"
      ? `Seller sends the full ${money(tax)} payment.`
      : `Buyer sends the full ${money(tax)} payment.`;
    document.getElementById("demand-description").textContent = elasticityText[String(demandElasticity)].demand;
    document.getElementById("supply-description").textContent = elasticityText[String(supplyElasticity)].supply;

    let explanation = "Buyers and sellers split the burden about evenly because their ability to adjust is similar.";
    if (buyerFraction > .57) explanation = "Buyers bear more because sellers have the better escape route.";
    if (sellerFraction > .57) explanation = "Sellers bear more because buyers have the better escape route.";
    document.getElementById("incidence-explanation").textContent = explanation;
  };
  document.querySelectorAll("[data-elasticity] button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.parentElement;
      [...group.querySelectorAll("button")].forEach((peer) => peer.classList.toggle("selected", peer === button));
      updateIncidence();
    });
  });
  document.querySelectorAll("[data-control='incidence-remitter'] button").forEach((button) => {
    button.addEventListener("click", () => {
      incidenceRemitter = button.dataset.value;
      [...button.parentElement.querySelectorAll("button")].forEach((peer) => peer.classList.toggle("selected", peer === button));
      updateIncidence();
    });
  });
  document.getElementById("tax-size").addEventListener("input", updateIncidence);
  updateIncidence();

  const burdenAnswer = document.getElementById("burden-answer");
  document.querySelectorAll("[data-control='burden-vote'] button").forEach((button) => {
    button.addEventListener("click", () => {
      [...button.parentElement.querySelectorAll("button")].forEach((peer) => peer.classList.toggle("selected", peer === button));
      const policyName = document.getElementById("work-policy").value.trim() || "this policy";
      const answers = {
        buyers: `If buyers are more stuck, they are likely to bear more of the burden created by ${policyName}.`,
        equal: `If both sides have similar alternatives, they are likely to share the burden created by ${policyName}.`,
        sellers: `If sellers are more stuck, they are likely to bear more of the burden created by ${policyName}.`
      };
      burdenAnswer.textContent = answers[button.dataset.value];
      burdenAnswer.hidden = false;
    });
  });

  const demandPrice = (quantity) => 40 - .2 * quantity;
  const supplyPrice = (quantity) => 4 + .16 * quantity;
  const quantityDemanded = (price) => clamp((40 - price) / .2, 0, 180);
  const quantitySupplied = (price) => clamp((price - 4) / .16, 0, 180);
  const equilibriumPrice = 20;
  const equilibriumQuantity = 100;

  let regulationType = "ceiling";
  const regulationPriceInput = document.getElementById("regulated-price");
  const regulationGrid = document.getElementById("regulation-grid");
  const regulationCurves = document.getElementById("regulation-curves");
  const regulationAnnotations = document.getElementById("regulation-annotations");

  const graphScales = () => {
    const bounds = { left: 78, right: 690, top: 28, bottom: 438 };
    return {
      bounds,
      x: (quantity) => bounds.left + (quantity / 160) * (bounds.right - bounds.left),
      y: (price) => bounds.bottom - (price / 40) * (bounds.bottom - bounds.top)
    };
  };
  const drawBaseGraph = (grid, curves) => {
    const { bounds, x, y } = graphScales();
    grid.replaceChildren();
    curves.replaceChildren();
    for (let tick = 0; tick <= 4; tick += 1) {
      const quantity = tick * 40;
      const price = tick * 10;
      grid.append(
        createSvg("line", { x1: x(quantity), y1: bounds.top, x2: x(quantity), y2: bounds.bottom, class: "grid-line" }),
        createSvg("line", { x1: bounds.left, y1: y(price), x2: bounds.right, y2: y(price), class: "grid-line" }),
        createSvg("text", { x: x(quantity), y: bounds.bottom + 25, class: "axis-tick", "text-anchor": "middle" }, quantity),
        createSvg("text", { x: bounds.left - 10, y: y(price) + 5, class: "axis-tick", "text-anchor": "end" }, `$${price}`)
      );
    }
    grid.append(
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis-line" }),
      createSvg("line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis-line" }),
      createSvg("text", { x: (bounds.left + bounds.right) / 2, y: 490, class: "axis-label", "text-anchor": "middle" }, "Quantity"),
      createSvg("text", { x: 20, y: 235, class: "axis-label", "text-anchor": "middle", transform: "rotate(-90 20 235)" }, "Price")
    );
    const demandPoints = [];
    const supplyPoints = [];
    for (let q = 0; q <= 160; q += 2) {
      demandPoints.push([x(q), y(demandPrice(q))]);
      supplyPoints.push([x(q), y(supplyPrice(q))]);
    }
    const path = (points) => points.map(([px, py], pointIndex) => `${pointIndex ? "L" : "M"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ");
    curves.append(
      createSvg("path", { d: path(demandPoints), class: "demand-curve" }),
      createSvg("path", { d: path(supplyPoints), class: "supply-curve" }),
      createSvg("text", { x: x(26), y: y(demandPrice(26)) - 10, class: "curve-label", fill: "#1479c9" }, "Demand"),
      createSvg("text", { x: x(135), y: y(supplyPrice(135)) - 10, class: "curve-label", fill: "#c74440" }, "Supply"),
      createSvg("circle", { cx: x(equilibriumQuantity), cy: y(equilibriumPrice), r: 7, class: "equilibrium-point" })
    );
    return { bounds, x, y };
  };
  const updateRegulation = () => {
    const regulatedPrice = Number(regulationPriceInput.value);
    const isBinding = regulationType === "ceiling"
      ? regulatedPrice < equilibriumPrice
      : regulatedPrice > equilibriumPrice;
    const qdAtRule = quantityDemanded(regulatedPrice);
    const qsAtRule = quantitySupplied(regulatedPrice);
    const actualQd = isBinding ? qdAtRule : equilibriumQuantity;
    const actualQs = isBinding ? qsAtRule : equilibriumQuantity;
    const traded = Math.min(actualQd, actualQs);
    const gap = Math.abs(actualQd - actualQs);

    document.getElementById("regulated-price-label").textContent = `$${regulatedPrice}`;
    document.getElementById("regulated-qd").textContent = String(Math.round(actualQd));
    document.getElementById("regulated-qs").textContent = String(Math.round(actualQs));
    document.getElementById("regulated-traded").textContent = String(Math.round(traded));
    const result = document.getElementById("binding-result");
    result.className = `binding-result ${isBinding ? "binding" : "irrelevant"}`;
    if (!isBinding) {
      result.textContent = "The rule is not binding. The market remains at $20 and 100 units.";
    } else if (regulationType === "ceiling") {
      result.textContent = `Binding ceiling: shortage of about ${Math.round(gap)} units.`;
    } else {
      result.textContent = `Binding floor: surplus of about ${Math.round(gap)} units.`;
    }

    const { bounds, x, y } = drawBaseGraph(regulationGrid, regulationCurves);
    regulationAnnotations.replaceChildren();
    regulationAnnotations.append(
      createSvg("line", {
        x1: bounds.left,
        y1: y(regulatedPrice),
        x2: bounds.right,
        y2: y(regulatedPrice),
        class: "regulated-line",
        opacity: isBinding ? 1 : .35
      }),
      createSvg("text", {
        x: bounds.right - 8,
        y: y(regulatedPrice) - 10,
        class: "curve-label",
        fill: "#6550a5",
        "text-anchor": "end"
      }, `${regulationType === "ceiling" ? "Ceiling" : "Floor"} $${regulatedPrice}`)
    );
    if (isBinding) {
      regulationAnnotations.append(
        createSvg("circle", { cx: x(qdAtRule), cy: y(regulatedPrice), r: 7, class: "regulation-point" }),
        createSvg("circle", { cx: x(qsAtRule), cy: y(regulatedPrice), r: 7, class: "regulation-point" }),
        createSvg("line", { x1: x(qdAtRule), y1: y(regulatedPrice), x2: x(qdAtRule), y2: bounds.bottom, class: "guide-line" }),
        createSvg("line", { x1: x(qsAtRule), y1: y(regulatedPrice), x2: x(qsAtRule), y2: bounds.bottom, class: "guide-line" }),
        createSvg("text", { x: x(qdAtRule), y: bounds.bottom - 12, class: "axis-tick", "text-anchor": "middle" }, "Qd"),
        createSvg("text", { x: x(qsAtRule), y: bounds.bottom - 12, class: "axis-tick", "text-anchor": "middle" }, "Qs")
      );
    }
  };
  document.querySelectorAll("[data-control='regulation-type'] button").forEach((button) => {
    button.addEventListener("click", () => {
      regulationType = button.dataset.value;
      [...button.parentElement.querySelectorAll("button")].forEach((peer) => peer.classList.toggle("selected", peer === button));
      regulationPriceInput.value = regulationType === "ceiling" ? "15" : "25";
      updateRegulation();
    });
  });
  regulationPriceInput.addEventListener("input", updateRegulation);
  updateRegulation();

  const pressureWall = document.getElementById("pressure-wall");
  const pressureInput = document.getElementById("pressure-input");
  let pressureItems = [];
  const pressureExamples = ["Waiting", "Search", "Lower quality", "Connections", "Eligibility rules", "Side payments", "Discrimination", "Reduced supply"];
  const renderPressures = () => {
    pressureWall.replaceChildren();
    pressureItems.forEach((item) => {
      const chip = document.createElement("span");
      chip.className = `pressure-chip${item.preset ? " preset" : ""}`;
      chip.textContent = item.text;
      pressureWall.append(chip);
    });
  };
  const addPressure = () => {
    const text = pressureInput.value.trim();
    if (!text) {
      pressureInput.focus();
      return;
    }
    pressureItems.push({ text, preset: false });
    pressureInput.value = "";
    renderPressures();
    pressureInput.focus();
  };
  document.getElementById("add-pressure").addEventListener("click", addPressure);
  pressureInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addPressure();
    }
  });
  document.getElementById("reveal-pressures").addEventListener("click", () => {
    const existing = new Set(pressureItems.map((item) => item.text));
    pressureExamples.forEach((text) => {
      if (!existing.has(text)) pressureItems.push({ text, preset: true });
    });
    renderPressures();
  });
  document.getElementById("clear-pressures").addEventListener("click", () => {
    pressureItems = [];
    renderPressures();
  });

  const quotaSlider = document.getElementById("quota-slider");
  const quotaGrid = document.getElementById("quota-grid");
  const quotaCurves = document.getElementById("quota-curves");
  const quotaAnnotations = document.getElementById("quota-annotations");
  const updateQuota = () => {
    const cap = Number(quotaSlider.value);
    const isBinding = cap < equilibriumQuantity;
    const actualQuantity = isBinding ? cap : equilibriumQuantity;
    const buyerPrice = isBinding ? demandPrice(actualQuantity) : equilibriumPrice;
    const sellerCost = isBinding ? supplyPrice(actualQuantity) : equilibriumPrice;
    const rent = isBinding ? buyerPrice - sellerCost : 0;

    document.getElementById("quota-label").textContent = String(cap);
    document.getElementById("quota-buyer-price").textContent = money(buyerPrice);
    document.getElementById("quota-seller-cost").textContent = money(sellerCost);
    document.getElementById("quota-rent").textContent = money(rent);
    const status = document.getElementById("quota-status");
    status.className = `quota-status ${isBinding ? "binding" : "irrelevant"}`;
    status.textContent = isBinding
      ? `Binding cap: only ${actualQuantity} units may be sold.`
      : "The cap is above the market quantity, so it does not bind.";

    const { bounds, x, y } = drawBaseGraph(quotaGrid, quotaCurves);
    quotaAnnotations.replaceChildren();
    quotaAnnotations.append(
      createSvg("line", {
        x1: x(cap),
        y1: bounds.top,
        x2: x(cap),
        y2: bounds.bottom,
        class: "quota-line",
        opacity: isBinding ? 1 : .35
      }),
      createSvg("text", {
        x: x(cap) + 9,
        y: bounds.top + 24,
        class: "curve-label",
        fill: "#6550a5"
      }, `Cap ${cap}`)
    );
    if (isBinding) {
      quotaAnnotations.append(
        createSvg("line", { x1: x(cap), y1: y(buyerPrice), x2: x(cap), y2: y(sellerCost), class: "rent-wedge" }),
        createSvg("circle", { cx: x(cap), cy: y(buyerPrice), r: 7, class: "regulation-point" }),
        createSvg("circle", { cx: x(cap), cy: y(sellerCost), r: 7, class: "regulation-point" }),
        createSvg("text", { x: x(cap) + 18, y: y(buyerPrice) + 5, class: "curve-label", fill: "#1479c9" }, `Buyer $${buyerPrice.toFixed(1)}`),
        createSvg("text", { x: x(cap) + 18, y: y(sellerCost) + 5, class: "curve-label", fill: "#c74440" }, `Supply price $${sellerCost.toFixed(1)}`)
      );
    }
  };
  quotaSlider.addEventListener("input", updateQuota);
  updateQuota();

  const permitResult = document.getElementById("permit-result");
  const permitMessages = {
    auction: {
      title: "Government captures the scarcity value",
      text: "A competitive auction charges providers for the valuable permits and converts scarcity rents into public revenue."
    },
    free: {
      title: "License holders capture the scarcity value",
      text: "Giving permits away transfers a valuable public right to the recipients, especially when they may resell it."
    },
    administrative: {
      title: "Administrative selection decides who gets the valuable right",
      text: "Scoring, eligibility, discretion, and lobbying become economically important because access carries scarcity value."
    }
  };
  document.querySelectorAll("[data-control='permit-allocation'] button").forEach((button) => {
    button.addEventListener("click", () => {
      [...button.parentElement.querySelectorAll("button")].forEach((peer) => peer.classList.toggle("selected", peer === button));
      const message = permitMessages[button.dataset.value];
      permitResult.replaceChildren();
      const title = document.createElement("strong");
      title.textContent = message.title;
      const text = document.createElement("span");
      text.textContent = message.text;
      permitResult.append(title, text);
    });
  });

  const initialHash = window.location.hash.match(/^#screen-(\d+)$/);
  showScreen(initialHash ? Number(initialHash[1]) - 1 : 0);
})();
