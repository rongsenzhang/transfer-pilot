(function (scope) {
  'use strict';
  const model = scope.TransferModel;
  const pound = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0});
  const num = new Intl.NumberFormat('en-GB', {maximumFractionDigits: 2});
  const money = value => pound.format(Math.abs(value) < 0.5 ? 0 : value);
  const labels = {baseline: 'Current arrangement', fixed: 'Fixed service fee', performance: 'Performance-linked fee'};

  function current(state = {}) {
    const config = state.commercial || {};
    const inputs = {...model.defaults};
    for (const key of Object.keys(inputs)) {
      const value = config.inputs && config.inputs[key];
      if (model.valid(key, value)) inputs[key] = value;
    }
    const selected = Object.hasOwn(labels, config.selected) ? config.selected : 'fixed';
    const result = model.evaluate(inputs);
    return {inputs, selected, result, offer: result[selected]};
  }

  function equipmentCase(state = {}) {
    const inputs = {...model.equipment.defaults};
    for (const key of Object.keys(inputs)) {
      const value = state.equipment?.[key];
      if (model.equipment.valid(key, value)) inputs[key] = value;
    }
    return {inputs, result:model.equipment.evaluate(inputs)};
  }

  function equipmentOutput({inputs:a, result:r}) {
    const corridor = r.corridorFeasible
      ? `The indicative annual fee interval for both parties to break even has bounds of approximately <strong>${money(r.floor)}</strong> and <strong>${money(r.ceiling)}</strong>.`
      : `No non-negative annual fee satisfies both sides. The supplier's minimum viable fee is <strong>${money(r.floor)}</strong>, while the customer's break-even ceiling is <strong>${money(r.ceiling)}</strong>.`;
    const rows = [
      ['Customer buys equipment',money(r.buyCostPV),'Customer pays the purchase price and annual support, then recovers the asset value.'],
      ['Customer takes service',money(r.serviceCostPV),'Customer pays the annual fee and has no residual claim.'],
      ['Customer saving with service',money(r.customerSaving),'Purchase cost less service cost. A negative result favours buying.'],
      ['Supplier contract NPV',money(r.supplierNPV),'Fees less asset cost and annual delivery, plus net residual recovery.']
    ];
    return `${table(['Perspective','Present value','Included cash flows'], rows, `Same operating performance over ${a.term} years`)}
      <p class="econ-eaas-corridor">${corridor} The supplier’s algebraic break-even fee is ${money(r.requiredFee)} per year. A fee at a break-even endpoint leaves that party indifferent. Figures are rounded.</p>`;
  }

  function equipmentMarkup(state) {
    const {inputs} = equipmentCase(state);
    const fields = Object.keys(inputs).map(key => field(key,inputs[key],model.equipment.fields,'equipment')).join('');
    return `<details class="econ-details econ-eaas"><summary>New equipment: ownership or service?</summary><div>
      <p>Try a separate acquisition decision for a new, equivalent deck. Compare paying capital up front and funding support with paying an annual fee for supplier-owned equipment. Both options deliver the same operating performance.</p>
      <div class="econ-fields">${fields}</div><p class="econ-feedback" data-equipment-message role="status"></p>
      <div data-equipment-output aria-live="polite"></div>
      <p class="econ-eaas-note">Purchase and acquisition occur today. Support and fees are paid at each year-end in constant pounds. The owner receives the same net residual value at the end of the final year. One common discount rate applies. Debt, tax, downtime credits and incremental uptime benefits are outside this illustration. This case is separate from the installed-platform renewal review.</p>
      </div></details>`;
  }

  function bindEquipment(root, state, save) {
    const panel = root.querySelector('.econ-eaas');
    const out = panel.querySelector('[data-equipment-output]');
    const feedback = panel.querySelector('[data-equipment-message]');
    const controls = Array.from(panel.querySelectorAll('.econ-field input'));
    function edit() {
      const values = {};
      let invalid;
      for (const input of controls) {
        const value = input.valueAsNumber;
        const okay = input.validity.valid && model.equipment.valid(input.name, value);
        input.setAttribute('aria-invalid', String(!okay));
        if (!okay && !invalid) invalid = model.equipment.fields[input.name];
        values[input.name] = value;
      }
      if (invalid) {
        feedback.textContent = `${invalid.label} needs ${invalid.integer ? 'a whole number' : 'a number'} between ${invalid.min} and ${invalid.max}. The last valid acquisition case stays in the brief.`;
        return;
      }
      state.equipment = values;
      feedback.textContent = '';
      out.innerHTML = equipmentOutput(equipmentCase(state));
      save();
    }
    controls.forEach(input => input.addEventListener('input', edit));
    out.innerHTML = equipmentOutput(equipmentCase(state));
  }

  function summary(state) {
    const {inputs:a, selected, result:r, offer} = current(state);
    const corridor = r.corridorFeasible ? `${money(r.directCost)} to ${money(r.ceiling)}` : `none (${money(-r.room)} gap)`;
    const rows = model.sensitivity(a).map(s => `${s.name}: customer ${money(s.result[selected].customerNet)}, supplier ${money(s.result[selected].contribution)}`);
    const {inputs:e, result:er} = equipmentCase(state);
    const equipmentStatus = state?.equipment ? 'reviewer inputs' : 'illustrative defaults';
    return [
      `Annual commercial case · ${labels[selected]} · illustrative, one installed site`,
      `Customer net value ${money(offer.customerNet)}; supplier direct contribution ${money(offer.contribution)}; fee after credits ${money(offer.fee)}.`,
      `Net fee corridor: ${corridor}. Estimated recovery ${num.format(r.recoveredHours)} h; performance-plan credit ${money(r.credit)}.`,
      `Sensitivity at the selected terms: ${rows.join(' | ')}.`,
      'Assumptions: ' + Object.entries(model.fields).map(([k, f]) => `${f.label} ${num.format(a[k])} ${f.unit}`).join('; ') + '.',
      'Annual incremental comparison only. No customer, quote, measured outcome or full supplier profit is represented.',
      '',
      `Optional acquisition illustration · ${equipmentStatus} · separate from the installed-site decision.`,
      `${e.term} years, ${num.format(e.discount)}% discount. Customer purchase cost PV ${money(er.buyCostPV)}; service cost PV ${money(er.serviceCostPV)}; customer saving ${money(er.customerSaving)}; supplier contract NPV ${money(er.supplierNPV)}.`,
      `Minimum non-negative supplier fee ${money(er.floor)}/year; buyer ceiling ${money(er.ceiling)}/year. ${er.corridorFeasible ? 'Fee corridor exists.' : 'No mutually viable non-negative fee.'}`,
      'Acquisition inputs: ' + Object.entries(model.equipment.fields).map(([key, f]) => `${f.label} ${num.format(e[key])} ${f.unit}`).join('; ') + '.'
    ].join('\n');
  }

  function field(key, value, definitions = model.fields, prefix = 'econ') {
    const f = definitions[key];
    return `<label class="econ-field" for="${prefix}-${key}"><span>${f.label}</span><span class="econ-input"><input id="${prefix}-${key}" name="${key}" type="number" required min="${f.min}" max="${f.max}" step="${f.integer ? '1' : 'any'}" value="${value}"><span>${f.unit}</span></span></label>`;
  }

  function table(header, rows, caption) {
    return `<div class="econ-table-wrap" tabindex="0" aria-label="${caption}"><table class="econ-table"><caption>${caption}</caption><thead><tr>${header.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(cells => `<tr><th scope="row">${cells[0]}</th>${cells.slice(1).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function results({selected, result:r, inputs:a, offer}) {
    const trade = r.corridorFeasible
      ? `At the assumed service effect, a fee after credits between <strong>${money(r.directCost)}</strong> and <strong>${money(r.ceiling)}</strong> covers direct delivery cost and preserves at least break-even value for the customer.`
      : `There is no mutually viable fee at these assumptions. The customer’s maximum break-even fee is <strong>${money(r.ceiling)}</strong>, below the supplier’s direct cost of <strong>${money(r.directCost)}</strong>.`;
    const comparison = [
      ['Annual fee after credit', ...Object.keys(labels).map(k => money(r[k].fee))],
      ['Customer cost in scope', ...Object.keys(labels).map(k => money(r[k].customerCost))],
      ['Customer net value vs current', ...Object.keys(labels).map(k => money(r[k].customerNet))],
      ['Supplier direct contribution', ...Object.keys(labels).map(k => money(r[k].contribution))]
    ];
    const tested = model.sensitivity(a).map(s => {
      const o = s.result[selected];
      return [s.name, `${num.format(s.result.recoveredHours)} h`, money(o.customerNet), money(o.contribution)];
    });
    const card = (label,value,unit) => `<div><span>${label}</span><strong>${value}</strong><small>${unit}</small></div>`;
    return `<div class="econ-cards" aria-label="Results for the selected arrangement">${card('Customer net value',money(offer.customerNet),'per site per year')}${card('Supplier contribution',money(offer.contribution),'before overhead and tax')}${card('Annual fee collected',money(offer.fee),'after performance credits')}</div>
      ${table(['Annual comparison','Current','Fixed','Performance-linked'],comparison,'Three commercial options at the same site')}
      <div class="econ-corridor"><h3>Which fee works for both sides?</h3><p>${trade}</p><p>Recovered downtime is ${num.format(r.recoveredHours)} h. After ${num.format(a.plannedHours)} h of planned interruption, the model values the change at ${money(r.ceiling)} before fees. The same delivery scope costs ${money(r.directCost)} in either service plan.</p></div>
      <details class="econ-details"><summary>Performance credit calculation</summary><div><p>Compare attributable unplanned hours recovered with the agreed target of ${num.format(a.targetHours)} h. The shortfall is ${num.format(r.shortfall)} h. At ${money(a.creditRate)} per hour, capped at ${num.format(a.capPercent)}% of the ${money(a.performanceFee)} annual list fee, the credit is <strong>${money(r.credit)}</strong>.</p><p>A proposed pilot would need a jointly signed baseline, a comparable workload and agreed exclusions for upstream stoppages before any credit could be settled.</p></div></details>
      <details class="econ-details"><summary>Sensitivity to the service effect</summary><div>${table(['Scenario','Hours recovered','Customer net','Supplier contribution'],tested,`Annual sensitivity · ${labels[selected]}`)}<p>Fees and delivery commitments stay in place for all four cases. The no-baseline case assumes no attributable downtime to recover and retains planned interruption. These are stress tests, not forecasts.</p></div></details>`;
  }

  function render(root, state, save = () => {}) {
    const {selected,inputs} = current(state);
    state.commercial = {selected, inputs};
    const fields = keys => keys.map(key => field(key,inputs[key])).join('');
    root.innerHTML = `<section class="econ" aria-label="Commercial model">
      <div class="econ-intro"><p>Compare support for one installed ball-transfer platform over one year. Change the assumptions to see how much value each party keeps.</p><small>Illustrative inputs in GBP, excluding VAT. The existing platform and ordinary customer costs are common to all three options.</small></div>
      <fieldset class="econ-picks"><legend>Arrangement to take into the pilot review</legend>${Object.entries(labels).map(([k,l]) => `<label><input type="radio" name="econ-plan" value="${k}"${selected===k?' checked':''}> ${l}</label>`).join('')}</fieldset>
      <div class="econ-input-panel"><h3>Site assumptions</h3><div class="econ-fields">${fields(['lostHours','hourValue','recovery','plannedHours'])}</div>
      <details class="econ-details"><summary>Pricing and delivery assumptions</summary><div><h4>Proposed contract</h4><div class="econ-fields">${fields(['fixedFee','performanceFee','targetHours','creditRate','capPercent'])}</div><h4>Annual supplier cost</h4><div class="econ-fields">${fields(['visits','visitCost','parts','reporting'])}</div></div></details>
      <p class="econ-feedback" role="status"></p></div>
      <div class="econ-results"></div>
      <details class="econ-details"><summary>Scope and interpretation</summary><div><p>Only downtime attributable to the agreed transfer platform is in scope. Current arrangement means the customer continues its existing support. Both service options add the same proposed visits, spares provision and reporting. Their pricing and risk allocation differ.</p><p>Use the marginal economic cost of an interruption. Deferred production that can be caught up may have a low hourly cost. Planned hours cover time added by the service. No planned interruption or service cost is added to the current arrangement.</p><p>Direct contribution covers contract receipts less the visits, spares and coordination shown here. Capital, shared overhead, tax, unpriced risks, financing and changes in other existing support costs are outside the model. The calculator displays rounded pounds and uses unrounded amounts internally.</p></div></details>
      ${equipmentMarkup(state)}</section>`;
    const out = root.querySelector('.econ-results');
    const feedback = root.querySelector('.econ-feedback');
    const redraw = () => {
      const expanded = [...out.querySelectorAll('details')].map(d => d.open);
      out.innerHTML = results(current(state));
      [...out.querySelectorAll('details')].forEach((d,i) => {d.open = Boolean(expanded[i]);});
    };
    function edit() {
      let invalid = null;
      const values = {};
      root.querySelectorAll('.econ-input-panel .econ-field input').forEach(input => {
        const value = input.valueAsNumber;
        const okay = input.validity.valid && model.valid(input.name, value);
        input.setAttribute('aria-invalid', String(!okay));
        if (!okay && !invalid) invalid = model.fields[input.name];
        values[input.name] = value;
      });
      if (invalid) {
        feedback.textContent = `${invalid.label} needs ${invalid.integer ? 'a whole number' : 'a number'} between ${invalid.min} and ${invalid.max}. Results and export currently use the last valid inputs.`;
        return;
      }
      feedback.textContent = '';
      state.commercial = {selected:root.querySelector('input[name="econ-plan"]:checked').value,inputs:values};
      redraw();
      save();
    }
    root.querySelectorAll('.econ-input-panel .econ-field input').forEach(input => input.addEventListener('input', edit));
    root.querySelectorAll('.econ-picks input').forEach(input => input.addEventListener('change', edit));
    bindEquipment(root, state, save);
    redraw();
  }
  scope.Commercial = Object.freeze({current, render, summary});
})(window);
