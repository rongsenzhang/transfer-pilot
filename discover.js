(function (scope) {
  'use strict';

  // Candidate-designed workshop prompts for one fictional, installed assembly deck.
  const priorities = {
    stops: {
      name: 'Unexplained line stops',
      stakeholder: 'Shift lead',
      question: 'Think of the last interrupted transfer. How would the next shift know whether the deck, the upstream station or something else caused the delay?',
      evidence: 'Match a shift entry to its work order. Ask the next shift to reconstruct the interruption independently.',
      requirement: 'Trace each interruption on the covered deck from the operator’s first report to a jointly reviewed event classification.',
      measure: 'Covered lost minutes per 100 scheduled operating hours. Use comparable baseline and trial shifts. Keep disputed minutes separate until both leads agree.',
      acceptance: 'Give both leads a mixed set of example entries. Each must distinguish a covered deck stop, an upstream delay and a disputed event.',
      touchpoints: [
        ['Report', 'Shift lead records deck ID, shift, start and end, including a zero-event entry on an uninterrupted shift.'],
        ['Triage', 'The service coordinator links the work order and flags an uncertain cause for the customer to review.'],
        ['Review', 'Customer and service leads reconcile disputed minutes at the weekly review.']
      ],
      capability: 'A common event glossary, a named service coordinator and access to comparable operating hours.',
      feedback: 'A night-shift lead can record elapsed time but cannot confirm the cause before handover.',
      revision: 'Allow a provisional cause and assign unresolved events to a named reviewer.',
      handover: 'The shift lead sends a classified event log to the service coordinator.',
      revisedHandover: 'The shift lead sends the time log with provisional causes. The service coordinator owns the open list until the customer lead confirms attribution.'
    },
    spares: {
      name: 'Unclear spares ownership',
      stakeholder: 'Maintenance buyer',
      question: 'When a replacement is needed, who can identify the right part, confirm its location and authorise replenishment?',
      evidence: 'Walk through an example stock issue with purchasing, the stores contact and the service partner. Compare their records.',
      requirement: 'Give each in-scope spare an agreed holder, replenishment trigger and person authorised to release it.',
      measure: 'Eligible spare requests fulfilled from agreed stock divided by all eligible requests. Report zero requests as no observation.',
      acceptance: 'Rehearse one issue and one stockout. Both routes must identify a part reference, accountable owner and documented next action.',
      touchpoints: [
        ['Identify', 'The maintenance lead provides the covered deck ID and approved spare reference.'],
        ['Release', 'The stores contact checks the agreed stock record and records the issue or stockout.'],
        ['Replenish', 'The buyer and service partner reconcile used stock and outstanding orders at the review.']
      ],
      capability: 'An agreed parts list, stock ownership record and matching purchase and service references.',
      feedback: 'The stores contact can see the part but cannot release distributor-owned stock.',
      revision: 'Add an authorised distributor contact and an approval record for consigned stock.',
      handover: 'The site stores contact releases agreed spares and passes the issue record to the buyer.',
      revisedHandover: 'Site stores routes a consigned-stock request to the distributor for release authority, then sends the approval and issue reference to the buyer.'
    },
    windows: {
      name: 'Missed service windows',
      stakeholder: 'Production planner',
      question: 'Which production windows could accommodate a visit, and who can change the booking when a shift or product run moves?',
      evidence: 'Trace a sample booking against the shift calendar. Ask the planner and service coordinator how a cancellation reaches the other party.',
      requirement: 'Agree a named booking owner, an access window and a rebooking route for every planned visit.',
      measure: 'Eligible visits completed inside the confirmed window divided by all eligible booked visits. Record cancellations and reasons separately.',
      acceptance: 'Rehearse a schedule change before the visit. The site and service team must share the same updated window, named contact and acknowledgement.',
      touchpoints: [
        ['Book', 'The planner proposes a window and the service coordinator confirms staffing and access.'],
        ['Confirm', 'The shift lead acknowledges the booking and logs any change to production.'],
        ['Close', 'The planner records attendance or cancellation and agrees a replacement window if needed.']
      ],
      capability: 'A shared booking record, a service roster and a deputy with authority to accept a revised appointment.',
      feedback: 'A booking confirmed by day shift can be overtaken by an evening production change.',
      revision: 'Require an incoming-shift acknowledgement and a dated rebooking owner when production changes.',
      handover: 'The planner passes the agreed visit time to the shift lead and service coordinator.',
      revisedHandover: 'The incoming shift acknowledges the current booking. On a change, the planner names a rebooking owner and the service coordinator confirms a new slot.'
    }
  };

  const ids = Object.keys(priorities);
  const noteLimit = 500;

  function current(state = {}) {
    const draft = state.discover || {};
    const id = Object.hasOwn(priorities, draft.selected) ? draft.selected : ids[0];
    const item = priorities[id];
    const revisionApplied = draft.revisions?.[id] === true;
    const savedNote = draft.notes?.[id];
    return {
      id, name: item.name, stakeholder: item.stakeholder, requirement: item.requirement,
      measure: item.measure, acceptance: item.acceptance, capability: item.capability,
      note: typeof savedNote === 'string' ? savedNote.slice(0, noteLimit) : '',
      revisionApplied, revision: item.revision,
      handover: revisionApplied ? item.revisedHandover : item.handover
    };
  }

  function summary(state = {}) {
    const result = current(state);
    const rows = [
      'Discovery workshop · fictional assembly deck',
      'Priority: ' + result.name + ' (' + result.stakeholder + ').',
      'Requirement: ' + result.requirement,
      'Measure: ' + result.measure,
      'Acceptance test: ' + result.acceptance,
      'Delivery capability: ' + result.capability,
      'Blueprint: ' + priorities[result.id].touchpoints.map(([step, action]) => step + ' — ' + action).join(' | '),
      'Illustrative revision ' + (result.revisionApplied ? 'adopted: ' + result.revision : 'available but not adopted.'),
      'Working handover: ' + result.handover,
      'Workshop note: ' + (result.note.trim() || 'No note entered.')
    ];
    for (const id of ids.filter(id => id !== result.id)) {
      const other = current({discover: {...state.discover, selected: id}});
      if (other.note.trim() || other.revisionApplied) {
        rows.push('Other draft · ' + other.name + (other.revisionApplied ? ' · revision adopted. ' + other.handover : '') + (other.note.trim() ? '\nWorkshop note: ' + other.note.trim() : ''));
      }
    }
    return rows.join('\n');
  }

  function render(root, state, save = () => {}) {
    const draft = typeof state.discover === 'object' && state.discover !== null ? state.discover : {};
    state.discover = draft;
    draft.selected = current(state).id;
    for (const key of ['notes', 'revisions']) {
      if (!draft[key] || typeof draft[key] !== 'object') draft[key] = {};
    }
    root.innerHTML = `<section class="ds-panel" aria-label="Customer discovery workshop">
      <fieldset class="ds-selector">
        <legend>Choose a workshop priority</legend>
        <p>Explore a fictional assembly site with one installed ball-transfer deck. Each role brings a different question to the workshop.</p>
        <div class="ds-options">${ids.map(id => `<label><input type="radio" name="ds-priority" value="${id}"${id === draft.selected ? ' checked' : ''}><span><b>${priorities[id].name}</b><small>${priorities[id].stakeholder}</small></span></label>`).join('')}</div>
      </fieldset>
      <div class="ds-content"></div>
    </section>`;
    const content = root.querySelector('.ds-content');

    function draw() {
      const selected = current(state);
      const item = priorities[selected.id];
      content.innerHTML = `<div class="ds-discovery">
        <section class="ds-interview"><h3>Ask the ${item.stakeholder.toLowerCase()}</h3><p class="ds-prompt">${item.question}</p><h4>Evidence to request</h4><p>${item.evidence}</p></section>
        <section class="ds-requirement"><h3>Service requirement</h3><p>${item.requirement}</p><h4>Delivery capability</h4><p>${item.capability}</p></section>
      </div>
      <section class="ds-blueprint"><h3>Service blueprint</h3><ol>${item.touchpoints.map(([step, action]) => `<li><strong>${step}</strong><p>${action}</p></li>`).join('')}</ol></section>
      <div class="ds-checks"><div><h4>Pilot measure</h4><p>${item.measure}</p></div><div><h4>Acceptance test</h4><p>${item.acceptance}</p></div></div>
      <section class="ds-workshop"><div class="ds-workshop-copy"><h3>Revise the handover</h3><h4>Fictional feedback</h4><p>${item.feedback}</p>
        <label class="ds-revision"><input type="checkbox" data-ds-revision${selected.revisionApplied ? ' checked' : ''}><span><strong>Adopt this revision</strong><small>${item.revision}</small></span></label>
        <div class="ds-handover"><h4>Working handover</h4><p data-ds-handover aria-live="polite"></p></div></div>
        <div class="ds-notes"><label for="ds-note">Workshop note</label><p id="ds-hint">Capture an open question or a proposed change for this priority. Your note appears in the review export.</p>
        <textarea id="ds-note" rows="4" maxlength="${noteLimit}" aria-describedby="ds-hint" placeholder="What would you verify with the customer?"></textarea></div>
      </section>`;
      const handover = content.querySelector('[data-ds-handover]');
      handover.textContent = selected.handover;
      const note = content.querySelector('#ds-note');
      note.value = selected.note;
      note.addEventListener('input', () => {
        draft.notes[selected.id] = note.value.slice(0, noteLimit);
        save();
      });
      const revision = content.querySelector('[data-ds-revision]');
      revision.addEventListener('change', () => {
        draft.revisions[selected.id] = revision.checked;
        handover.textContent = current(state).handover;
        save();
      });
    }
    for (const input of root.querySelectorAll('[name="ds-priority"]')) {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        draft.selected = input.value;
        draw();
        save();
      });
    }
    draw();
  }

  scope.Discover = Object.freeze({render, summary, current});
})(window);
