/* Class 9: Decisions involving private information */
(() => {
  const screens = [...document.querySelectorAll(".screen")];
  const previousButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const fullscreenButton = document.getElementById("fullscreen");
  const screenLabel = document.getElementById("screen-label");
  const screenCount = document.getElementById("screen-count");
  const screenTime = document.getElementById("screen-time");
  let index = 0;

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const replaceStage = (stage, label, title, detail) => {
    stage.replaceChildren();
    const small = document.createElement("small");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    small.textContent = label;
    strong.textContent = title;
    span.textContent = detail;
    stage.append(small, strong, span);
  };

  const showScreen = (nextIndex) => {
    index = clamp(nextIndex, 0, screens.length - 1);
    screens.forEach((screen, screenIndex) => screen.classList.toggle("active", screenIndex === index));
    screenLabel.textContent = screens[index].dataset.label || "";
    screenCount.textContent = `${index + 1} / ${screens.length}`;
    screenTime.textContent = screens[index].dataset.time || "";
    previousButton.disabled = index === 0;
    nextButton.disabled = index === screens.length - 1;
    window.history.replaceState(null, "", `#screen-${index + 1}`);
  };

  previousButton.addEventListener("click", () => showScreen(index - 1));
  nextButton.addEventListener("click", () => showScreen(index + 1));
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
    if (event.key === "Home") showScreen(0);
    if (event.key === "End") showScreen(screens.length - 1);
  });
  window.addEventListener("hashchange", () => {
    const match = window.location.hash.match(/screen-(\d+)/);
    if (match) showScreen(Number(match[1]) - 1);
  });

  const averageButton = document.getElementById("reveal-average");
  const averageAnswer = document.getElementById("average-answer");
  averageButton.addEventListener("click", () => {
    averageAnswer.hidden = !averageAnswer.hidden;
    averageButton.textContent = averageAnswer.hidden ? "Reveal average" : "Hide average";
  });

  const laptopStage = document.getElementById("laptop-stage");
  const laptopStories = {
    1: {
      label: "Selection begins",
      title: "Only lemon sellers accept $600.",
      detail: "Reliable sellers need at least $700. The offer has selected the low-quality laptops into the market."
    },
    2: {
      label: "The buyer updates",
      title: "An accepted offer is bad news about quality.",
      detail: "Once the buyer understands which sellers accept, a laptop offered at $600 is no longer worth $600."
    },
    3: {
      label: "The surviving market",
      title: "The buyer cuts the offer to $300.",
      detail: "Lemons can still trade: they are worth $300 to the buyer and only $100 to their sellers."
    },
    4: {
      label: "The market failure",
      title: "Good laptops disappear—even though trading them would help both sides.",
      detail: "A reliable laptop is worth $900 to the buyer and $700 to the seller. Private information destroys that $200 gain from trade."
    }
  };
  const drawLaptopStep = (step) => {
    const story = laptopStories[step];
    document.querySelectorAll("[data-laptop-step]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.laptopStep) === step));
    replaceStage(laptopStage, story.label, story.title, story.detail);
  };
  document.querySelectorAll("[data-laptop-step]").forEach((button) => button.addEventListener("click", () => drawLaptopStep(Number(button.dataset.laptopStep))));
  document.getElementById("reset-laptop").addEventListener("click", () => {
    document.querySelectorAll("[data-laptop-step]").forEach((button) => button.classList.remove("selected"));
    replaceStage(laptopStage, "Thumbs up if you sell · Thumbs down if you do not", "Commit to your decision before we reveal the logic.", "Reliable sellers need at least $700. Lemon sellers need only $100.");
  });

  const warrantyButton = document.getElementById("reveal-warranty");
  const warrantyAnswer = document.getElementById("warranty-answer");
  warrantyButton.addEventListener("click", () => {
    const revealed = warrantyAnswer.classList.toggle("revealed");
    if (revealed) {
      replaceStage(warrantyAnswer, "Separating signal", "Reliable sellers offer the warranty. Lemon sellers do not.", "Reliable seller: $800 − $50 = $750, enough to sell. Lemon seller: $800 − $650 = $150, less than the $300 no-warranty option.");
      warrantyButton.textContent = "Hide choices";
    } else {
      replaceStage(warrantyAnswer, "Thumbs up if you offer the warranty", "Decide before clicking.", "A signal works only if it is difficult for the low-quality seller to imitate.");
      warrantyButton.textContent = "Reveal choices";
    }
  });

  const spiralAnswer = document.getElementById("spiral-answer");
  const spiralStories = {
    1: {
      label: "Premium: $4,000",
      title: "The $1,000 and $3,000 customers pass.",
      detail: "The $5,000 and $7,000 customers buy because the premium is no greater than their expected claims."
    },
    2: {
      label: "The selected pool",
      title: "Average claims among buyers are now $6,000.",
      detail: "The original $4,000 premium cannot cover the customers who chose to buy."
    },
    3: {
      label: "Premium rises to $6,000",
      title: "Now the $5,000 customers also leave.",
      detail: "The higher price makes the insurance pool still more expensive."
    },
    4: {
      label: "Only the highest-risk group remains",
      title: "The sustainable premium moves toward $7,000.",
      detail: "Price changes participation; participation changes cost; cost changes price again."
    }
  };
  const drawSpiralStep = (step) => {
    const story = spiralStories[step];
    document.querySelectorAll("[data-spiral-step]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.spiralStep) === step));
    replaceStage(spiralAnswer, story.label, story.title, story.detail);
  };
  document.querySelectorAll("[data-spiral-step]").forEach((button) => button.addEventListener("click", () => drawSpiralStep(Number(button.dataset.spiralStep))));
  document.getElementById("reset-spiral").addEventListener("click", () => {
    document.querySelectorAll("[data-spiral-step]").forEach((button) => button.classList.remove("selected"));
    replaceStage(spiralAnswer, "Begin with the whole pool", "If everyone bought, average claims would be $4,000.", "But the premium changes who chooses to buy.");
  });

  const lockStage = document.getElementById("lock-stage");
  const lockStories = {
    none: {
      label: "No insurance",
      title: "Buy the lock.",
      detail: "It reduces your expected loss by 8% × $1,000 = $80. Paying $30 saves you $80 in expected losses."
    },
    full: {
      label: "Full insurance · No deductible",
      title: "Do not buy the lock—at least on these narrow financial incentives.",
      detail: "The insurer now bears the theft loss. The lock's private financial benefit has fallen from $80 to zero."
    },
    deductible: {
      label: "$500 deductible",
      title: "Buy the lock again.",
      detail: "The lock reduces your expected out-of-pocket loss by 8% × $500 = $40, which is more than its $30 price."
    }
  };
  const drawLockCase = (key) => {
    const story = lockStories[key];
    document.querySelectorAll("[data-lock-case]").forEach((button) => button.classList.toggle("selected", button.dataset.lockCase === key));
    replaceStage(lockStage, story.label, story.title, story.detail);
  };
  document.querySelectorAll("[data-lock-case]").forEach((button) => button.addEventListener("click", () => drawLockCase(button.dataset.lockCase)));
  document.getElementById("reset-lock").addEventListener("click", () => {
    document.querySelectorAll("[data-lock-case]").forEach((button) => button.classList.remove("selected"));
    replaceStage(lockStage, "Choose a contract", "Vote before revealing the answer.", "Ask what the lock is worth to the bicycle owner under each contract.");
  });

  const informationCases = {
    grant: {
      label: "Adverse selection · Hidden type",
      title: "The applicant knows more about project quality before the grant is awarded.",
      detail: "Possible responses: verification, staged funding, a credible co-funding signal, or evidence from prior performance."
    },
    contractor: {
      label: "Moral hazard · Hidden action",
      title: "Quality falls after the contract is signed.",
      detail: "Possible responses: monitoring, outcome measures, renewal incentives, or a contract that makes quality observable."
    },
    insurance: {
      label: "Adverse selection · Hidden risk",
      title: "The highest-cost customers are most eager to enter the pool.",
      detail: "Possible responses: broad pooling, enrollment rules, screening, risk adjustment, or subsidies."
    },
    worker: {
      label: "Moral hazard · Hidden action",
      title: "The employee chooses effort after being hired.",
      detail: "Possible responses: monitoring, autonomy paired with accountability, team design, or carefully chosen performance incentives."
    },
    vendor: {
      label: "Adverse selection · Seller knows more",
      title: "The vendor knows quality before the sale; the buyer cannot verify it.",
      detail: "Possible responses: inspection, certification, warranties, reputation, disclosure, or minimum standards."
    },
    bank: {
      label: "Moral hazard · Hidden action",
      title: "Protection changes risk-taking after funds are raised.",
      detail: "Possible responses: capital requirements, supervision, risk-based premiums, credible resolution rules, or owner skin in the game."
    }
  };
  const caseStage = document.getElementById("case-stage");
  document.querySelectorAll("[data-info-case]").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.infoCase;
    const story = informationCases[key];
    document.querySelectorAll("[data-info-case]").forEach((item) => item.classList.toggle("selected", item === button));
    replaceStage(caseStage, story.label, story.title, story.detail);
  }));
  document.getElementById("reset-cases").addEventListener("click", () => {
    document.querySelectorAll("[data-info-case]").forEach((button) => button.classList.remove("selected"));
    replaceStage(caseStage, "For each case", "Who knows what—and when?", "Thumbs up for adverse selection. Thumbs down for moral hazard. Then click to reveal.");
  });

  const initialHash = window.location.hash.match(/screen-(\d+)/);
  showScreen(initialHash ? Number(initialHash[1]) - 1 : 0);
})();
