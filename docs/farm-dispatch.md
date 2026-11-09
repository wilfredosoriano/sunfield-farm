# Narrow-road animal pickup queue

Animal pickup trips share the farm's service road. One pickup owns that route until it returns home; other pickup vehicles wait in their garage bays. The driver remains assigned, and animals stay in their pens until the normal loading step completes.

If two existing trips already meet on the road, a loaded returning vehicle gets priority. The outgoing pickup retraces its route in reverse and waits at the garage. The returning vehicle waits in place until that retreat is clear. The queued trip then restarts from its bay, preserving its original driver and pickup request.

Returning pickups finish their turn on the garage apron before reversing straight into a bay. This avoids swinging across a neighbouring queued truck.

Waiting and reversing states appear in the vehicle status text. Queue/yield state is saved with the trip; ownership is reconstructed on reload. Already loaded animals are retained.

Run `node scripts/check-farm-dispatch.cjs` for simultaneous pickups and recovery from an existing head-on queue. Browser validation also exercised the real chicken and pig routes with both garage layouts: both trips completed, delivering 10 chickens and 4 pigs with no runtime errors.

## Original roads, one-way loop and backing up

The loading-yard expansion was removed at the user's request. The original service roads, animal lots, fences and gates are restored.

The service road is a ring (garage front, east side, top, west side, bodega, back to the garage apron). New pickup trips (layout 3) all go round it the same way: out along the east side, back into the animal track, then on round the ring home. Nobody drives back the way they came, so pickups never meet head-on. Live-animal hauls to the katayan or the palengke also carry on round the ring and leave by the gate.

Egg runs pull up at the bodega on the way home. The driver carries the trays in through the front opening (about 12 seconds), and the eggs are added to the bodega stock then, once.

The farm roads (garage, ring, tracks, gate and the access road up from the highway) are one lane. A truck doesn't start onto them while one of your vehicles is coming the other way along the part it will use at about the same time. It waits in its bay, or at the farm entrance off the highway, and the status shows "Waiting for the … to clear the farm road". A truck already on the farm road keeps going. One turning in from the highway goes before one leaving its bay, so the highway is never held up for long. Otherwise the earlier trip goes first. Short reversing into a bay or track doesn't count as oncoming. Nobody waits more than a minute.

There is no grass-side passing any more. When two of your vehicles meet head-on, or block each other (say one turning out of a track into the nose of one waiting behind), one of them gives way. The loaded one keeps going; otherwise the later trip yields. The one giving way looks a few seconds along its own route in both directions and moves the way that gets it out of the other's path: backing up, or finishing a reverse into a track. It waits until their routes ahead no longer cross, then carries on. If it is boxed in, the other vehicle backs up instead. Status text shows "Backing up for the …" / "Waiting for the … to pass".

On every road, a vehicle stuck next to another stuck vehicle for a few seconds (a gridlock) gets a short pass to move on. Anything stuck for half a minute gets one regardless, so traffic always keeps flowing. Waiting for a gap in highway traffic does not count as a gridlock.

Validation: all `scripts/check-*.cjs` checks pass. A browser simulation ran egg, chicken and pig pickups together and a head-on meeting with an older-style trip at eight different timings. Every trip finished with no two vehicles touching.
