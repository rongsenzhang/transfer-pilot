/* Workshop records use fictional evidence and stay in the reviewer's browser. */
(function () {
  'use strict';

  const gates = [
    ['coverage', 'Comparable evidence', 'The register covers at least 90% of scheduled deck-shifts in each period. The customer and service lead agree on attributable events.'],
    ['outcome', 'Customer outcome', 'The selected customer measure meets the criterion agreed before launch. The buyer has reviewed the exceptions and would consider a priced renewal.'],
    ['delivery', 'Delivery capacity', 'A named service owner, backup and distributor, if involved, can deliver the agreed cover. A missed response has been rehearsed.'],
    ['economics', 'Viable economics', 'Finance has reconciled visits, parts, travel and credits. The proposed fee leaves positive customer value and provider contribution at the expected workload.'],
    ['people', 'Safe and inclusive handover', 'Site and service owners have reviewed concerns across shifts, closed critical risks and signed off a teach-back with a nominated deputy.']
  ];

  const periods = [
    ['Days 1–30', 'Establish the baseline', 'Agree the covered deck, shift hours and exclusions. Record interruptions, existing support spend and operator feedback. Freeze the measurement rules and proposed target.'],
    ['Days 31–60', 'Trial the service', 'Run the agreed support routine. Pair each event with a work order, log missing records and review unresolved actions with the customer each week.'],
    ['Days 61–90', 'Review and decide', 'Compare equivalent operating hours, explain exceptions and reconcile the delivery cost. The buyer, service lead and finance lead review the renewal proposal.']
  ];

  const metrics = [
    ['Covered lost time', 'Covered interruption minutes ÷ scheduled operating hours × 100', 'Minutes per 100 operating hours. Compare baseline and trial on the same scope.'],
    ['Log completeness', 'Deck-shifts with a signed log ÷ scheduled deck-shifts × 100', 'An explicit zero-event record counts. A missing entry stays unknown.'],
    ['Response attainment', 'Eligible requests acknowledged inside the agreed window ÷ all eligible requests × 100', 'Report event counts. Zero requests gives no rate.'],
    ['Provider contribution', 'Service fees less credits and attributable service delivery costs', 'Reconcile work orders, parts and travel at review. Record customer costs separately.']
  ];

  const route = [
    ['M1–3', 'Discover', 'Interview operators, maintenance, procurement and the distributor. Map current responsibilities and select a site with accessible records.'],
    ['M4–6', 'Co-design', 'Agree scope, price logic, attribution, design-for-service checks and trial terms. Confirm resources and customer permission.'],
    ['M7–9', 'Run the pilot', 'Use the 90-day protocol. Review at days 30, 60 and 90. Approve, revise or close the offer.'],
    ['M10–12', 'Refine', 'Revise scope and unit economics. Repeat at a second site only with sponsor agreement and a delivery owner.'],
    ['M13–15', 'Prepare launch', 'Qualify installed-base accounts, train sellers and channel partners, and test the quotation and escalation process.'],
    ['M16–18', 'Transfer ownership', 'Company lead runs a review independently. Transfer the playbook, open issues and research protocol to permanent owners.']
  ];

  const decisions = {
    go: 'Go',
    hold: 'Hold',
    stop: 'Stop'
  };

  function fieldwork(state) {
    if (!state.programme || typeof state.programme !== 'object') state.programme = {};
    const entry = state.programme;
    if (!entry.checks || typeof entry.checks !== 'object') entry.checks = {};
    if (!Object.hasOwn(decisions, entry.choice)) entry.choice = 'hold';
    if (typeof entry.reason !== 'string') entry.reason = '';
    return entry;
  }

  function checked(entry) {
    return gates.filter(([key]) => entry.checks[key] === true);
  }

  function signature(entry, state) {
    return JSON.stringify([checked(entry).map(([key]) => key), entry.choice, entry.reason.trim(), commercialContext(state), discoveryContext(state)]);
  }

  function commercialContext(state) {
    if (!window.Commercial || typeof window.Commercial.current !== 'function') return null;
    const { selected, inputs } = window.Commercial.current(state);
    return [selected, inputs];
  }

  function discoveryContext(state) {
    if (!window.Discover || typeof window.Discover.current !== 'function') return null;
    const item = window.Discover.current(state);
    return {
      id: item.id,
      name: item.name,
      requirement: item.requirement,
      measure: item.measure,
      acceptance: item.acceptance,
      revision: item.revisionApplied ? item.revision : '',
      handover: item.handover,
      note: item.note.trim()
    };
  }

  function reviewBasis(state) {
    const discovery = discoveryContext(state);
    const lines = [];
    if (discovery) {
      lines.push('Customer priority: ' + discovery.name, 'Requirement: ' + discovery.requirement,
        'Pilot measure: ' + discovery.measure, 'Acceptance test: ' + discovery.acceptance, 'Working handover: ' + discovery.handover);
      if (discovery.revision) lines.push('Adopted revision: ' + discovery.revision);
      if (discovery.note) lines.push('Workshop note: ' + discovery.note);
    }
    lines.push(economicGate(state).label);
    return lines.join('\n');
  }

  function economicGate(state) {
    if (!window.Commercial || typeof window.Commercial.current !== 'function') {
      return { viable: false, label: 'Open the commercial model before approving a renewal.' };
    }
    const current = window.Commercial.current(state);
    const offer = current.offer;
    if (current.selected === 'baseline') {
      return { viable: false, label: 'The current selection is the baseline. Select a service offer to review a renewal.' };
    }
    const feeType = current.selected === 'performance' ? 'Performance-linked' : 'Fixed-fee';
    const amount = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
    const viable = offer.customerNet > 0 && offer.contribution > 0;
    return {
      viable,
      label: feeType + ' scenario: customer net ' + amount.format(offer.customerNet) +
        ' and provider contribution ' + amount.format(offer.contribution) + ' per year.' +
        (viable ? '' : ' Both must be positive for Go.')
    };
  }

  function summary(state) {
    const entry = fieldwork(state);
    const record = entry.record;
    const result = [
      'Pilot review · fictional 90-day exercise',
      reviewBasis(state),
      'Review gates marked in this exercise: ' + checked(entry).length + ' of ' + gates.length + '.',
      ...gates.map(([key, title]) => (entry.checks[key] === true ? '[x] ' : '[ ] ') + title)
    ];
    if (record && Object.hasOwn(decisions, record.choice)) {
      result.push('Last recorded decision: ' + decisions[record.choice] + '.', 'Recorded reason / next owner: ' + record.reason);
      if (signature(entry, state) !== record.signature) {
        result.push('The working draft has changed since this decision. Review and record it again.');
        if (record.basis) result.push('Basis at the time of the recorded decision:', record.basis);
      }
    } else {
      result.push('Decision awaiting review.');
    }
    result.push('Working choice: ' + decisions[entry.choice] + '.', 'Working reason / next owner: ' + (entry.reason.trim() || 'Awaiting input.'));
    return result.join('\n');
  }

  function section(title, description, body) {
    return '<details class="pr-disclosure"><summary>' + title + '</summary><div class="pr-disclosure-body"><p>' + description + '</p>' + body + '</div></details>';
  }

  function render(root, state, save = () => {}) {
    const entry = fieldwork(state);
    const evidenceList = gates.map(([key, title, text]) =>
      '<label class="pr-gate"><input type="checkbox" data-gate="' + key + '"><span><strong>' + title + '</strong><span>' + text + '</span></span></label>'
    ).join('');
    const clock = periods.map(([when, title, text]) =>
      '<div class="pr-phase"><span>' + when + '</span><h3>' + title + '</h3><p>' + text + '</p></div>'
    ).join('');
    const measurement = metrics.map(([key, definition, use]) =>
      '<div><dt>' + key + '</dt><dd>' + definition + '. ' + use + '</dd></div>'
    ).join('');
    const milestones = route.map(([month, title, activity]) =>
      '<li><span>' + month + '</span><div><strong>' + title + '</strong><p>' + activity + '</p></div></li>'
    ).join('');

    root.innerHTML = '<article class="pr-module" aria-labelledby="pr-title">' +
      '<header class="pr-heading"><h1 id="pr-title">The renewal review</h1><p>Would the buyer renew, and could the service team deliver again? Rehearse a day-90 decision for one assembly site using fictional evidence.</p></header>' +
      '<section class="pr-context" data-context><h3 data-priority></h3><p data-requirement></p>' +
      '<details class="pr-disclosure"><summary>Working handover and acceptance test</summary><dl class="pr-data">' +
      '<div><dt>Working handover</dt><dd data-handover></dd></div><div><dt>Pilot measure</dt><dd data-measure></dd></div>' +
      '<div><dt>Acceptance test</dt><dd data-acceptance></dd></div><div data-revision-row><dt>Adopted revision</dt><dd data-revision></dd></div><div data-note-row><dt>Workshop note</dt><dd data-workshop-note></dd></div>' +
      '</dl></details></section>' +
      '<section class="pr-clock" aria-label="Proposed 90-day field trial">' + clock + '</section>' +
      '<div class="pr-review"><section class="pr-gates"><div class="pr-block-head"><h3>Review gates</h3><output class="pr-count" data-count></output></div><p>Mark the conditions you want to assume for this exercise. The field guide specifies what a real review would need.</p><div>' + evidenceList + '</div></section>' +
      '<section class="pr-choice"><h3>Decision record</h3><p>Record the decision you would defend to the buyer and service lead.</p>' +
      '<p class="pr-model" data-model></p><form data-decision-form><label for="pr-decision">Proposed decision</label><select id="pr-decision" name="decision"><option value="hold">Hold · gather evidence</option><option value="go">Go · offer a controlled renewal</option><option value="stop">Stop · close the trial</option></select>' +
      '<label for="pr-reason">Reason, next action and owner</label><textarea id="pr-reason" name="reason" maxlength="1200" rows="4" placeholder="For example, hold until the site lead reconciles the missing night-shift logs."></textarea>' +
      '<p class="pr-guidance" data-guidance></p><button type="submit" class="pr-button">Record decision</button><p data-feedback class="pr-feedback" role="status"></p></form></section></div>' +
      '<section class="pr-guide"><div class="pr-guide-heading"><h3>Delivery field guide</h3><a href="./docs/field-guide.html">Read the full field guide</a></div>' +
      section('Measures and attribution', 'Agree the evidence rules with the customer before switching on the trial. Enter an unavailable rate as “unknown” whenever its denominator is zero.', '<dl class="pr-data">' + measurement + '</dl>') +
      section('18-month implementation plan', 'This candidate-proposed sequence assumes an 18-month placement. Timing and owners would be agreed with the partners.', '<ol class="pr-milestones">' + milestones + '</ol>') +
      section('Launch, training and ownership', 'Begin with a UK assembly site using an installed transfer platform and a buyer who can verify the cost of stoppages.', '<dl class="pr-data"><div><dt>Qualify and quote</dt><dd>The account lead works with the incumbent distributor on referrals and account ownership. Finance and service operations clear price, work scope, available cover and credit exposure before a quote.</dd></div><div><dt>Rehearse delivery</dt><dd>Operations classifies a fictional interruption, finds the owner and tests escalation. Sales explains a covered and an excluded event, the fee and the renewal gate.</dd></div><div><dt>Transfer control</dt><dd>The service lead and deputy each run a review unaided. The product engineer enters recurring access, identification or spare-part issues into the design review backlog.</dd></div></dl>') +
      section('Academic and responsible practice', 'Proposed study question: under what operating conditions would an assembly customer renew a measured lifecycle service?', '<p>Compare covered lost minutes per 100 scheduled hours across matched shifts. Review event attribution with both parties, code role-based interview themes, and retain contrary cases. Different product mixes, short observation windows and voluntary site selection limit inference.</p><p>The field guide includes the proposed abstract, sign-off roles, a trainer teach-back, CPD activities and a dedicated safety, inclusion and environmental review. All outputs are prospective.</p>') +
      '</section></article>';

    const discovery = discoveryContext(state);
    if (discovery) {
      root.querySelector('[data-priority]').textContent = discovery.name;
      root.querySelector('[data-requirement]').textContent = discovery.requirement;
      root.querySelector('[data-handover]').textContent = discovery.handover;
      root.querySelector('[data-measure]').textContent = discovery.measure;
      root.querySelector('[data-acceptance]').textContent = discovery.acceptance;
      root.querySelector('[data-revision]').textContent = discovery.revision;
      root.querySelector('[data-revision-row]').hidden = !discovery.revision;
      root.querySelector('[data-workshop-note]').textContent = discovery.note;
      root.querySelector('[data-note-row]').hidden = !discovery.note;
    } else {
      root.querySelector('[data-context]').hidden = true;
    }
    const checks = Array.from(root.querySelectorAll('[data-gate]'));
    const decision = root.querySelector('#pr-decision');
    const reason = root.querySelector('#pr-reason');
    const guidance = root.querySelector('[data-guidance]');
    const feedback = root.querySelector('[data-feedback]');
    const economics = economicGate(state);
    root.querySelector('[data-model]').textContent = economics.label;

    function refresh() {
      const complete = checked(entry).length;
      root.querySelector('[data-count]').textContent = complete + ' / ' + gates.length;
      guidance.textContent = entry.choice === 'go'
        ? (complete === gates.length ? 'All five gates are marked. State the renewal scope, owner and review date.' : 'Go requires all five gates. Hold is available while evidence is missing.')
        : (entry.choice === 'stop' ? 'Use Stop for an unresolved critical risk or an offer the customer declines. Name the close-out owner.' : 'Use Hold when an evidence gap is recoverable. Name the owner and the next review point.');
      const record = entry.record;
      if (record && Object.hasOwn(decisions, record.choice)) {
        feedback.textContent = signature(entry, state) === record.signature
          ? 'Recorded for this exercise: ' + decisions[record.choice] + '. Included in the review export.'
          : 'Draft changed since the recorded ' + decisions[record.choice] + ' decision. Review before exporting.';
      } else {
        feedback.textContent = 'No decision recorded.';
      }
    }

    checks.forEach(input => {
      input.checked = entry.checks[input.dataset.gate] === true;
      input.addEventListener('change', () => {
        entry.checks[input.dataset.gate] = input.checked;
        save();
        refresh();
      });
    });
    decision.value = entry.choice;
    reason.value = entry.reason;
    decision.addEventListener('change', () => {
      entry.choice = decision.value;
      decision.setCustomValidity('');
      save();
      refresh();
    });
    reason.addEventListener('input', () => {
      entry.reason = reason.value;
      reason.setCustomValidity('');
      save();
      refresh();
    });
    root.querySelector('[data-decision-form]').addEventListener('submit', event => {
      event.preventDefault();
      if (entry.choice === 'go' && checked(entry).length !== gates.length) {
        feedback.textContent = 'Review each outstanding gate, or record Hold or Stop.';
        checks.find(input => !input.checked).focus();
        return;
      }
      if (entry.choice === 'go' && !economics.viable) {
        feedback.textContent = 'The selected service must create positive value for both parties. Revisit the commercial model, or choose Hold or Stop.';
        decision.focus();
        return;
      }
      if (!entry.reason.trim()) {
        reason.setCustomValidity('Add a reason and next owner for this decision.');
        reason.reportValidity();
        return;
      }
      entry.record = { choice: entry.choice, reason: entry.reason.trim(), signature: signature(entry, state), basis: reviewBasis(state) };
      save();
      refresh();
    });
    refresh();
  }

  window.Programme = { render, summary };
}());
