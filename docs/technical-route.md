# Technical route for v1.0.0

The design starts with a decision the KTP associate might facilitate. For an existing installation, can a customer agree an outcome it values, can the supplier deliver it at a sustainable price, and what evidence would justify a renewal? A single shared case connects the questions. The English web interface opens directly at a public GitHub Pages address from a phone or a computer.

## From business evidence to implementation

| Stage | Implementation decision | Output a reviewer can inspect |
| --- | --- | --- |
| Establish the business baseline | Read the supplied Aston specification, UKRI project abstract and public company, customer-project and competitor pages. Preserve a distinction between documented services, vendor-reported outcomes and candidate proposals. | Company and market review, role crosswalk and primary sources |
| Choose a bounded application | Use one fictional assembly deck already in service. Hold ownership of the asset and ordinary support costs constant. | Shared case and three workshop priorities |
| Discover and co-design | Translate each role's problem into a requirement, operating handover, metric and acceptance test. A draft note and a reversible service revision capture workshop choices. | Working service blueprint with its assumptions |
| Compare contracts | Implement one deterministic annual model for the existing arrangement, fixed service and capped performance credits. Use the same calculations for the screen, decision review and text export. | Both parties' economics, break-even fee interval and sensitivity cases |
| Rehearse commercialisation | Link the decision to a proposed 90-day trial, responsibilities, evidence rules, unit economics and go-to-market plan. Include a research design, teach-back and ownership transfer. | Go/Hold/Stop review and a handover field guide |
| Publish and check | Serve the repository as static assets from GitHub Pages. Use local paths relative to the project and no runtime dependencies for calculations. | Versioned public source, test command and shareable review brief |

## Runtime architecture

The HTML entry point loads ordinary classic scripts in dependency order. No transpiler, database or API is required. Each feature receives a DOM root, the current case and a save callback. Browser code renders the workspace, handles input and extracts text summaries for export. Edit one module, return to another and the same state is available.

| File | Responsibility |
| --- | --- |
| `index.html`, `styles.css` and `app.js` | Page structure, hash-based navigation, responsive layout, local storage, text download and browser print |
| `discover.js` | Defines the three fictional priorities, normalises the selected requirement and updates workshop notes and revisions |
| `model.js` | Pure input validation, annual cash flows, risk-sharing credits and sensitivity calculations, available in browsers and Node |
| `commercial.js` | Renders numeric inputs, supplies default or edited economics and exposes the same results to the decision and export |
| `programme.js` | Explains the field trial and review gates, captures a review decision and provides the decision summary |
| `evidence.js` and `evidence.css` | Expose cited company, competition and job evidence alongside the simulation |
| `discover.css`, `commercial.css`, `programme.css` | Module layouts, inputs and narrower-screen adaptations |
| `docs/` and `tests/` | Source review, commercial calculations, field protocol, responsibility crosswalk and reproducible regression checks |
| `assets/deck.jpg` and `tools/render_deck.py` | A pre-rendered illustration and its optional NumPy/Pillow reconstruction script; the browser loads the JPEG directly |

The installed-site case contains `discover`, `commercial` and `programme` records. A separate `equipment` record stores an optional greenfield comparison of buying equipment and paying for supplier-owned equipment as a service. Both parties’ cash flows are discounted over the same term. This calculation is kept separate from the installed-asset renewal decision. Each feature owns its own fields. The commercial model produces derived values from inputs, so switching arrangement cannot leave an obsolete copied fee or margin. Summaries also work before the reviewer visits a module. A recorded decision retains its original basis if the active requirement or pricing is later changed. The text export records the case as it stood at download. Edits persist locally in the browser when storage is available. If local storage is unavailable, the reviewer can still download the in-tab draft.

## Evidence and modelling decisions

**Public evidence.** The sources identify the partner, current offerings, service channels and industrial applications. They support a reason to explore the proposed pilot. Individual company case-study improvements apply to those reported installations. They do not quantify the impact of this proposed contract. [Company and market review](company-and-market.md)

**Fictional exercise.** The shift lead, maintenance buyer, planner, feedback and attributed events are fictional. The default 48 hours, £225 per hour and 35% estimated recovery are editable as soon as the reviewer opens the model. Estimated effects are independent of the selected workshop priority. In the field, the team would need to demonstrate that a revised handover actually changes attributable lost time. [Discovery and field protocol](field-guide.md)

**Cash flows.** Annual customer net value compares the service offer with the baseline at one installed site. Supplier contribution deducts attributable delivery cost. A performance credit shifts value between parties, bounded by the contract cap. Finite, in-range inputs are required, and a visit count must be whole. Temporarily invalid edits leave the last valid case in force. [Equations, scope and downside](model.md)

**Human judgement.** Marked gates indicate what the reviewer elects to assume in this exercise. A positive margin alone cannot justify a real renewal. The trial would require comparable shift records, customer and service-owner agreement, and an explicit explanation of missing or disputed observations. The pilot plan is a candidate proposal, subject to agreement with both partners. [Field guide](field-guide.md)

## Validation plan

| Check | What to exercise | Passing behaviour |
| --- | --- | --- |
| Model reconciliation | Defaults, alternative prices, full or zero credit, matching break-even bounds | Customer costs and net value reconcile to baseline, credit appears once and both parties' values sum to the available economic benefit |
| Adverse operation | No improvement, worsening downtime, no baseline downtime, no valid price corridor | Losses, binding caps and missing economic room remain visible |
| Inputs | Blank, negative or unlimited values outside defined bounds, fractional visits | Invalid edits are identified; calculations retain the last usable assumptions |
| Cross-module state | Adopt a discovery revision, select contract terms, read programme and export summaries | The requirement, handover, financial figures and decision describe one case |
| Decision | Select baseline or a loss-making fee, leave a gate open, write a reason and select Hold | Go requires all five gates and positive economics for both parties. Hold or Stop can capture a reason when evidence is missing |
| Browser interaction | Navigate all sections at phone and desktop widths, use labels with a keyboard, change an input, return and export | Controls remain reachable, the case survives navigation, and the brief can be read without access to the browser state |
| Deployment | Open the public project URL as a visitor and request the dependent scripts and styles under the project path | The application and its relative asset URLs resolve without a GitHub login |

Run the automated checks using `node --test tests/*.test.cjs`. The browser and deployment rows also require functional checks against the running version. The [README](../README.md) gives the local server command and a short review sequence.
