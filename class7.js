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
  const svgElement = (name, attributes = {}, value = "") => {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, attributeValue]) => element.setAttribute(key, String(attributeValue)));
    if (value !== "") element.textContent = value;
    return element;
  };
  const appendSvg = (parent, name, attributes = {}, value = "") => {
    const element = svgElement(name, attributes, value);
    parent.append(element);
    return element;
  };
  const makeNode = (name, className, value) => {
    const node = document.createElement(name);
    if (className) node.className = className;
    node.textContent = value;
    return node;
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
    if (interval) return stopTimer();
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
    const editing = target instanceof HTMLElement && (target.matches("input, select, textarea") || target.isContentEditable);
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
  window.addEventListener("hashchange", () => {
    const match = window.location.hash.match(/screen-(\d+)/);
    if (match) showScreen(Number(match[1]) - 1);
  });

  const externalities = {
    concert: { label: "Negative externality", title: "The person standing enjoys the view; people behind them lose theirs.", detail: "The blocked concertgoers are bystanders whose cost is not fully considered." },
    antibiotics: { label: "Negative externality", title: "Overuse encourages resistant bacteria.", detail: "Future patients bear part of the cost when antibiotics become less effective." },
    question: { label: "Positive externality", title: "A good question can improve everyone’s understanding.", detail: "Classmates enjoy benefits that the questioner may not count when deciding whether to speak." },
    research: { label: "Positive externality", title: "Other researchers and businesses build on the discovery.", detail: "The innovator rarely captures every benefit created by the new knowledge." },
    suv: { label: "Negative externality", title: "A larger vehicle increases the danger to people in smaller cars.", detail: "The SUV driver receives the size and comfort; other road users bear some added crash risk." },
    houses: { label: "Not an externality", title: "A higher house price transfers money from buyer to seller.", detail: "Both are decision-makers in the market. The price change itself is not an omitted side effect on a bystander." }
  };
  const externalityStage = document.getElementById("externality-stage");
  document.querySelectorAll("[data-externality]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-externality]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = externalities[button.dataset.externality];
    externalityStage.replaceChildren(makeNode("small", "", item.label), makeNode("strong", "", item.title), makeNode("span", "", item.detail));
  }));
  document.getElementById("reset-externalities").addEventListener("click", () => {
    document.querySelectorAll("[data-externality]").forEach((button) => button.classList.remove("selected"));
    externalityStage.innerHTML = "<small>Choose a case</small><strong>Who acts? Who is the bystander? What is the side effect?</strong>";
  });

  const billScreen = document.querySelector(".bill-screen");
  document.getElementById("reveal-bills").addEventListener("click", (event) => {
    const revealed = billScreen.classList.toggle("revealed");
    event.currentTarget.textContent = revealed ? "Hide the experiment" : "Reveal the experiment";
    const predictions = ["predict-own", "predict-split", "predict-boss"].map((id) => document.getElementById(id).value).filter(Boolean);
    document.getElementById("bill-caption").textContent = revealed
      ? `${predictions.length ? "Your predictions are preserved above. " : ""}As less of the bill lands on the diner, ordering rises: $9 → $13 → $22.`
      : "Predict first. What changes in the diner’s private cost?";
  });

  document.getElementById("reveal-pollution").addEventListener("click", (event) => {
    const answer = document.getElementById("pollution-answer");
    answer.hidden = !answer.hidden;
    event.currentTarget.textContent = answer.hidden ? "Reveal the chapter’s answer" : "Hide the answer";
  });

  const makeAxes = (svg, { qMax, pMax, qTicks, pTicks, quantityLabel }) => {
    const bounds = { left: 76, right: 772, top: 28, bottom: 426 };
    const x = (q) => bounds.left + (q / qMax) * (bounds.right - bounds.left);
    const y = (p) => bounds.bottom - (p / pMax) * (bounds.bottom - bounds.top);
    svg.replaceChildren();
    qTicks.forEach((q) => {
      appendSvg(svg, "line", { x1: x(q), y1: bounds.top, x2: x(q), y2: bounds.bottom, class: "grid-line" });
      appendSvg(svg, "text", { x: x(q), y: bounds.bottom + 24, class: "tick-text", "text-anchor": "middle" }, q);
    });
    pTicks.forEach((p) => {
      appendSvg(svg, "line", { x1: bounds.left, y1: y(p), x2: bounds.right, y2: y(p), class: "grid-line" });
      appendSvg(svg, "text", { x: bounds.left - 12, y: y(p) + 5, class: "tick-text", "text-anchor": "end" }, `$${p}`);
    });
    appendSvg(svg, "line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.right, y2: bounds.bottom, class: "axis" });
    appendSvg(svg, "line", { x1: bounds.left, y1: bounds.bottom, x2: bounds.left, y2: bounds.top, class: "axis" });
    appendSvg(svg, "text", { x: (bounds.left + bounds.right) / 2, y: 487, class: "axis-label", "text-anchor": "middle" }, quantityLabel);
    appendSvg(svg, "text", { x: 22, y: (bounds.top + bounds.bottom) / 2, class: "axis-label", transform: `rotate(-90 22 ${(bounds.top + bounds.bottom) / 2})`, "text-anchor": "middle" }, "Price / marginal value");
    return { bounds, x, y };
  };
  const curve = (x, y, fn, start, end, points = 80) => {
    const commands = [];
    for (let i = 0; i <= points; i += 1) {
      const q = start + ((end - start) * i) / points;
      commands.push(`${i === 0 ? "M" : "L"}${x(q).toFixed(1)},${y(fn(q)).toFixed(1)}`);
    }
    return commands.join(" ");
  };
  const addCurve = (svg, x, y, fn, start, end, className, label, qLabel, labelDx = 0, labelDy = -12) => {
    appendSvg(svg, "path", { d: curve(x, y, fn, start, end), class: className });
    appendSvg(svg, "text", { x: x(qLabel) + labelDx, y: y(fn(qLabel)) + labelDy, class: "curve-label" }, label);
  };
  const addPoint = (svg, x, y, q, p, label, dx = 12, dy = -12) => {
    appendSvg(svg, "line", { x1: x(q), y1: y(p), x2: x(q), y2: y(0), class: "guide-line" });
    appendSvg(svg, "circle", { cx: x(q), cy: y(p), r: 8, class: "market-point" });
    appendSvg(svg, "text", { x: x(q) + dx, y: y(p) + dy, class: "chart-note" }, label);
  };

  const gasChart = document.getElementById("gas-chart");
  const gasDemand = (q) => 8 - .04 * q;
  const gasSupply = (q) => 1 + .03 * q;
  const gasSocialCost = (q) => gasSupply(q) + 2.1;
  const drawGas = (step = 1) => {
    const { bounds, x, y } = makeAxes(gasChart, { qMax: 150, pMax: 9, qTicks: [0, 50, 100, 150], pTicks: [0, 2, 4, 6, 8], quantityLabel: "Quantity of gasoline" });
    addCurve(gasChart, x, y, gasDemand, 0, 150, "demand-line", "Demand / marginal benefit", 18);
    addCurve(gasChart, x, y, gasSupply, 0, 150, "supply-line", "Supply / private cost", 116);
    addPoint(gasChart, x, y, 100, 4, "Market equilibrium", 12, -12);
    if (step >= 2) {
      addCurve(gasChart, x, y, gasSocialCost, 0, 150, "social-line", "Marginal social cost", 12);
      appendSvg(gasChart, "line", { x1: x(132), y1: y(gasSupply(132)), x2: x(132), y2: y(gasSocialCost(132)), class: "wedge-line" });
      appendSvg(gasChart, "text", { x: x(132) - 8, y: (y(gasSupply(132)) + y(gasSocialCost(132))) / 2, class: "gap-label", "text-anchor": "end" }, "$2.10 external cost");
    }
    if (step >= 3) addPoint(gasChart, x, y, 70, 5.2, "Social optimum", 12, -12);
    if (step >= 4) {
      appendSvg(gasChart, "line", { x1: x(70), y1: y(.55), x2: x(100), y2: y(.55), class: "gap-line" });
      appendSvg(gasChart, "text", { x: x(85), y: y(.55) - 15, class: "gap-label", "text-anchor": "middle" }, "Overproduction");
    }
    appendSvg(gasChart, "text", { x: bounds.right, y: bounds.top + 16, class: "tick-text", "text-anchor": "end" }, "Illustrative curves; chapter external-cost estimate");
    const stories = {
      1: "Step 1: Supply meets demand. Buyers and sellers determine the market quantity; bystanders do not get a vote.",
      2: "Step 2: The chapter estimates a $2.10 marginal external cost per gallon. Social cost therefore lies $2.10 above supply.",
      3: "Step 3: The social optimum occurs where marginal social benefit equals marginal social cost.",
      4: "Step 4: The market quantity exceeds the social optimum. A negative externality produces too much gasoline."
    };
    document.getElementById("gas-story").textContent = stories[step];
    document.querySelectorAll("[data-gas-step]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.gasStep) === step));
  };
  document.querySelectorAll("[data-gas-step]").forEach((button) => button.addEventListener("click", () => drawGas(Number(button.dataset.gasStep))));
  document.getElementById("reset-gas").addEventListener("click", () => drawGas(1));
  drawGas(1);

  const fluChart = document.getElementById("flu-chart");
  const fluDemand = (q) => 40 - .2 * q;
  const fluSupply = (q) => 10 + .2 * q;
  const fluSocialBenefit = (q) => fluDemand(q) + 10;
  const drawFlu = (step = 1) => {
    const { bounds, x, y } = makeAxes(fluChart, { qMax: 140, pMax: 55, qTicks: [0, 35, 70, 105, 140], pTicks: [0, 10, 20, 30, 40, 50], quantityLabel: "Flu shots per year" });
    addCurve(fluChart, x, y, fluDemand, 0, 140, "demand-line", "Demand / private benefit", 12, 0, 30);
    addCurve(fluChart, x, y, fluSupply, 0, 140, "supply-line", "Supply / social cost", 10);
    addPoint(fluChart, x, y, 75, 25, "Market equilibrium: $25", -150, 36);
    if (step >= 2) {
      addCurve(fluChart, x, y, fluSocialBenefit, 0, 140, "social-line", "Marginal social benefit", 46);
      appendSvg(fluChart, "line", { x1: x(122), y1: y(fluDemand(122)), x2: x(122), y2: y(fluSocialBenefit(122)), class: "wedge-line" });
      appendSvg(fluChart, "text", { x: x(122) - 8, y: (y(fluDemand(122)) + y(fluSocialBenefit(122))) / 2, class: "gap-label", "text-anchor": "end" }, "$10 external benefit");
    }
    if (step >= 3) addPoint(fluChart, x, y, 100, 30, "Social optimum", 12, -12);
    if (step >= 4) {
      appendSvg(fluChart, "line", { x1: x(75), y1: y(2.2), x2: x(100), y2: y(2.2), class: "gap-line" });
      appendSvg(fluChart, "text", { x: x(87.5), y: y(2.2) - 15, class: "gap-label", "text-anchor": "middle" }, "Underproduction");
    }
    appendSvg(fluChart, "text", { x: bounds.right, y: bounds.top + 16, class: "tick-text", "text-anchor": "end" }, "Illustrative curves; chapter $25 price and $10 external benefit");
    const stories = {
      1: "Step 1: At the market equilibrium, the shot costs $25 and buyers count only their private protection.",
      2: "Step 2: Preventing infection benefits bystanders too. The chapter illustrates a $10 marginal external benefit.",
      3: "Step 3: Add private and external benefits, then find where marginal social benefit meets supply.",
      4: "Step 4: The market quantity falls short. A positive externality produces too few flu shots."
    };
    document.getElementById("flu-story").textContent = stories[step];
    document.querySelectorAll("[data-flu-step]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.fluStep) === step));
  };
  document.querySelectorAll("[data-flu-step]").forEach((button) => button.addEventListener("click", () => drawFlu(Number(button.dataset.fluStep))));
  document.getElementById("reset-flu").addEventListener("click", () => drawFlu(1));
  drawFlu(1);

  const solutionDescriptions = {
    bargain: "Private bargaining: bring the creator and the bystander together. It works best with clear rights, few parties, low transaction costs, and large gains from agreement.",
    price: "Fix the price: set a corrective tax equal to the marginal external cost, or a subsidy equal to the marginal external benefit.",
    quantity: "Fix the quantity: cap the harmful activity at the social optimum and allow permits to trade so lower-cost reductions happen first.",
    rules: "Laws and regulations: prohibit or require actions when market tools are infeasible—noise limits, speed laws, zoning, and workplace-safety rules.",
    public: "Support public goods: use collective funding when free riders cause nonrival, nonexcludable goods to be underprovided.",
    ownership: "Assign ownership: give someone responsibility for a common resource so the cost of overuse lands on an owner or steward."
  };
  document.querySelectorAll("[data-solution]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-solution]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    document.getElementById("solution-stage").textContent = solutionDescriptions[button.dataset.solution];
  }));

  const coaseCases = {
    alarm: { label: "Bargaining looks plausible", title: "The insurer can discount premiums for installing an alarm.", detail: "Two identifiable parties can share the savings from fewer burglaries." },
    anchor: { label: "Bargaining looks plausible", title: "The mall can charge an anchor store lower rent.", detail: "The mall owner can capture the anchor’s benefit to nearby shops through its other leases." },
    bees: { label: "Bargaining looks plausible", title: "The apple grower can pay the beekeeper for pollination.", detail: "The parties and benefits are visible, and a side payment is straightforward." },
    lawn: { label: "Possibly", title: "A few neighbors may negotiate over midnight mowing.", detail: "It depends on clear rights, the number of neighbors, relationships, and the cost of reaching an agreement." },
    research: { label: "Bargaining looks difficult", title: "Future beneficiaries of research are numerous and often unknown.", detail: "The people who benefit cannot easily assemble beforehand to pay the researcher." },
    steel: { label: "Bargaining looks extremely difficult", title: "Millions of pollution victims cannot cheaply negotiate with one steel producer.", detail: "Identifying harms, organizing victims, and enforcing an agreement create enormous transaction costs." }
  };
  const coaseStage = document.getElementById("coase-stage");
  document.querySelectorAll("[data-coase]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-coase]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = coaseCases[button.dataset.coase];
    coaseStage.replaceChildren(makeNode("small", "", item.label), makeNode("strong", "", item.title), makeNode("span", "", item.detail));
  }));
  document.getElementById("reset-coase").addEventListener("click", () => {
    document.querySelectorAll("[data-coase]").forEach((button) => button.classList.remove("selected"));
    coaseStage.innerHTML = "<small>Choose a case</small><strong>Are rights clear? Are the parties identifiable? Are bargaining costs low?</strong>";
  });

  const toolAnswers = {
    cost: "Use a corrective tax or subsidy. If you can price the marginal external harm or benefit, repair the price signal.",
    quantity: "Use a quantity cap—often with tradable permits. If the safe quantity is better known, fix it directly and let trading find the cheaper path.",
    rule: "Use a law or regulation when the action must be prevented, damages are severe, or pricing and trading are impractical. Still count the regulation’s costs."
  };
  document.querySelectorAll("[data-tool-choice]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tool-choice]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    document.getElementById("tool-answer").textContent = toolAnswers[button.dataset.toolChoice];
  }));

  const goods = {
    cookie: { kind: "private", title: "Cookie", feedback: "Excludable and rival: nonpayers can be excluded, and your cookie leaves one fewer for me." },
    sirius: { kind: "club", title: "SiriusXM", feedback: "Excludable but largely nonrival: encryption keeps out nonpayers, while another listener does not use up the signal." },
    commons: { kind: "common", title: "Town commons", feedback: "Nonexcludable and rival: shepherds can enter, but each sheep leaves less grass for the others." },
    defense: { kind: "public", title: "National defense", feedback: "Nonexcludable and nonrival: protection extends to nonpayers, and protecting you does not reduce my protection." },
    radio: { kind: "public", title: "Broadcast radio", feedback: "Historically nonexcludable and nonrival: anyone with a receiver can listen, and extra listeners do not use up the broadcast." },
    fish: { kind: "common", title: "Ocean fish", feedback: "Hard to exclude fishers, but every fish caught leaves fewer fish for everyone else." }
  };
  let activeGood = null;
  const resetGoodAnswers = () => document.querySelectorAll("[data-kind]").forEach((button) => button.classList.remove("correct", "wrong"));
  document.querySelectorAll("[data-good]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-good]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    activeGood = goods[button.dataset.good];
    document.getElementById("goods-question").textContent = `Classify: ${activeGood.title}`;
    document.getElementById("goods-feedback").textContent = "Ask: Can nonpayers be excluded? Does one person’s use leave less for others?";
    resetGoodAnswers();
  }));
  document.querySelectorAll("[data-kind]").forEach((button) => button.addEventListener("click", () => {
    resetGoodAnswers();
    if (!activeGood) {
      document.getElementById("goods-feedback").textContent = "Choose a case first.";
      return;
    }
    const correct = button.dataset.kind === activeGood.kind;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) document.querySelector(`[data-kind="${activeGood.kind}"]`).classList.add("correct");
    document.getElementById("goods-feedback").textContent = `${correct ? "Exactly. " : "Not quite. "}${activeGood.feedback}`;
  }));
  document.getElementById("reset-goods").addEventListener("click", () => {
    activeGood = null;
    document.querySelectorAll("[data-good]").forEach((button) => button.classList.remove("selected"));
    resetGoodAnswers();
    document.getElementById("goods-question").textContent = "Choose a case";
    document.getElementById("goods-feedback").textContent = "Ask both questions before choosing a label.";
  });

  const hashMatch = window.location.hash.match(/screen-(\d+)/);
  showScreen(hashMatch ? Number(hashMatch[1]) - 1 : 0);
})();
