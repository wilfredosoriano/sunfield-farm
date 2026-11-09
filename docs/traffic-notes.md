# Traffic: what jams and why (Nov 9, 2026)

The stress test ran every vehicle system together for 10 simulated minutes: highway cars, residential cars, the farm-stop bus and jeepney, Sinag Liner buses, terminal jeepneys, tricycles, police patrol, warehouse vans, trader trucks and your truck and jeep on nonstop errands. It counted the jam breaker's "ghost" passes, where a stuck vehicle is let through others for 2.5 s, and the frames where two vehicles overlap.

| Build (2 highway cars, 600 s) | Ghost passes | Overlap frames |
| --- | --- | --- |
| Live game before this change | 83 | 653 |
| + no overtaking, one trike at a time in the stand | 59 | 71 |
| + highway cars visible again | 54 | 58 |

Single runs are noisy (±15 ghost passes).

## Fixed in this change

- **Overtaking.** A car passing in the oncoming lane could end up nose to nose with oncoming traffic. That was the main cause of vehicles driving through each other. Overtaking is off; cars follow.
- **Tricycle stand.** The stand's driveway over the culvert is one lane, so only one trike moves in it at a time.
- **Highway cars were invisible.** Since the "farm economy, mini-mart and traffic" commit, `spawnCar` hid every car (`spawnWait`) and nothing showed it again. Cars now appear once their lane is clear.
- **Farm yard.** A truck leaving its bay now lets one of your vehicles that is parking finish first. Before, the two could block each other on the garage apron for minutes.

## Still jamming, and why

All of these come from how traffic is modelled. Each vehicle follows its own route polyline and only checks "would my next step hit someone".

1. **Turns into or out of side roads and car parks.** A turning vehicle needs a clear path, but nothing makes main-road traffic keep the junction clear. Nothing decides who goes first either, so two vehicles can each wait for the other.
2. **Turns that span two neighbouring junctions.** Examples are the terminal bus entrance between the side street and the bus culvert, and parking swings at the edge of a junction. A vehicle can be part-way through one junction while waiting at the next.
3. **Car parks next to the highway.** Pulling out of a spot happens partly in the lane.

## Tried and dropped: junction tickets

I tried a ticket system on top of the existing routes. A vehicle needed a ticket for every junction box its manoeuvre touched, and the rules covered keeping the box clear, giving way to the main road, letting a long-waiting side-road car go first, and first-come first-served. It removed some deadlocks but created others: stale tickets, chains of overlapping boxes, conflicts with the farm-yard rules. In the same test it scored 32–67 ghost passes, no better than the simple fixes, at far more complexity.

## What will fix it

The lane network described to the user. Roads become one-way lanes joined at intersections by turn lanes. Each vehicle follows only the vehicle ahead in its own lane. Intersections have yield rules, no-blocking-the-box and traffic lights. Car parks and stops are side lanes off the road.

# Lane network, step 1 (Nov 10, 2026)

Town and highway NPC traffic now runs on a lane network (search `Lane network` in `public/index.html`). Your own vehicles are not on it yet (step 3).

## How it works

- Roads are one-way lanes. The highway, the end roads, the side street, the back road, the poblacion streets and the mountain road are each a pair of lanes. Junction boxes hold short turn lanes; the straight stretches inside a box are "soft" turn lanes.
- A vehicle keeps a position along its path of lanes and follows only what is ahead on that path (IDM speed, with curve speed limits).
- Before it enters a turn lane it needs a grant:
  - no vehicle on or holding a conflicting stretch (conflicts are precomputed per pair of lanes, with a wider envelope when a bus swings round a curve);
  - room for its whole body past the box. When boxes sit too close to stop between them, it is granted several at once. It may stop on a soft stretch, but never across the farm-road crossing.
  - The main road goes first by gap acceptance. Side roads go first come, first served. After 12 s a waiting side vehicle gets priority and the main road keeps clear of its crossing.
- Grants not yet used are given back while the vehicle can still stop. It is all or nothing, never half a manoeuvre.
- Car parks, the sakayan bay, the terminal bay and jeepney queue, the tricycle stand, the bagsakan shoulder and docks, and the factory yard are pockets off the road. Reversing out of a spot is a reverse lane.
- NPCs treat your vehicles as obstacles. They respect the part of your junction reservation you are driving, and give up a shop or stand that is blocked rather than wait in a through lane.

## Changes you will see

- Your vehicles unload at a loading spot at the west end of the palengke forecourt, entering and leaving along the forecourt lanes.
- The poultry store has one NPC parking spot (the other positions clash with the bagsakan shoulder and with your truck's turnaround). The farm shop's left spot moved to x = 112.5, and the palengke spots are now perpendicular bays.
- Your trip clock is no longer pushed back twice per blocked frame. Before, a long block froze your vehicle for minutes after the road cleared.

## Stress results (600 s, 8 highway cars, every NPC system; `DET` seeds)

| Run | Ghost passes | Overlap frames | Longest wait | Traffic cost per frame |
| --- | --- | --- | --- | --- |
| NPC only, seeds 3, 5, 7, 9 | 0 | 0 | 29–48 s | 0.06 ms |
| With your truck and jeep on nonstop errands, seeds 3, 7, 11 | 11 (all your vehicles) | 0 | 40 s | 0.08 ms |

- The waits over 20 s are all vehicles waiting in a pocket for a gap: a car backing out of a spot, the bus in its bay, the first tricycles at the stand. Nobody waits that long in a through lane.
- The 11 ghost passes are your truck and jeep blocking each other inside the farm yard, with no NPC involved. That is the farm-yard yield logic, which step 1 leaves alone.
- `check-loading-browser.cjs` fails on the previous commit too.
- Spikes up to about 30 ms happen once per new route (path search) and once when the network builds.

## Checks

- `check-lane-network.cjs` (new) runs every NPC route together for 15 minutes on the real lane code.
- `check-warehouse-traffic.cjs` and `check-town-traffic.cjs` were rebuilt on it.
- `check-residential-merge.cjs` and `check-residential-spawn.cjs` were removed; the new check covers them.
