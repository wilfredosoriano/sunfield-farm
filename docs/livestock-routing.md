# Live animal routing

Live animals use `S.livestock`, separate from the bodega's `S.inv`. Existing saved live animals migrate without changing counts. Orders, refunds, manual sales, and katayan processing resolve live items through `stockFor`.

Collecting mature truck-carried animals opens a destination choice: Straight to Katayan or Deliver Live to Palengke. Animals stay on the same vehicle with the same driver. The onward trip follows existing farm tracks and roads; it does not unload at the bodega or add road meshes.

Katayan arrivals enter its outdoor holding inventory and queued processing. Only animals reserved for that delivery auto-process, when the katayan is idle and the butcher's fee is affordable. Busy or short-funded arrivals stay safely in the holding pen. Meat uses the existing Take to Bodega action. Legacy holdings remain available for manual processing or orders.

Palengke arrivals fill matching live-only buyer orders first, then sell the remainder at normal live-animal prices. Payment happens once at arrival. Neither destination credits live animals to bodega storage. Existing pickups without a destination safely finish into the holding inventory.

Validation: check-livestock.cjs tests migration, waiting for funds, batch isolation, and exactly-once fees. check-livestock-browser.cjs exercises real pig pickup, katayan processing and meat collection, chicken pickup, matching order fulfillment, sale, and vehicle return. All other regression checks pass.
