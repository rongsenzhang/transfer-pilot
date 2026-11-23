# Transfer Pilot

**Would a manufacturer and its customer both renew a service agreement for an installed ball-transfer platform?** Transfer Pilot lets a reviewer take that decision from a shop-floor question through service design, annual pricing and a pilot review.

**[Open the live demo](https://rongsenzhang.github.io/transfer-pilot/)** · **Version 1.0.0** · English · Phone and desktop

Rongsen Zhang developed this independent application portfolio project for the Aston University servitization KTP opportunity. UKRI identifies Alwayse Engineering as Aston's partner. Alwayse already offers maintenance and repair services. The proposed pilot explores how a customer and its supplier might agree the scope, ownership, price and renewal evidence for those services. The project uses public sources, fictional workshop material and illustrative operating costs. It has no affiliation with or endorsement from the partners. [UKRI project 10146336](https://gtr.ukri.org/projects?ref=10146336) · [Alwayse maintenance services](https://www.alwayse.com/ball-transfer-maintenance-services/)

## Try a three-minute review

1. **Choose a customer problem.** Open discovery and choose *Unclear spares ownership*. Read the maintenance buyer's question. Adopt the fictional feedback about distributor-owned stock and see who now has authority to release a part. Add a question you would ask the buyer.
2. **Test the deal.** Compare the current arrangement with fixed and performance-linked annual fees. Under the default fixed plan the customer gains £930 per year and the supplier earns £800 before shared overhead and tax. Change the expected downtime reduction from 35% to 0% and watch customer value turn negative. Restore 35% or choose another arrangement to take into the review. For a new installation, open **New equipment: ownership or service?** to compare the present cost of an upfront purchase with equipment-as-a-service over a configurable term.
3. **Make a decision.** At the renewal review, inspect the proposed 90-day field trial. Choose *Hold*, record the evidence you still need, and identify its owner. *Go* requires five assumed review gates and positive customer and supplier economics on a service offer. The gates represent a review exercise.
4. **Export your case.** Open *Pilot brief* and choose *Download brief (.txt)* or *Print or save PDF*. The brief keeps the selected requirement, assumptions, financial results, review gates and decision together. Other reviewers can open the public project with a fresh case of their own.

## Read the project

| Reviewer question | Project material |
| --- | --- |
| What does Alwayse sell already? Which alternatives could a buyer consider? | [Company, competition and sources](docs/company-and-market.md) |
| How does this work connect to the original job description and person specification? | [Duty-by-duty coverage](docs/role-coverage.md) |
| How do the fees, performance credits and downside cases work? | [Financial assumptions, equations and worked example](docs/model.md) |
| How could a company recruit a pilot, train colleagues and carry the research forward? | [Delivery, launch and handover field guide](docs/field-guide.md) |
| How is the software organised, and how can a reviewer reproduce the checks? | [Technical route and validation](docs/technical-route.md) |

## Run locally

The project is a static website written in HTML, CSS and JavaScript. No API key, build system or package installation is needed. From a local copy of this repository:

```sh
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000/). Run the automated checks with Node 18 or later:

```sh
node --test tests/*.test.cjs
```

Use the demo for fictional scenarios. Real validation would require permission to use site records, joint event attribution, confirmation of delivery cost and a buyer's decision at renewal.
