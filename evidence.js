(function () {
  'use strict';

  const research = [
    {
      heading: 'Project and operating context',
      entries: [
        ['UKRI · Innovate UK', 'Aston and Alwayse partnership', 'Project 10146336 links market research and business-model innovation to the move from selling products to supplying engineered solutions.', 'UKRI project record', 'https://gtr.ukri.org/find-research-and-innovation/project/9e2f0798-5a38-4a73-bd46-beabe0ee205f'],
        ['Alwayse Engineering', 'Services already available', 'Alwayse publishes selection advice, design, fitting and maintenance. A recurring offer must give buyers a reason to pay beyond this existing support.', 'Published services', 'https://www.alwayse.com/insights-for-october/'],
        ['Manufacturer case study', 'Atlas Copco assembly line', 'A modular assembly line uses ball units and conveyor tables to vary capacity with demand. This motivates asking how operators distinguish downtime from deliberately idle capacity.', 'Atlas Copco case', 'https://www.alwayse.com/success-stories/atlas-copco/']
      ]
    },
    {
      heading: 'Competitors and service benchmarks',
      entries: [
        ['Direct competitor', 'Omnitrack', 'Spare-part kits and factory reconditioning give buyers a way to extend the life of eligible ball units. Compare this with paying a recurring fee.', 'Servicing and reconditioning', 'https://www.omnitrack.com/ball-transfer-units/'],
        ['Direct competitor', 'Schulz Stanztechnik', 'Schulz publishes air-cargo ball units with drawings, ratings and material options. This gives buyers another component supplier to consider.', 'Air-cargo product range', 'https://kugelrollen.de/en/airport-ball-caster-air-cargo-units/'],
        ['Adjacent service benchmark', 'Joloda Hydraroll', 'Its loading-system agreements combine planned maintenance and ongoing service reviews. Use this as a benchmark when testing the scope a passive deck can support.', 'Service-level agreements', 'https://www.joloda.com/en/services/service-level-agreements/']
      ]
    },
    {
      heading: 'Research and role specification',
      entries: [
        ['Aston Research Explorer', 'Organisational transformation towards servitization', 'Ziaee Bigdeli and Baines (2017) used a literature review and workshops with manufacturing executives to study organisational change. The pilot asks who will take ownership as the service develops.', 'Conference publication', 'https://research.aston.ac.uk/en/publications/organisational-transformation-towards-servitization/'],
        ['Aston Business School', 'Servitization and Service Innovation Lead', 'The eight-page job description, reference 1155-26, underpins the duty-by-duty mapping. The public advert sets out the six main areas and selection criteria.', 'Read the public advert', 'https://www.unijobs.ac/jobs/servitization-and-service-innovation-lead-ktp-associate']
      ]
    }
  ];

  const duties = [
    ['Service design', 'Trace a customer problem to a service requirement, owner and acceptance test.'],
    ['Servitization strategy', 'Identify which delivery capabilities a manufacturer needs before offering ongoing cover.'],
    ['Commercial launch', 'Test a price from both sides and identify who can sell and fulfil the offer.'],
    ['Customer engagement', 'Take the interview prompts to an operator, a buyer and a service engineer.'],
    ['Knowledge transfer', 'Use the pilot brief and teach-back exercise to hand the method to a second owner.'],
    ['Academic contribution', 'Define a research question, a comparison and its limits before collecting field data.']
  ];

  function sourceList(group) {
    const items = group.entries.map(([source, title, explanation, linkText, url]) => `
      <li class="ev-source">
        <div><span class="ev-label">${source}</span><h4>${title}</h4></div>
        <div><p>${explanation}</p><a href="${url}">${linkText}</a></div>
      </li>`).join('');
    return `<section class="ev-group"><h3>${group.heading}</h3><ul>${items}</ul></section>`;
  }

  function render(root) {
    root.innerHTML = `
      <div class="ev">
        <section class="ev-intro" aria-label="Evidence and assumptions">
          <p>The company and market evidence below grounds the choice of a transfer deck. All operating figures, prices and service credits in the pilot are illustrative. A site team would need to verify them against its own records.</p>
          <a href="docs/company-and-market.html">Company and market research</a>
        </section>
        ${research.map(sourceList).join('')}
        <section class="ev-duties" aria-labelledby="ev-duties-heading">
          <h3 id="ev-duties-heading">What the demonstration covers</h3>
          <dl>${duties.map(([title, action]) => `<div><dt>${title}</dt><dd>${action}</dd></div>`).join('')}</dl>
          <p>Customer interviews, pilot approval, staff training and publication need people from the business and university. The field guide explains how to carry out and assess that work.</p>
        </section>
        <nav class="ev-docs" aria-label="Supporting project documents">
          <a href="docs/role-coverage.html">Full role and candidate criteria</a>
          <a href="docs/field-guide.html">Pilot field guide</a>
          <a href="docs/model.html">Model assumptions and formulas</a>
          <a href="docs/technical-route.html">Technical route</a>
        </nav>
      </div>`;
  }

  window.Evidence = { render };
})();
