(function () {
  'use strict';

  const main = document.getElementById('main');
  const view = document.getElementById('view');
  const storageKey = 'transfer-pilot.case.v1';
  const routes = {
    home: 'Overview', discover: 'Discover & design', economics: 'Economics',
    pilot: 'Pilot & handover', evidence: 'Evidence', brief: 'Pilot brief'
  };
  const feeNames = {baseline: 'Current arrangement', fixed: 'Fixed service fee', performance: 'Performance-linked fee'};
  const currency = new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP', maximumFractionDigits:0});
  let state = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) state = saved;
  } catch { /* Visitors can work in memory when storage is unavailable. */ }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      const status = document.getElementById('storage-status');
      status.hidden = false;
      status.textContent = 'Changes are available in this tab. Download your brief to keep a copy.';
    }
  }

  function home() {
    const { selected, offer } = window.Commercial.current(state);
    const metric = (label, value, context) => '<div class="stat"><span>' + label + '</span><strong>' + currency.format(value) + '</strong><small>' + context + '</small></div>';
    view.innerHTML = `
      <div class="wrap">
        <section class="home-hero" aria-labelledby="home-title">
          <div class="hero-copy">
            <p class="kicker">Industrial service design</p>
            <h1 id="home-title">From equipment<br>to <em>service.</em></h1>
            <p>Would an assembly plant pay for ongoing support on its ball transfer deck? Design an offer, test the price and decide whether to renew.</p>
            <div class="cta-row"><a class="btn primary" href="#discover">Open the workbench</a><a class="link-action" href="#evidence">Explore the evidence</a></div>
          </div>
          <figure class="hero-figure"><img src="./assets/deck.jpg" width="1000" height="620" fetchpriority="high" alt="Illustration of steel transfer balls mounted in the surface of a dark industrial assembly deck."><figcaption><span>Ball transfer deck · Assembly line</span><span>Concept illustration</span></figcaption></figure>
        </section>
        <section class="section-rule" aria-labelledby="case-snapshot">
          <div class="section-intro"><h2 id="case-snapshot">The working case</h2><span class="scenariotag">Illustrative assumptions · One installed site</span></div>
          <div class="snapshot">${metric('Annual fee',offer.fee,'After service credits')}${metric('Customer net value',offer.customerNet,'Per year vs current')}${metric('Supplier contribution',offer.contribution,'Before overheads')}
          <div class="stat-action"><p><strong>${feeNames[selected]}.</strong> Change the assumptions to see when the case breaks even.</p><a class="link-action" href="#economics">Test the economics</a></div></div>
        </section>
        <section class="section-rule" aria-labelledby="study-path">
          <div class="section-intro"><h2 id="study-path">Inside the workbench</h2></div>
          <div class="case-cards">
            <a class="case-card" href="#discover"><h3>Discover &amp; design</h3><p>Follow an operator’s concern through to a service requirement, a measurable test and a named owner.</p></a>
            <a class="case-card" href="#economics"><h3>Model the offer</h3><p>Compare customer-managed support, a fixed fee and a contract with performance credits.</p></a>
            <a class="case-card" href="#pilot"><h3>Review the pilot</h3><p>Decide what would justify renewal, who delivers the service, and what the company needs to learn.</p></a>
          </div>
          <p class="home-bottom">An independent case study informed by the Aston–Alwayse KTP and public manufacturing cases. Site records, prices and decisions in the workbench are fictional. <a href="#evidence">Sources and scope</a></p>
        </section>
      </div>`;
  }

  function pageHead(label, title, intro) {
    return '<div class="page-head"><p class="kicker">' + label + '</p><h1>' + title + '</h1><p>' + intro + '</p></div>';
  }

  function sections() {
    return [
      ['Site and scope', 'One fictional manufacturing assembly site with a customer-owned ball transfer deck. The proposed offer covers support for agreed deck-attributable interruptions. Confirm exclusions, shift coverage and existing entitlements with the customer.'],
      ['Customer requirement and service design', window.Discover.summary(state)],
      ['Economics and sensitivity', window.Commercial.summary(state)],
      ['Pilot evidence and decision', window.Programme.summary(state)],
      ['Next fieldwork', 'Agree the covered equipment and event definition with operators, compare shift logs with work orders, and validate delivery costs with finance and the service lead. Obtain a buyer decision on actual terms before offering a renewal.'],
      ['Evidence and provenance', 'Independent application work by Rongsen Zhang, version 1.0.0. Synthetic case, unvalidated assumptions, no customer or supplier endorsement.\nUKRI project 10146336 · https://gtr.ukri.org/projects?ref=10146336\nExisting Alwayse service · https://www.alwayse.com/ball-transfer-maintenance-services/\nMethods and sources · https://github.com/rongsenzhang/transfer-pilot']
    ];
  }
  function brief() {
    view.innerHTML = '<article class="wrap workpage">' +
      pageHead('Workshop output', 'Pilot brief', 'A snapshot of your working service design, pricing assumptions and renewal decision. Changes are kept in this browser.') +
      '<div class="brief-tools"><button type="button" class="btn primary" id="download-brief">Download brief (.txt)</button><button type="button" class="btn secondary" id="print-brief">Print or save PDF</button></div><div id="brief-body"></div></article>';
    const body = view.querySelector('#brief-body');
    const content = sections();
    content.forEach(([title, value]) => {
      const block = document.createElement('section');
      block.className = 'brief-section';
      const heading = document.createElement('h2');
      heading.textContent = title;
      const p = document.createElement('p');
      p.className = 'brief-text';
      p.textContent = value;
      block.append(heading, p);
      body.append(block);
    });
    view.querySelector('#download-brief').addEventListener('click', () => {
      const file = 'TRANSFER PILOT · PILOT BRIEF\n\n' + content.map(([title, value]) => title.toUpperCase() + '\n' + value).join('\n\n') + '\n';
      const url = URL.createObjectURL(new Blob([file], {type:'text/plain;charset=utf-8'}));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'transfer-pilot-brief.txt';
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    });
    view.querySelector('#print-brief').addEventListener('click', () => window.print());
  }

  function work(route) {
    const pages = {
      discover: [pageHead('Customer workshop', 'Discover &amp; design', 'Choose the problem to explore with the customer. Follow it from the first interview question to the service team’s handover.'), window.Discover, 'Test the economics', 'economics'],
      economics: [pageHead('Commercial model', 'Economics of the offer', 'Set the assumptions for one installed deck. Look for a fee that creates value for the customer and covers the supplier’s direct costs.'), window.Commercial, 'Review the pilot', 'pilot'],
      pilot: ['', window.Programme, 'Open the pilot brief', 'brief'],
      evidence: [pageHead('Research notebook', 'Evidence and role coverage', 'Trace the case back to the partnership, the manufacturer, comparable suppliers and the original role requirements.'), window.Evidence, 'Open the workbench', 'discover']
    };
    const [head, module, next, nextRoute] = pages[route];
    view.innerHTML = '<div class="wrap workpage">' + head + '<div id="module"></div><div class="page-tail"><span>Independent candidate project · Illustrative workshop</span><a class="btn secondary" href="#' + nextRoute + '">' + next + '</a></div></div>';
    module.render(view.querySelector('#module'), state, save);
  }
  function navigate(moveFocus) {
    let route = location.hash.slice(1) || 'home';
    if (route === 'main') route = 'home';
    if (!Object.hasOwn(routes, route)) route = 'home';
    document.querySelectorAll('.site-bar a[href^="#"]').forEach(a => {
      if (a.hash === '#' + route && !a.classList.contains('wordmark')) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    if (route === 'home') home();
    else if (route === 'brief') brief();
    else work(route);
    document.title = routes[route] + ' · Transfer Pilot';
    if (moveFocus) { window.scrollTo(0,0); main.focus({preventScroll:true}); }
  }
  window.addEventListener('hashchange', () => navigate(true));
  document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); });
  navigate(false);
})();
