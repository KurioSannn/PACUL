# Smoke Test Guide — End-to-End (Manual)

Run these scenarios against a deployed or local stack (`backend/` + frontend) using **demo accounts** from [README.md](./README.md#demo-accounts).

**Prerequisites**

- Backend running (`npm run start:dev` or deployed URL).
- Frontend running and pointed at backend API.
- Migrations applied; `npm run db:setup` completed.
- Demo seed run (`npm run db:seed`) OR fresh data created during tests.
- `AI_USE_MOCK_CLASSIFIER=true` for predictable classification.

**Demo credentials** (password = `DEMO_PASSWORD` env or `PaculDemo2025!`):

| Role | Email |
| --- | --- |
| Household | `household1@pacul-demo.com` |
| Collector | `collector1@pacul-demo.com` |
| Industry | `industry1@pacul-demo.com` |

Mark each scenario **PASS** or **FAIL**. All five must **PASS** before opening a backend PR.

---

## Scenario 1 — Household listing flow

**Actor:** `household1@pacul-demo.com`

| Step | Action | Expected result | PASS / FAIL |
| --- | --- | --- | --- |
| 1.1 | Sign in as household | Dashboard loads; role = household | |
| 1.2 | Upload waste image | Upload succeeds; path returned | |
| 1.3 | Classify image | Mock classification returns category + confidence | |
| 1.4 | Create listing (draft) | Listing saved as `draft` | |
| 1.5 | Publish listing | Status → `available` | |
| 1.6 | Verify marketplace | Collector view shows listing in available waste | |

**Notes:** _______________________________________________

---

## Scenario 2 — Collector pickup & route

**Actor:** `collector1@pacul-demo.com`

| Step | Action | Expected result | PASS / FAIL |
| --- | --- | --- | --- |
| 2.1 | Open available waste | Seeded or newly published listing visible | |
| 2.2 | Claim listing | Pickup claim created (`claimed`) | |
| 2.3 | Preview route | Route preview with stops, distance, cost estimate | |
| 2.4 | Commit route | Route status → `ongoing` (or equivalent active state) | |
| 2.5 | Update stop / route status | Route progresses through planned states | |
| 2.6 | Mark picked up / complete route | Listing status → `picked_up`; claim completed | |

**Notes:** _______________________________________________

---

## Scenario 3 — Collector material batch → industry marketplace

**Actors:** `collector1@pacul-demo.com`, then `industry1@pacul-demo.com`

| Step | Action | Expected result | PASS / FAIL |
| --- | --- | --- | --- |
| 3.1 | Create material batch | Batch in `draft` or sorting state | |
| 3.2 | Add source listings | Sources linked to picked-up waste | |
| 3.3 | Mark sorting complete | Batch ready for publish | |
| 3.4 | Publish batch | Status → `available` on marketplace | |
| 3.5 | Sign in as industry | Industry dashboard loads | |
| 3.6 | Browse `/materials` (or equivalent) | Published batch visible with price/weight | |

**Notes:** _______________________________________________

---

## Scenario 4 — Order, negotiation, completion & traceability

**Actors:** `industry1@pacul-demo.com`, `collector1@pacul-demo.com`

| Step | Action | Expected result | PASS / FAIL |
| --- | --- | --- | --- |
| 4.1 | Industry creates order on batch | Order status `created` / `negotiating` | |
| 4.2 | Start negotiation | Thread open; initial offer recorded | |
| 4.3 | Industry sends offer | Offer visible to collector | |
| 4.4 | Collector counters | Counter-offer recorded | |
| 4.5 | Industry accepts | Order → `accepted`; agreed price/weight set | |
| 4.6 | Simulate / progress transaction | Transaction simulation succeeds | |
| 4.7 | Complete order | Order → `completed`; batch → `sold` | |
| 4.8 | View material traceability timeline | Full chain: waste → batch → order → completion | |
| 4.9 | View order traceability timeline | Order events + linked batch events chronological | |

**Notes:** _______________________________________________

---

## Scenario 5 — Rating & report export

**Actors:** `household1@pacul-demo.com`, `industry1@pacul-demo.com`

| Step | Action | Expected result | PASS / FAIL |
| --- | --- | --- | --- |
| 5.1 | Household rates collector (post-pickup) | Rating saved; summary updates | |
| 5.2 | Industry requests PDF export | Export job created (`pending` / `processing`) | |
| 5.3 | Poll export status | Status → `ready` within reasonable time | |
| 5.4 | Download PDF | File opens; valid PDF (starts with `%PDF`) | |
| 5.5 | Verify report content | Contains expected metrics for industry scope | |

**Notes:** _______________________________________________

---

## Sign-off

| Check | PASS / FAIL |
| --- | --- |
| Scenario 1 — Household listing | |
| Scenario 2 — Collector pickup | |
| Scenario 3 — Material marketplace | |
| Scenario 4 — Order & traceability | |
| Scenario 5 — Rating & reports | |
| **All scenarios PASS** | |

**Tester:** _______________ **Date:** _______________ **Environment:** _______________
