# Narrow-road animal pickup queue

Animal pickup trips share the farm's service road. One pickup owns that route until it returns home; other pickup vehicles wait in their garage bays. The driver remains assigned, and animals stay in their pens until the normal loading step completes.

If two existing trips already meet on the road, a loaded returning vehicle gets priority. The outgoing pickup retraces its route in reverse and waits at the garage. The returning vehicle waits in place until that retreat is clear. The queued trip then restarts from its bay, preserving its original driver and pickup request.

Returning pickups finish their turn on the garage apron before reversing straight into a bay. This avoids swinging across a neighbouring queued truck.

Waiting and reversing states appear in the vehicle status text. Queue/yield state is saved with the trip; ownership is reconstructed on reload. Already loaded animals are retained.

Run `node scripts/check-farm-dispatch.cjs` for simultaneous pickups and recovery from an existing head-on queue. Browser validation also exercised the real chicken and pig routes with both garage layouts: both trips completed, delivering 10 chickens and 4 pigs with no runtime errors.

## Original roads and temporary passing

The loading-yard expansion was removed at the user's request. The original service roads, animal lots, fences and gates are restored. New pickup trips use layout 3 and the original pickup routes. Different pens can receive trucks together; the same pickup spot queues at the garage.

When a pickup truck is blocked, it can take a temporary grass-side route around the obstacle and rejoin its original route. The maneuver freezes the trip clock, checks the path against pen buildings, and checks swept vehicle collisions on every movement step. No extra roads are drawn. Older layout-2 saves also use this passing behavior on the restored routes; legacy layout-1 trips retain their recovery dispatcher.

Validation: original-layout and render-precision checks pass. The browser simulation completed chicken and large livestock pickups, exercised a passing maneuver, and reported no runtime errors.
