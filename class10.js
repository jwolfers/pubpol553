/* Class 10: Sizing Up the Economy and Economic Growth */
(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const fullscreen = document.getElementById('fullscreen');
  const label = document.getElementById('screen-label');
  const count = document.getElementById('screen-count');
  const time = document.getElementById('screen-time');
  let index = 0;

  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const stage = (el, smallText, titleText, detailText) => {
    el.replaceChildren();
    const small = document.createElement('small');
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    small.textContent = smallText; strong.textContent = titleText; span.textContent = detailText;
    el.append(small, strong, span);
  };
  const show = (nextIndex) => {
    index = clamp(nextIndex, 0, screens.length - 1);
    screens.forEach((screen, i) => screen.classList.toggle('active', i === index));
    label.textContent = screens[index].dataset.label || '';
    count.textContent = `${index + 1} / ${screens.length}`;
    time.textContent = screens[index].dataset.time || '';
    prev.disabled = index === 0; next.disabled = index === screens.length - 1;
    window.history.replaceState(null, '', `#screen-${index + 1}`);
  };
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  fullscreen.addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
    catch (_) { fullscreen.textContent = 'Full screen unavailable'; }
  });
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (target.matches('input,select,textarea') || target.isContentEditable);
    const activating = target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key);
    if (editing || activating) return;
    if (['ArrowRight', 'PageDown', 'Enter'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) { event.preventDefault(); show(index + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) { event.preventDefault(); show(index - 1); }
    if (event.key.toLowerCase() === 'f') fullscreen.click();
    if (event.key === 'Home') show(0); if (event.key === 'End') show(screens.length - 1);
  });
  window.addEventListener('hashchange', () => { const m = window.location.hash.match(/screen-(\d+)/); if (m) show(Number(m[1]) - 1); });

  const countCases = {
    newcar: ['Counts: new final production', 'Yes—the newly produced car adds its market value to GDP.', 'It is final output produced domestically and sold in a market.'],
    usedcouch: ['Does not count: resale', 'No—the used couch was counted when it was first produced.', 'The resale changes ownership but does not represent new production.'],
    care: ['Does not count: nonmarket work', 'No—unpaid household production is valuable but outside measured market activity.', 'If the family hired a child-care provider, the paid service would enter GDP.'],
    cleaner: ['Counts: market service', 'Yes—the paid cleaning service is newly produced market output.', 'The odd GDP result is that doing the same work yourself is not counted.'],
    school: ['Counts: government service', 'Yes—government purchases of education are included in GDP.', 'GDP counts the value of public services even when no tuition is charged.'],
    cash: ['May be missing: shadow economy', 'It is production, but if it is hidden from surveys and tax records it may not be measured.', 'The shadow economy is real activity that can disappear from the statistics.'],
    pollution: ['GDP misses the cost', 'The factory output enters GDP; the environmental damage is not subtracted.', 'GDP can rise while the broader quality of life falls.'],
    google: ['Counts little at a zero price', 'The service creates enormous value but contributes little measured market value when free.', 'Prices are not the same thing as total value; consumer surplus is left out.']
  };
  const countStage = document.getElementById('count-stage');
  document.querySelectorAll('[data-count-case]').forEach((button) => button.addEventListener('click', () => {
    const item = countCases[button.dataset.countCase];
    document.querySelectorAll('[data-count-case]').forEach((b) => b.classList.toggle('selected', b === button));
    stage(countStage, item[0], item[1], item[2]);
  }));
  document.getElementById('reset-count').addEventListener('click', () => {
    document.querySelectorAll('[data-count-case]').forEach((b) => b.classList.remove('selected'));
    stage(countStage, 'Ask the diagnostic questions', 'Is it new production? Is it sold in a market? Is it final output produced domestically?', 'Click a case after the class votes. The answer will expose one of GDP’s boundaries.');
  });

  const componentNotes = {
    C: 'Consumption: a household buys a haircut, a meal, a car, or a streaming subscription.',
    I: 'Investment: a firm builds a factory, buys equipment, or adds to inventories. Buying a stock is not investment in this accounting sense.',
    G: 'Government purchases: public education, roads, or defense. Transfer payments are not purchases of current output.',
    NX: 'Net exports: exports are added because they are domestic production; imports are subtracted because they were produced elsewhere.'
  };
  document.querySelectorAll('[data-component]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-component]').forEach((b) => b.classList.toggle('selected', b === button));
    document.getElementById('component-note').textContent = componentNotes[button.dataset.component];
  }));

  const realAnswer = document.getElementById('real-answer');
  document.getElementById('reveal-real').addEventListener('click', () => {
    realAnswer.hidden = !realAnswer.hidden;
    document.getElementById('reveal-real').textContent = realAnswer.hidden ? 'Reveal the answer' : 'Hide the answer';
  });

  const scaleNotes = {
    person: 'Per person: $60 billion ÷ 340 million people ≈ $176 each.',
    gdp: 'Relative to the economy: $60 billion ÷ $29 trillion ≈ 0.2% of GDP.',
    budget: 'Relative to federal spending: $60 billion ÷ $7 trillion ≈ 0.9% of the federal budget.',
    history: 'Relative to history: compare the amount with previous programs, recessions, disasters, or budgets—not just with zero.'
  };
  document.querySelectorAll('[data-scale]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-scale]').forEach((b) => b.classList.toggle('selected', b === button));
    const takeaway = document.querySelector('.scaling-screen .takeaway'); takeaway.textContent = scaleNotes[button.dataset.scale];
  }));
  document.querySelectorAll('[data-double]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-double]').forEach((b) => b.classList.toggle('selected', b === button));
  }));

  const institutionCases = {
    rights: ['Property rights', 'People invest when they expect to keep the returns.', 'Clear ownership and enforceable contracts reduce the fear that effort, land, or ideas will simply be taken.'],
    stability: ['Government stability', 'Political turmoil and corruption make long-term investment less attractive.', 'The expected return falls when the rules may be rewritten—or when officials may demand a bribe.'],
    regulation: ['Efficient regulation', 'Good rules can make markets safer; bad rules can make productive activity prohibitively costly.', 'The policy goal is not zero regulation. It is protection without needless barriers to entry and innovation.'],
    innovation: ['Innovation policy', 'Patents, copyrights, and R&D subsidies can raise the reward or lower the cost of creating new ideas.', 'The tradeoff is stronger innovation incentives today versus the cost of limiting competition or paying for research.']
  };
  const institutionStage = document.getElementById('institution-stage');
  document.querySelectorAll('[data-institution]').forEach((button) => button.addEventListener('click', () => {
    const item = institutionCases[button.dataset.institution];
    document.querySelectorAll('[data-institution]').forEach((b) => b.classList.toggle('selected', b === button));
    stage(institutionStage, item[0], item[1], item[2]);
  }));
  document.getElementById('reset-institutions').addEventListener('click', () => {
    document.querySelectorAll('[data-institution]').forEach((b) => b.classList.remove('selected'));
    stage(institutionStage, 'Choose a rule', 'What incentive does this create for investment, work, or innovation?', 'Click after asking the class for a concrete policy example.');
  });

  const policies = {
    workforce: ['Labor input', 'Affordable child care can make it easier for parents to work in the market.', 'It may raise GDP and family resources, but the policy should also ask about care quality, time, and who receives the benefit.'],
    education: ['Human capital', 'Better schooling or training can raise productivity per hour.', 'The key question is not only how many credentials are produced, but whether skills and learning improve.'],
    infrastructure: ['Physical capital', 'Roads, broadband, transit, and public facilities can make workers and firms more productive.', 'Maintenance matters: new capital depreciates, and a neglected asset is not much of an ingredient.'],
    research: ['Technology and ideas', 'R&D support can create ideas whose benefits spill over to other firms and people.', 'The public case is strongest when private incentives leave valuable spillovers on the table.'],
    regulation: ['Institutions', 'Efficient regulation can establish trust and safety while keeping productive entry possible.', 'Ask whether the rule improves the recipe—or merely makes the kitchen harder to enter.'],
    rights: ['Institutions', 'Secure property rights and rule of law make people willing to invest in businesses, skills, and ideas.', 'Growth is not just a pile of inputs. It is also confidence that the returns will be respected.']
  };
  const policyStage = document.getElementById('policy-stage');
  document.querySelectorAll('[data-policy]').forEach((button) => button.addEventListener('click', () => {
    const item = policies[button.dataset.policy];
    document.querySelectorAll('[data-policy]').forEach((b) => b.classList.toggle('selected', b === button));
    stage(policyStage, item[0], item[1], item[2]);
  }));

  const initial = window.location.hash.match(/screen-(\d+)/);
  show(initial ? Number(initial[1]) - 1 : 0);
})();
