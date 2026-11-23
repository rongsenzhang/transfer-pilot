(function () {
  'use strict';
  const test = require('node:test');
  const assert = require('node:assert/strict');
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const vm = require('node:vm');
  const window = {};
  const context = vm.createContext({window,Intl});
  for (const file of ['model.js', 'discover.js', 'commercial.js', 'programme.js']) {
    vm.runInContext(readFileSync(join(__dirname, '..', file), 'utf8'), context, {filename:file});
  }
  const {Discover, Commercial, Programme} = window;

  test('a fresh export contains a shared fictional case even with no tabs previously opened', () => {
    const state = {};
    const design = Discover.current(state);
    assert.ok(Programme.summary(state).includes(design.requirement));
    assert.ok(Discover.summary(state).includes(design.handover));
    assert.match(Commercial.summary(state), /£930/);
    assert.match(Programme.summary(state), /customer net £930 and provider contribution £800/i);
    assert.match(Programme.summary(state), /0 of 5/);
    assert.match(Programme.summary(state), /Decision awaiting review/);
  });
  test('a revised requirement and a performance-linked price appear together in the review', () => {
    const state = {
      discover: {selected:'spares',revisions:{spares:true},notes:{spares:'Confirm release authority on late shift.'}},
      commercial: {selected:'performance',inputs:{performanceFee:3200}},
      programme: {checks:{coverage:true},choice:'hold',reason:'Buyer to verify the stock register.'}
    };
    const design = Discover.current(state);
    const externalised = JSON.parse(JSON.stringify(state));
    const review = Programme.summary(externalised);
    const model = Commercial.current(externalised);
    assert.equal(design.revisionApplied, true);
    assert.match(design.handover,/distributor/);
    for (const value of [design.requirement, design.handover, design.measure, design.note]) assert.ok(review.includes(value), value);
    assert.match(review, /1 of 5/);
    assert.match(review, /Buyer to verify the stock register/);
    assert.ok(Math.abs(model.offer.customerNet - 514) < 1e-6);
    assert.ok(Math.abs(model.offer.contribution - 1216) < 1e-6);
    for (const summary of [Commercial.summary(externalised), review]) {
      assert.match(summary, /£514/);
      assert.match(summary, /£1,216/);
    }
    assert.equal(Programme.summary(state), review);
  });
  test('all five assumed gates still carry the current commercial warning on an uneconomic offer', () => {
    const state = {
      commercial:{selected:'performance',inputs:{recovery:0}},
      programme:{checks:{coverage:true,outcome:true,delivery:true,economics:true,people:true},choice:'go'}
    };
    const review = Programme.summary(state);
    assert.match(review,/5 of 5/);
    assert.match(review,/Both must be positive/);
    assert.match(review,/Decision awaiting review/);
    assert.ok(Commercial.current(state).offer.customerNet < 0);
    state.commercial.selected = 'baseline';
    assert.match(Programme.summary(state),/baseline/i);
    assert.match(Discover.summary(state),/Workshop note: No note entered/);
  });
})();
