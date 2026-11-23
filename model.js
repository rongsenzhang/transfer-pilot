/* Annual, per-site incremental service economics. Monetary inputs are GBP, ex VAT. */
(function (scope) {
  'use strict';

  const fields = {
    lostHours:       { label: 'Attributable downtime', unit: 'h/year', value: 48, min: 0, max: 8760 },
    hourValue:       { label: 'Cost of an interrupted hour', unit: '£/h', value: 225, min: 0, max: 100000 },
    recovery:        { label: 'Expected downtime reduction', unit: '%', value: 35, min: -100, max: 100 },
    plannedHours:    { label: 'Added planned interruption', unit: 'h/year', value: 2, min: 0, max: 8760 },
    fixedFee:        { label: 'Fixed annual fee', unit: '£/year', value: 2400, min: 0, max: 1000000 },
    performanceFee:  { label: 'Performance plan list fee', unit: '£/year', value: 3000, min: 0, max: 1000000 },
    targetHours:     { label: 'Target hours recovered', unit: 'h/year', value: 20, min: 0, max: 8760 },
    creditRate:      { label: 'Credit per hour below target', unit: '£/h', value: 120, min: 0, max: 100000 },
    capPercent:      { label: 'Annual credit cap', unit: '% of list fee', value: 40, min: 0, max: 100 },
    visits:          { label: 'Planned visits', unit: 'visits/year', value: 4, min: 0, max: 365, integer: true },
    visitCost:       { label: 'Labour and travel per visit', unit: '£/visit', value: 230, min: 0, max: 100000 },
    parts:           { label: 'Included spares allowance', unit: '£/year', value: 320, min: 0, max: 1000000 },
    reporting:       { label: 'Service coordination and reporting', unit: '£/year', value: 360, min: 0, max: 1000000 }
  };

  Object.values(fields).forEach(Object.freeze);
  Object.freeze(fields);
  const defaults = Object.freeze(Object.fromEntries(Object.entries(fields).map(([key, item]) => [key, item.value])));

  function inRange(field, value) {
    return Boolean(field) && Number.isFinite(value) && value >= field.min && value <= field.max &&
      (!field.integer || Number.isInteger(value));
  }

  function valid(key, value) { return inRange(fields[key], value); }

  function evaluate(values = {}) {
    const a = { ...defaults, ...values };
    for (const key of Object.keys(fields)) {
      if (!valid(key, a[key])) throw new RangeError('Invalid assumption: ' + fields[key].label);
    }
    const recoveredHours = a.lostHours * a.recovery / 100;
    const baselineCost = a.lostHours * a.hourValue;
    const grossBenefit = recoveredHours * a.hourValue;
    const plannedCost = a.plannedHours * a.hourValue;
    const ceiling = grossBenefit - plannedCost;
    const directCost = a.visits * a.visitCost + a.parts + a.reporting;
    const shortfall = Math.max(0, a.targetHours - recoveredHours);
    const credit = Math.min(shortfall * a.creditRate, a.performanceFee * a.capPercent / 100);
    const netPerformanceFee = a.performanceFee - credit;

    function option(netFee) {
      return {
        fee: netFee,
        customerCost: baselineCost - ceiling + netFee,
        customerNet: ceiling - netFee,
        contribution: netFee - directCost
      };
    }
    return {
      recoveredHours, baselineCost, grossBenefit, plannedCost, ceiling, directCost,
      shortfall, credit, remainingHours: a.lostHours - recoveredHours,
      corridorFeasible: ceiling >= directCost, room: ceiling - directCost,
      baseline: {fee: 0, customerCost: baselineCost, customerNet: 0, contribution: 0},
      fixed: option(a.fixedFee), performance: option(netPerformanceFee)
    };
  }

  function sensitivity(values = {}) {
    const a = { ...defaults, ...values };
    evaluate(a);
    const scenarios = [
      ['Your estimate', a],
      ['No improvement', { ...a, recovery: 0 }],
      ['Downtime rises 10%', { ...a, recovery: -10 }],
      ['No baseline downtime', { ...a, lostHours: 0 }]
    ];
    return scenarios.map(([name, inputs]) => ({ name, inputs, result: evaluate(inputs) }));
  }

  const equipmentFields = Object.freeze({
    customerPrice: {label:'Customer purchase price', unit:'£ at start', value:12000, min:0, max:10000000},
    customerSupport: {label:'Support cost if bought', unit:'£/year', value:1200, min:0, max:1000000},
    annualFee: {label:'Equipment-as-a-service fee', unit:'£/year', value:3100, min:0, max:10000000},
    assetCost: {label:'Supplier asset acquisition cost', unit:'£ at start', value:9000, min:0, max:10000000},
    deliveryCost: {label:'Supplier service delivery cost', unit:'£/year', value:1000, min:0, max:1000000},
    residual: {label:'Net asset recovery at end of term', unit:'£', value:2000, min:0, max:10000000},
    term: {label:'Service term', unit:'years', value:5, min:1, max:30, integer:true},
    discount: {label:'Annual discount rate', unit:'%', value:5, min:0, max:100}
  });
  Object.values(equipmentFields).forEach(Object.freeze);
  const equipmentDefaults = Object.freeze(Object.fromEntries(Object.entries(equipmentFields).map(([key, f]) => [key, f.value])));

  function equipmentValid(key, value) { return inRange(equipmentFields[key], value); }

  function evaluateEquipment(values = {}) {
    const a = {...equipmentDefaults, ...values};
    for (const key of Object.keys(equipmentFields)) {
      if (!equipmentValid(key, a[key])) throw new RangeError('Invalid equipment assumption: ' + equipmentFields[key].label);
    }
    const rate = a.discount / 100;
    const terminalFactor = Math.exp(-a.term * Math.log1p(rate));
    const annuity = rate === 0 ? a.term : -Math.expm1(-a.term * Math.log1p(rate)) / rate;
    const residualPV = a.residual * terminalFactor;
    const buyCostPV = a.customerPrice + a.customerSupport * annuity - residualPV;
    const serviceCostPV = a.annualFee * annuity;
    const supplierCostPV = a.assetCost + a.deliveryCost * annuity - residualPV;
    const customerSaving = buyCostPV - serviceCostPV;
    const supplierNPV = serviceCostPV - supplierCostPV;
    const requiredFee = supplierCostPV / annuity;
    const floor = Math.max(0, requiredFee);
    const ceiling = buyCostPV / annuity;
    return {annuity, residualPV, buyCostPV, serviceCostPV, supplierCostPV, customerSaving,
      supplierNPV, requiredFee, floor, ceiling, corridorFeasible: ceiling >= floor, room: ceiling - floor};
  }

  const equipment = Object.freeze({fields:equipmentFields, defaults:equipmentDefaults, valid:equipmentValid, evaluate:evaluateEquipment});
  const api = Object.freeze({ defaults, fields, valid, evaluate, sensitivity, equipment });
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (scope) scope.TransferModel = api;
})(typeof window === 'undefined' ? null : window);
