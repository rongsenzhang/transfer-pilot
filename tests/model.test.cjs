(function () {
  'use strict';
  const test = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs');
  const vm = require('node:vm');
  const path = require('node:path');
  const model = require('../model.js');

  function near(actual, expected) {
    assert.ok(Math.abs(actual - expected) < 0.000001, `Expected ${actual} to be within £0.000001 of ${expected}`);
  }
  test('illustrative case can be reconstructed on both sides of the contract', () => {
    const r = model.evaluate();
    near(r.recoveredHours, 16.8); near(r.baselineCost, 10800);
    near(r.remainingHours, 31.2); near(r.plannedCost, 450);
    near(r.directCost, 1600); near(r.ceiling, 3330);
    near(r.credit, 384); near(r.fixed.customerNet, 930); near(r.fixed.contribution, 800);
    near(r.performance.customerNet, 714); near(r.performance.contribution, 1016);
    assert.equal(r.corridorFeasible, true);
  });
  test('cash flows reconcile for any fee; credit transfers value once only', () => {
    const r = model.evaluate({ fixedFee:1200, performanceFee:901, capPercent:13.7 });
    for (const o of [r.fixed, r.performance]) {
      near(o.customerCost + o.customerNet, r.baselineCost);
      near(o.customerNet + o.contribution, r.ceiling - r.directCost);
    }
    near(r.performance.fee + r.credit, 901);
  });
  test('no improvement can bind the credit cap while no workload still incurs service commitments', () => {
    const rows = model.sensitivity();
    assert.equal(rows.length, 4);
    near(rows[1].result.credit,1200);
    near(rows[1].result.performance.fee,1800);
    near(rows[3].result.baselineCost,0);
    near(rows[3].result.fixed.customerNet,-2850);
    near(rows[3].result.performance.contribution,200);
    assert.equal(rows[3].result.corridorFeasible,false);
    assert.ok(rows[2].result.recoveredHours < 0);
  });
  test('exceeding target creates no credit; full credit cannot create negative fees', () => {
    near(model.evaluate({recovery:100}).credit,0);
    const r = model.evaluate({recovery:0,capPercent:100,targetHours:200,creditRate:1000});
    near(r.performance.fee,0);
    near(r.performance.contribution,-r.directCost);
    near(model.evaluate({capPercent:0}).credit,0);
  });
  test('break-even boundary, zero price, zero costs and negative value all remain meaningful', () => {
    const zero = Object.fromEntries(Object.keys(model.defaults).map(k => [k,0]));
    const r = model.evaluate(zero);
    near(r.room,0); assert.equal(r.corridorFeasible,true);
    near(r.performance.customerCost,0); near(r.performance.contribution,0);
    assert.equal(model.evaluate({hourValue:0}).corridorFeasible,false);
    assert.equal(model.evaluate({plannedHours:50}).corridorFeasible,false);
  });
  test('rejects non-finite, fractional visits, out-of-range and nonnumeric inputs', () => {
    for (const a of [{recovery:101},{recovery:-101},{hourValue:Infinity},{lostHours:NaN},{visits:2.5},{fixedFee:-1},{creditRate:'12'},{hourValue:null}]) {
      assert.throws(() => model.evaluate(a),RangeError);
    }
    assert.equal(model.valid('unrecognisedField',3), false);
  });
  test('export and pilot gate use the same values before the commercial page is opened', () => {
    const scope = {TransferModel:model};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../commercial.js'),'utf8'),{window:scope,Intl});
    const c = scope.Commercial;
    near(c.current({}).offer.customerNet,930);
    assert.match(c.summary({}),/£930/);
    assert.match(c.summary({}),/No baseline downtime/);
    assert.equal(c.current({commercial:{selected:'baseline',inputs:{hourValue:'bad'}}}).selected,'baseline');
    near(c.current({commercial:{selected:'performance',inputs:{}}}).offer.contribution,1016);
    assert.equal(c.current({commercial:{selected:'__proto__'}}).selected,'fixed');
  });

  test('greenfield buy, service and supplier PV reconcile against year-by-year cash flow', () => {
    const a = model.equipment.defaults;
    const r = model.equipment.evaluate();
    let buy = a.customerPrice, service = 0, supplier = -a.assetCost;
    for (let year = 1; year <= a.term; year++) {
      const divisor = (1+a.discount/100) ** year;
      buy += a.customerSupport/divisor;
      service += a.annualFee/divisor;
      supplier += (a.annualFee-a.deliveryCost)/divisor;
      if (year === a.term) { buy -= a.residual/divisor; supplier += a.residual/divisor; }
    }
    near(r.buyCostPV,buy); near(r.serviceCostPV,service); near(r.supplierNPV,supplier);
    near(r.customerSaving,buy-service);
    near(model.equipment.evaluate({annualFee:r.floor}).supplierNPV,0);
    near(model.equipment.evaluate({annualFee:r.ceiling}).customerSaving,0);
    assert.ok(r.corridorFeasible && r.room > 0);
  });
  test('zero or tiny discount, negative surplus and non-negative quote bound are handled', () => {
    const zero = model.equipment.evaluate({discount:0});
    near(zero.annuity,5); near(zero.residualPV,2000);
    near(zero.buyCostPV,16000); near(zero.serviceCostPV,15500);
    near(zero.supplierNPV,3500); near(zero.customerSaving,500);
    const tiny = model.equipment.evaluate({discount:1e-12});
    near(tiny.annuity,5); near(tiny.customerSaving,500);
    const adverse = model.equipment.evaluate({assetCost:26000});
    assert.equal(adverse.corridorFeasible,false); assert.ok(adverse.room < 0);
    const recovery = model.equipment.evaluate({assetCost:0,deliveryCost:0});
    assert.ok(recovery.requiredFee < 0); near(recovery.floor,0);
    const parity = model.equipment.evaluate({discount:0,customerPrice:9000,customerSupport:1000});
    assert.ok(parity.corridorFeasible); near(parity.room,0);
    for (const invalid of [{term:0},{term:2.5},{discount:-1},{annualFee:Infinity},{assetCost:null}]) {
      assert.throws(() => model.equipment.evaluate(invalid),RangeError);
    }
  });
  test('optional acquisition edits are labelled and leave installed-site economics untouched', () => {
    const scope = {TransferModel:model};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../commercial.js'),'utf8'),{window:scope,Intl});
    const state = {equipment:{discount:0,annualFee:5000}};
    assert.match(scope.Commercial.summary({}), /Optional acquisition illustration · illustrative defaults/);
    assert.match(scope.Commercial.summary(state), /Optional acquisition illustration · reviewer inputs/);
    assert.match(scope.Commercial.summary(state), /service cost PV £25,000/);
    near(scope.Commercial.current(state).offer.customerNet,930);
  });
})();
