# Commercial model

The unit of analysis is one installed ball-transfer platform over a common twelve-month period. The decision is whether a proposed incremental support contract can create recoverable operating value for its customer while funding the supplier's delivery. All example figures are invented. They represent neither Alwayse pricing nor a measured client outcome.

## The three alternatives

| Arrangement | Customer obligation | Supplier obligation | Risk retained |
| --- | --- | --- | --- |
| Current arrangement | Continues existing support arrangements | No new service obligation | Customer carries the in-scope cost of unplanned interruptions |
| Fixed service fee | Pays the annual fixed fee | Provides planned visits, spares allowance and service reporting | Customer carries the difference between estimated and actual recovery |
| Performance-linked fee | Pays the list fee less earned credits | Delivers the same service and credits an agreed shortfall in hours recovered | Supplier takes a capped share of performance risk, customer retains losses beyond the cap |

Common capital cost and ordinary support expenditure cancel between alternatives. The provider's delivery cost is incremental to existing services. The site retains ownership of its equipment in all three alternatives. The performance clause is an option for an existing installation. A separate, optional case below explores acquiring new equipment on an annual service contract.

## Equations

Let **H** be attributable unplanned downtime hours, **r** the estimated reduction as a fraction, **v** the economic value per interrupted hour and **p** incremental planned interruption hours. Negative **r** allows a deterioration case. The baseline and trial need comparable workloads. Events outside the transfer platform are excluded.

| Quantity | Calculation |
| --- | --- |
| Baseline customer cost in scope | H × v |
| Recovered hours | H × r |
| Residual unplanned hours | H − recovered hours |
| Customer value before fees | (recovered hours − p) × v |
| Annual supplier direct cost | visits × labour and travel per visit + spares allowance + service coordination and reporting |
| Annual performance credit | smaller of [positive target shortfall in hours × credit per missed hour] and [list fee × credit cap fraction] |
| Net fee | fixed annual fee or performance list fee less credit |
| Customer cost with service | (residual unplanned hours + p) × v + net fee |
| Customer net value | baseline cost − customer cost with service |
| Supplier direct contribution | net fee − annual supplier direct cost |
| Effective fee corridor | from annual supplier direct cost to customer value before fees, inclusive |

The corridor uses the **effective fee collected after credits**. It exists if the upper bound is at least the lower bound. Equality means break-even for both parties. If planned disruption exceeds the value of recovered hours, customer value before fees can be negative. The model reports the resulting gap. A decision to pilot should also address the evidence behind the assumptions, access to site logs, contract exclusions, delivery capacity and positive margins.

## Worked synthetic example

At 48 lost hours per year and £225 per hour the current annual interruption cost is £10,800. At 35% recovery, 16.8 hours are recovered. Two planned hours absorb £450 of the £3,780 gross benefit. Four visits at £230 plus £320 in spares and £360 in coordination cost the supplier £1,600. The mutually viable effective annual fee spans £1,600–£3,330.

| Item | Current | Fixed fee | Performance-linked |
| --- | ---: | ---: | ---: |
| Nominal annual fee | £0 | £2,400 | £3,000 |
| Credit | £0 | £0 | £384 |
| Customer cost in scope | £10,800 | £9,870 | £10,086 |
| Customer net value vs current | £0 | £930 | £714 |
| Supplier incremental direct contribution | £0 | £800 | £1,016 |

The performance agreement targets 20 recovered hours. The 3.2-hour shortfall earns £384 at £120 per hour, below the annual cap of £1,200 (40% of the list fee). Actual settlement would require an agreed baseline, observation window, customer review and an attribution rule. The illustrative performance agreement never pays more credit than the annual fee. The design does not imply a full uptime guarantee.

## Interpreting downside and cost

The sensitivity table holds commercial terms and planned service commitments constant. It recomputes the selected plan for the analyst's estimate, zero effectiveness, a 10% deterioration in unplanned downtime and a site with no baseline downtime to recover. A service could still cause planned interruption at a site with no *unplanned* downtime. An idle or shut-down site with no economic loss should also set the relevant hourly value or planned interruption to zero.

Use marginal contribution lost, overtime or actual recovery costs to estimate the hourly value. Gross sales can overstate this amount when production is rescheduled. Supplier contribution excludes overhead, financing, tax, risk reserves and opportunity cost. Customer net value excludes hard-to-verify safety or sustainability gains and any change to existing expenditure. Validate the cost of measuring performance and settling disagreements within reporting and coordination. At present the same hourly rate values planned and unplanned interruption; adjust planned hours to incremental productive time lost, or extend the model if timing merits a distinct price.

## Optional acquisition case for new equipment

Open *New equipment: ownership or service?* to compare an outright purchase with equipment-as-a-service (EaaS). The customer buys, supports and ultimately recovers the value of the asset in the first option. In the EaaS option, the supplier owns and supports an equivalent asset and charges a fixed annual fee. Both options assume equal operating capacity, useful service and availability over the same term. This case uses its own inputs and contributes no figures to the installed-site renewal decision.

Let **P** be the customer purchase price, **C** the supplier's acquisition cost, **B** the customer's annual support cost under ownership, **S** the supplier's annual cost to service its equipment, **F** the annual EaaS fee and **R** the terminal net recovery to the owner. For **n** years discounted at annual fraction **d**, the terminal discount factor is **D = (1+d)⁻ⁿ**. The annuity factor **A = (1−D)/d** prices the end-of-year flows. At a zero discount rate **D = 1** and **A = n**.

| Quantity | Calculation |
| --- | --- |
| Customer present cost of buying | P + B × A − R × D |
| Customer present cost of EaaS | F × A |
| Customer saving from EaaS | Present cost of buying less present cost of EaaS |
| Supplier EaaS contract NPV | −C + (F − S) × A + R × D |
| Supplier break-even annual fee | (C + S × A − R × D) ÷ A |
| Buyer break-even annual fee | (P + B × A − R × D) ÷ A |

An economically feasible annual fee must be non-negative, at least the supplier's break-even price and no higher than the buyer's break-even price. At an endpoint one party may only break even. The supplier NPV measures the proposed service contract on a standalone basis. Choosing it over selling the unit outright would also require a reliable counterfactual sale margin and capacity analysis.

The synthetic default case uses a £12,000 purchase or £3,100 annual service fee over five years, £1,200 annual customer support, £9,000 supplier asset acquisition, £1,000 annual delivery, £2,000 net residual and a 5% discount rate. The customer incurs £15,628 present cost under purchase versus £13,421 under service, a £2,207 saving. Supplier contract NPV is £1,659. The indicative break-even fees round to £2,717 per year for the supplier and £3,610 for the buyer.

Acquisition takes place today. Fees and support costs occur at year-end. Residual recovery is net of disposal costs, paid to the owner at the end of the final year alongside the final annual payment. Use a consistent price basis and discount rate across all parties. The illustration assumes a common rate, constant prices, no debt, tax, inflation, credits or incremental uptime. Confirm buyer financing constraints, supplier cost of capital, insurance, asset condition and residual-market evidence before using an acquisition case commercially. The separate `equipment` record holds its eight optional inputs; an untouched export labels the illustrative defaults.

## Implementation and reproducibility

The browser and Node use the same pure functions from `model.js`. The selected plan and inputs are JSON-compatible:

```json
{"commercial":{"selected":"fixed","inputs":{"lostHours":48,"hourValue":225,"recovery":35,"plannedHours":2}}}
```

Missing fields adopt the synthetic defaults in `TransferModel.defaults`. The model rejects invalid values and fractional visit counts. The browser preserves the last valid case while an input is temporarily incomplete. `Commercial.current(state)` is available before the model screen is opened, and returns the selected option, its economics, the whole comparison and the inputs actually used. `Commercial.summary(state)` includes the assumptions and sensitivities used in the exported brief.

Run the checks using Node 18 or later from the project root:

```sh
node --test tests/model.test.cjs
```
