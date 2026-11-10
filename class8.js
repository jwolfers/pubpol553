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
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const node = (name, className, value) => {
    const element = document.createElement(name);
    if (className) element.className = className;
    element.textContent = value;
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
    const activatingButton = target instanceof HTMLButtonElement && ["Enter", " "].includes(event.key);
    if (editing || activatingButton) return;
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

  const payoffs = {
    "invest-invest": { north: 3, south: 3, title: "Both invest", detail: "The river is protected and the counties share the cost." },
    "invest-free": { north: 0, south: 5, title: "South free rides", detail: "North pays; South enjoys the protection without contributing." },
    "free-invest": { north: 5, south: 0, title: "North free rides", detail: "South pays; North enjoys the protection without contributing." },
    "free-free": { north: 1, south: 1, title: "Neither invests", detail: "Both save money today, but the region remains exposed." }
  };

  const onceChoices = { north: null, south: null };
  const onceOutcome = document.getElementById("once-outcome");
  const setOnceChoice = (player, choice) => {
    onceChoices[player] = choice;
    document.querySelectorAll(`[data-once-player="${player}"]`).forEach((button) => button.classList.toggle("selected", button.dataset.choice === choice));
    document.getElementById(`once-${player}-status`).textContent = "Choice entered privately";
    onceOutcome.classList.remove("revealed");
    onceOutcome.replaceChildren(node("small", "", "Both choices hidden"), node("strong", "", "Reveal only after both volunteers have committed."));
  };
  document.querySelectorAll("[data-once-player]").forEach((button) => button.addEventListener("click", () => setOnceChoice(button.dataset.oncePlayer, button.dataset.choice)));
  document.getElementById("reveal-once").addEventListener("click", () => {
    if (!onceChoices.north || !onceChoices.south) {
      onceOutcome.replaceChildren(node("small", "", "One more choice needed"), node("strong", "", "Enter both counties’ decisions before revealing."));
      return;
    }
    const outcome = payoffs[`${onceChoices.north}-${onceChoices.south}`];
    onceOutcome.classList.add("revealed");
    onceOutcome.replaceChildren(node("small", "", `${outcome.north} for North · ${outcome.south} for South`), node("strong", "", outcome.title), node("span", "", outcome.detail));
    document.getElementById("once-north-status").textContent = onceChoices.north === "invest" ? "Invested" : "Free rode";
    document.getElementById("once-south-status").textContent = onceChoices.south === "invest" ? "Invested" : "Free rode";
  });
  const resetOnce = () => {
    onceChoices.north = null;
    onceChoices.south = null;
    document.querySelectorAll("[data-once-player]").forEach((button) => button.classList.remove("selected"));
    document.getElementById("once-north-status").textContent = "No choice entered";
    document.getElementById("once-south-status").textContent = "No choice entered";
    onceOutcome.classList.remove("revealed");
    onceOutcome.innerHTML = "<small>Instructions</small><strong>Send Justin “invest” or “free ride” by direct message.</strong><span>He’ll enter both decisions, then reveal them simultaneously.</span>";
  };
  document.getElementById("reset-once").addEventListener("click", resetOnce);

  const floodStories = {
    1: "Step 1: Start with all four combinations of choices and their payoffs.",
    2: "Step 2: If South invests, North gets 5 by free riding rather than 3 by investing.",
    3: "Step 3: If South free rides, North gets 1 by free riding rather than 0 by investing. Free riding is North’s dominant strategy.",
    4: "Step 4: South faces the same incentives. Its best response is also to free ride in either case.",
    5: "The two sets of best-response checks meet at free ride–free ride: the Nash equilibrium. Yet invest–invest leaves both better off."
  };
  const drawFloodStep = (step) => {
    const matrix = document.getElementById("flood-matrix");
    const cells = Object.fromEntries([...document.querySelectorAll("[data-flood-cell]")].map((cell) => [cell.dataset.floodCell, cell]));
    matrix.classList.remove("focus-col-invest", "focus-col-free");
    Object.values(cells).forEach((cell) => cell.classList.remove("row-best", "col-best", "nash", "cooperative"));
    if (step === 2) matrix.classList.add("focus-col-invest");
    if (step === 3) matrix.classList.add("focus-col-free");
    if (step >= 2) cells.fi.classList.add("row-best");
    if (step >= 3) cells.ff.classList.add("row-best");
    if (step >= 4) {
      cells.if.classList.add("col-best");
      cells.ff.classList.add("col-best");
    }
    if (step >= 5) {
      cells.ff.classList.add("nash");
      cells.ii.classList.add("cooperative");
    }
    document.querySelectorAll("[data-flood-step]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.floodStep) === step));
    document.getElementById("flood-story").textContent = floodStories[step];
  };
  document.querySelectorAll("[data-flood-step]").forEach((button) => button.addEventListener("click", () => drawFloodStep(Number(button.dataset.floodStep))));
  document.getElementById("reset-flood-matrix").addEventListener("click", () => drawFloodStep(1));
  drawFloodStep(1);

  const repeat = { round: 1, northTotal: 0, southTotal: 0, north: null, south: null, revealed: false, history: [] };
  const repeatButtons = [...document.querySelectorAll("[data-repeat-player]")];
  const renderRepeat = () => {
    document.getElementById("repeat-round").textContent = repeat.round;
    document.getElementById("repeat-north-total").textContent = repeat.northTotal;
    document.getElementById("repeat-south-total").textContent = repeat.southTotal;
    repeatButtons.forEach((button) => {
      button.classList.toggle("selected", repeat[button.dataset.repeatPlayer] === button.dataset.choice);
      button.disabled = repeat.revealed;
    });
    ["north", "south"].forEach((player) => {
      const status = document.getElementById(`repeat-${player}-status`);
      status.textContent = repeat[player] ? (repeat.revealed ? (repeat[player] === "invest" ? "Invested" : "Free rode") : "Choice entered privately") : "Waiting";
    });
    const history = document.getElementById("round-history");
    history.replaceChildren();
    if (!repeat.history.length) history.append(node("span", "", "No completed rounds yet."));
    repeat.history.forEach((item) => {
      const badge = node("b", "", `R${item.round}: ${item.north[0].toUpperCase()}/${item.south[0].toUpperCase()} → ${item.northPayoff}–${item.southPayoff}`);
      history.append(badge);
    });
    document.getElementById("reveal-repeat").disabled = repeat.revealed || !repeat.north || !repeat.south;
    document.getElementById("next-repeat").disabled = !repeat.revealed;
  };
  repeatButtons.forEach((button) => button.addEventListener("click", () => {
    if (repeat.revealed) return;
    repeat[button.dataset.repeatPlayer] = button.dataset.choice;
    renderRepeat();
  }));
  document.getElementById("reveal-repeat").addEventListener("click", () => {
    if (repeat.revealed) return;
    if (!repeat.north || !repeat.south) {
      document.getElementById("repeat-result").textContent = "Enter both choices first.";
      return;
    }
    const outcome = payoffs[`${repeat.north}-${repeat.south}`];
    repeat.northTotal += outcome.north;
    repeat.southTotal += outcome.south;
    repeat.history.push({ round: repeat.round, north: repeat.north, south: repeat.south, northPayoff: outcome.north, southPayoff: outcome.south });
    repeat.revealed = true;
    document.getElementById("repeat-result").textContent = `${outcome.title}: ${outcome.north}–${outcome.south}`;
    document.getElementById("repeat-comment").textContent = outcome.detail;
    renderRepeat();
  });
  document.getElementById("next-repeat").addEventListener("click", () => {
    if (!repeat.revealed) return;
    repeat.round += 1;
    repeat.north = null;
    repeat.south = null;
    repeat.revealed = false;
    document.getElementById("repeat-result").textContent = "Enter both private choices.";
    document.getElementById("repeat-comment").textContent = "The final round remains unknown.";
    renderRepeat();
  });
  document.getElementById("reset-repeat").addEventListener("click", () => {
    Object.assign(repeat, { round: 1, northTotal: 0, southTotal: 0, north: null, south: null, revealed: false, history: [] });
    document.getElementById("repeat-result").textContent = "Enter both private choices.";
    document.getElementById("repeat-comment").textContent = "Students do not know how many rounds the game will last.";
    renderRepeat();
  });
  renderRepeat();

  const pdCases = {
    advertising: {
      label: "Prisoner’s Dilemma",
      title: "Advertising arms race",
      detail: "Each brand advertises to steal market share when its rival is quiet and to defend market share when its rival advertises. Both spend heavily and may end up with roughly the same shares.",
      note: "Cooperate: restrain advertising. Defect: advertise. Caveat: an explicit agreement may be illegal collusion."
    },
    commons: {
      label: "Prisoner’s Dilemma",
      title: "Shared fisheries and the commons",
      detail: "Each fleet catches more by fishing hard, whether the other fleet restrains itself or not. Both overfish, deplete the stock, and leave both fleets worse off.",
      note: "Policy question: Can quotas, property rights, prices, or monitoring change the payoff from overuse?"
    },
    campaign: {
      label: "Prisoner’s Dilemma",
      title: "Campaign spending",
      detail: "Each side spends to gain an advantage if the other side holds back and to avoid falling behind if the other side spends. Mutual restraint saves resources, but unilateral restraint is risky.",
      note: "Policy question: Can enforceable mutual limits replace an unstable promise to spend less?"
    },
    arms: {
      label: "Prisoner’s Dilemma",
      title: "International arms race",
      detail: "Each country arms itself to gain an advantage if the other disarms and to avoid vulnerability if the other arms. The equilibrium can be an expensive arms race neither country wants.",
      note: "Policy question: Can verification and credible enforcement make arms control sustainable?"
    },
    collusion: {
      label: "Prisoner’s Dilemma for the firms",
      title: "Cartel undercutting",
      detail: "Each firm wants its rivals to keep prices high while it quietly undercuts them. That temptation makes a cartel unstable.",
      note: "Important twist: cooperation helps the cartel but harms consumers. Society should not rescue every cooperative outcome."
    },
    standard: {
      label: "Not a Prisoner’s Dilemma",
      title: "A shared data standard is a coordination problem",
      detail: "Each agency mainly wants compatibility. Either standard may work, but a mismatch is costly. There is no dominant temptation to choose the incompatible standard.",
      note: "Diagnostic: multiple equilibria and aligned interests point to coordination, not failed cooperation."
    }
  };
  document.querySelectorAll("[data-pd-case]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-pd-case]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = pdCases[button.dataset.pdCase];
    document.getElementById("pd-case-stage").replaceChildren(node("small", "", item.label), node("strong", "", item.title), node("span", "", item.detail), node("b", "application-note", item.note));
  }));

  const phoneChoices = { you: null, them: null };
  const phoneResult = document.getElementById("phone-result");
  const resetPhone = () => {
    phoneChoices.you = null;
    phoneChoices.them = null;
    document.querySelectorAll("[data-phone-player]").forEach((button) => button.classList.remove("selected"));
    document.querySelectorAll("[data-phone-cell]").forEach((cell) => cell.classList.remove("active"));
    document.getElementById("phone-you-status").textContent = "No choice entered";
    document.getElementById("phone-them-status").textContent = "No choice entered";
    phoneResult.innerHTML = "<strong>Type your choice, but do not send it.</strong><span>On three, both volunteers send “call” or “wait.”</span>";
  };
  document.querySelectorAll("[data-phone-player]").forEach((button) => button.addEventListener("click", () => {
    const player = button.dataset.phonePlayer;
    phoneChoices[player] = button.dataset.choice;
    document.querySelectorAll(`[data-phone-player="${player}"]`).forEach((peer) => peer.classList.toggle("selected", peer === button));
    document.getElementById(`phone-${player}-status`).textContent = "Choice entered privately";
  }));
  document.getElementById("reveal-phone").addEventListener("click", () => {
    if (!phoneChoices.you || !phoneChoices.them) {
      phoneResult.replaceChildren(node("strong", "", "Enter both choices first."));
      return;
    }
    const key = `${phoneChoices.you[0]}${phoneChoices.them[0]}`;
    const messages = { cc: ["Voicemail", "Both called. Their choices match—but do not complement."], cw: ["Connected", "You called; they waited. Nash equilibrium."], wc: ["Connected", "You waited; they called. Nash equilibrium."], ww: ["Silence", "Both waited. Another coordination failure."] };
    document.querySelectorAll("[data-phone-cell]").forEach((cell) => cell.classList.toggle("active", cell.dataset.phoneCell === key));
    phoneResult.replaceChildren(node("strong", "", messages[key][0]), node("span", "", messages[key][1]));
    document.getElementById("phone-you-status").textContent = phoneChoices.you === "call" ? "Called" : "Waited";
    document.getElementById("phone-them-status").textContent = phoneChoices.them === "call" ? "Called" : "Waited";
  });
  document.getElementById("reset-phone").addEventListener("click", resetPhone);

  document.getElementById("reveal-focal").addEventListener("click", (event) => {
    const answer = document.getElementById("focal-answer");
    answer.hidden = !answer.hidden;
    event.currentTarget.textContent = answer.hidden ? "Reveal the chapter’s focal point" : "Hide the answer";
  });

  const bankAdvice = {
    keep: "If others keep their deposits in the bank, your best response is to keep yours in and earn interest. This supports the good equilibrium.",
    run: "If others are rushing to withdraw, your best response is to withdraw before the vault empties. Belief in a run can create the run."
  };
  document.querySelectorAll("[data-bank-belief]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-bank-belief]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    document.querySelectorAll("[data-bank-cell]").forEach((cell) => cell.classList.remove("active"));
    const belief = button.dataset.bankBelief;
    document.querySelector(`[data-bank-cell="${belief === "keep" ? "kk" : "ww"}"]`).classList.add("active");
    document.getElementById("bank-advice").textContent = bankAdvice[belief];
  }));
  document.getElementById("reveal-bank-policy").addEventListener("click", (event) => {
    const policy = document.getElementById("bank-policy");
    policy.hidden = !policy.hidden;
    event.currentTarget.textContent = policy.hidden ? "What can policy change?" : "Hide policy levers";
  });
  document.getElementById("reset-bank").addEventListener("click", () => {
    document.querySelectorAll("[data-bank-belief]").forEach((button) => button.classList.remove("selected"));
    document.querySelectorAll("[data-bank-cell]").forEach((cell) => cell.classList.remove("active"));
    document.getElementById("bank-advice").textContent = "Choose an expectation.";
    document.getElementById("bank-policy").hidden = true;
    document.getElementById("reveal-bank-policy").textContent = "What can policy change?";
  });

  const coordinationSolutions = {
    communication: "Communication works when interests are aligned: specify who calls back, which agency files the form, or which date everyone will use. It is less useful when someone has an incentive to mislead.",
    focal: "A focal point is a salient cue outside the payoff table. Standards, professional norms, shared calendars, and familiar defaults allow expectations to converge without detailed negotiation.",
    law: "Law can select one equilibrium when society needs uniformity: drive on the left or right, use one reporting standard, or follow one emergency protocol. The content can be arbitrary; consistency is not."
  };
  document.querySelectorAll("[data-coord-solution]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-coord-solution]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    document.getElementById("coord-answer").textContent = coordinationSolutions[button.dataset.coordSolution];
  }));

  const coordinationCases = {
    standard: {
      label: "Same-choice coordination",
      title: "Technology standards",
      detail: "A common standard makes systems compatible. Either standard can work, but each agency loses when it chooses a different one from its partners.",
      note: "Possible solution: communication, an industry focal point, or a mandated standard."
    },
    protest: {
      label: "Good and bad equilibria",
      title: "Political protest",
      detail: "Staying home is safest when others stay home. Protesting becomes safer and more effective when many people protest together. Expectations can sustain either an oppressive equilibrium or a successful revolution.",
      note: "Mechanism: public signals and focal dates can shift beliefs about how many others will participate."
    },
    skills: {
      label: "Good and bad equilibria",
      title: "Skills and good jobs",
      detail: "Workers train when firms create skilled jobs. Firms create skilled jobs when trained workers are available. An economy can settle into either a high-skill or low-skill equilibrium.",
      note: "Policy question: Can training support and employer commitments move together?"
    },
    bank: {
      label: "Good and bad equilibria",
      title: "Bank runs",
      detail: "Keeping money deposited is sensible when others do the same. Withdrawing becomes the best response when you expect everyone else to run for the vault.",
      note: "Policy tools: deposit insurance, a lender of last resort, and credible communication."
    },
    macro: {
      label: "Good and bad equilibria",
      title: "Booms and busts",
      detail: "Firms hire when households spend, and households spend when jobs look secure. The same feedback can work in reverse during a downturn.",
      note: "Policy question: Can stabilization policy change both spending and hiring expectations?"
    },
    entry: {
      label: "Anti-coordination",
      title: "Market entry",
      detail: "A market may support one new firm but not two. Each firm wants to enter if the rival stays out and to stay out if the rival enters.",
      note: "The equilibria use different but complementary choices: one enters and one stays out."
    }
  };
  document.querySelectorAll("[data-coord-case]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-coord-case]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = coordinationCases[button.dataset.coordCase];
    document.getElementById("coord-case-stage").replaceChildren(node("small", "", item.label), node("strong", "", item.title), node("span", "", item.detail), node("b", "application-note", item.note));
  }));

  const builderIds = ["builder-row-name", "builder-col-name", "builder-r1", "builder-r2", "builder-c1", "builder-c2"];
  const updateBuilderLabels = () => {
    const row = document.getElementById("builder-row-name").value || "Row player";
    const col = document.getElementById("builder-col-name").value || "Column player";
    document.getElementById("builder-corner").textContent = `${row} ↓ · ${col} →`;
    document.getElementById("builder-r1-label").textContent = document.getElementById("builder-r1").value || "Action 1";
    document.getElementById("builder-r2-label").textContent = document.getElementById("builder-r2").value || "Action 2";
    document.getElementById("builder-c1-label").textContent = document.getElementById("builder-c1").value || "Action 1";
    document.getElementById("builder-c2-label").textContent = document.getElementById("builder-c2").value || "Action 2";
  };
  builderIds.forEach((id) => document.getElementById(id).addEventListener("input", updateBuilderLabels));
  const clearBuilderMarks = () => document.querySelectorAll("[data-builder-cell]").forEach((cell) => cell.classList.remove("row-best", "col-best", "nash"));
  const payoffValue = (id) => Number(document.getElementById(id).value);
  document.getElementById("solve-builder").addEventListener("click", () => {
    clearBuilderMarks();
    const values = {
      "11": [payoffValue("b11r"), payoffValue("b11c")], "12": [payoffValue("b12r"), payoffValue("b12c")],
      "21": [payoffValue("b21r"), payoffValue("b21c")], "22": [payoffValue("b22r"), payoffValue("b22c")]
    };
    if (Object.values(values).flat().some((value) => Number.isNaN(value))) {
      document.getElementById("builder-output").textContent = "Every payoff must be a number before I can find best responses.";
      return;
    }
    ["1", "2"].forEach((column) => {
      const best = Math.max(values[`1${column}`][0], values[`2${column}`][0]);
      ["1", "2"].forEach((row) => { if (values[`${row}${column}`][0] === best) document.querySelector(`[data-builder-cell="${row}${column}"]`).classList.add("row-best"); });
    });
    ["1", "2"].forEach((row) => {
      const best = Math.max(values[`${row}1`][1], values[`${row}2`][1]);
      ["1", "2"].forEach((column) => { if (values[`${row}${column}`][1] === best) document.querySelector(`[data-builder-cell="${row}${column}"]`).classList.add("col-best"); });
    });
    const nashCells = [...document.querySelectorAll("[data-builder-cell]")].filter((cell) => cell.classList.contains("row-best") && cell.classList.contains("col-best"));
    nashCells.forEach((cell) => cell.classList.add("nash"));
    document.getElementById("builder-output").textContent = nashCells.length ? `${nashCells.length} Nash equilibrium${nashCells.length === 1 ? "" : "a"}: look for the maize-highlighted cell${nashCells.length === 1 ? "" : "s"}. Now ask whether the equilibrium is desirable.` : "No pure-strategy Nash equilibrium appears in this table. Mixed strategies may be doing the work.";
  });
  document.getElementById("reset-builder").addEventListener("click", () => {
    const defaults = { "builder-row-name": "Agency A", "builder-col-name": "Agency B", "builder-r1": "Share data", "builder-r2": "Withhold", "builder-c1": "Share data", "builder-c2": "Withhold", b11r: 3, b11c: 3, b12r: 0, b12c: 5, b21r: 5, b21c: 0, b22r: 1, b22c: 1 };
    Object.entries(defaults).forEach(([id, value]) => { document.getElementById(id).value = value; });
    clearBuilderMarks();
    updateBuilderLabels();
    document.getElementById("builder-output").textContent = "Enter the first player’s payoff first in each cell. Then let the page mark best responses and Nash equilibria.";
  });
  updateBuilderLabels();

  const moverCases = {
    airline: { label: "First-mover advantage", title: "Commitment changes the rival’s best response.", detail: "The chapter’s airline commits planes, gates, and advance tickets to three flights. United then responds with only one. Commitment must be credible—not merely announced." },
    retail: { label: "Second-mover advantage", title: "Flexibility lets the retailer undercut the first mover.", detail: "After observing a rival’s sale, the second retailer can adapt its prices. Here information and flexibility matter more than commitment." },
    candidate: { label: "Second-mover advantage", title: "The later candidate can position around the first mover.", detail: "A firm early commitment can make the first candidate vulnerable to attack from whichever side remains open." }
  };
  document.querySelectorAll("[data-mover]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-mover]").forEach((peer) => peer.classList.toggle("selected", peer === button));
    const item = moverCases[button.dataset.mover];
    document.getElementById("mover-stage").replaceChildren(node("small", "", item.label), node("strong", "", item.title), node("span", "", item.detail));
  }));

  const hashMatch = window.location.hash.match(/screen-(\d+)/);
  showScreen(hashMatch ? Number(hashMatch[1]) - 1 : 0);
})();
