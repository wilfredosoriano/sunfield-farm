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
