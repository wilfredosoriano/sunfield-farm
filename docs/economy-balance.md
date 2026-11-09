# Relaxed economy balance — November 9, 2026

The previous feed calculation rounded every meal up to a whole sack. A single pig consumed the same number of sacks as four pigs. A small laying flock could also spend more on feed than its eggs earned. Buying another crate to fill a nearly full house discarded the animals that did not fit.

Feed now uses the herd's proportional ration, retaining the remainder of an opened sack in the house. Purchased stock remains in whole sacks. Spare animals from opened crates remain available for later restocking. Both reserves persist in the existing save.

## Prices and ordinary batches

Piglets cost ₱300 instead of ₱500; a grown live pig sells for ₱1,200 instead of ₱1,000. Hog feed costs ₱14 instead of ₱24. Chicken, fish, and dairy feed, young animals, medicine, vaccines, and basic groceries also cost less. Meat prices increased, and processing fees decreased so processing still earns more than selling the same animal live at the palengke.

Level-one batches, healthy and continuously fed:

| Batch | Young animal purchases | Feed | Sale revenue | Cash surplus |
| --- | ---: | ---: | ---: | ---: |
| 10 broilers, live at palengke | ₱100 | ₱168 | ₱1,100 | ₱832 |
| 4 pigs, live at palengke | ₱1,200 | ₱280 | ₱4,800 | ₱3,320 |
| 60 tilapia, bagsakan at 70% | ₱160 | ₱120 | ₱1,176 | ₱896 |

The tilapia purchase leaves 40 spare fingerlings. Surplus excludes buildings, transport capacity, and occasional health care. One pig needs about ₱70 of feed during its three-day growth period, rather than paying for a whole sack every meal.

## Pace and care

- Growth: hens/ducks 1 game day, broilers/goats 1.5, cows/tilapia 2, pigs 3. A game day remains 13 minutes.
- Seasonal event rolls: 20%, previously 50%, with at least four game months between events of the same type.
- Flu exposure: 0.00015 per active second during an outbreak, previously 0.001. Vaccines last 24 game days, previously 12. Medicine also grants four days of protection.
- Heat: watering remains effective for a full game day.
- Neglect: warning after 13 active minutes; losses only after at least 26 active minutes plus the loss interval, rather than roughly 7.5 minutes. Loss intervals are three minutes, with smaller losses. Offline time does not accumulate neglect.
- A 24-plot plow/plant/water/harvest day uses 25.2 energy in actions plus 8 passive energy. Hunger falls by 25 per day plus small action costs. Idle farmers recover slowly; a 12-second rest restores up to 72 energy.

## Existing saves

Each existing stocked farm receives one recovery package: ₱1,500, 12 sacks of each feed type, two vaccines, and two medicines. Existing sick animals recover, stress resets, and hunger/energy rise to at least 80. A saved version marker prevents repeated grants. Outstanding orders are raised to at least 120% of the updated item value; higher existing quotes are retained. Already loaded or dispatched sale agreements retain their quoted payment.

## Verification

Run `node scripts/check-economy.cjs`. It checks actual production and feeding functions across 18 meat-herd cases and 24 layer/dairy margins, opened-feed reserves, surplus animals, processing margins, relief-package idempotency, care settings, energy costs, and inline JavaScript syntax.
