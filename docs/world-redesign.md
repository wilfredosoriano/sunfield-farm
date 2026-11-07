# World redesign: audit and blueprint

Reference: the "Philippine Farming Simulator – World Map (Game Concept)" illustration.
The whole game lives in `public/index.html` (Three.js r128 from cdnjs, no build step, no GLB/GLTF assets: every model is procedural geometry merged into a few meshes).

## What already matched the reference (kept as is)

| Reference area | In the game | Where (world units, x east, z south; highway along z = -110) |
|---|---|---|
| Farm (player base) | 12x12 crop field, bakuran with pasture / babuyan + palaisdaan / manukan zones, lot fence and SUNFIELD FARM gate | field centred at (0, 0); bakuran x -45..-9, z -31..-15; lot x -48..32.5, z -32.6..19.5 |
| Farmhouse, 4-car garage | 4 house levels, garage up to 4 bays (jeep, truck, sedan, van) | movable by the player, saved in `S.housePos` / `S.garagePos` |
| Egg / broiler houses, pigs, cows, ducks, goats, tilapia pond | 3x3 buildings the player places and upgrades | bakuran tiles `S.tiles[NF..NT]` |
| Farm access dirt road | rough road with ruts, potholes and suspension | x 5..34 along z -14.5, then north along x = 34 |
| Highway | 2-lane road with markings, posts, lamps, traffic, jeepneys, bus stop | z = -110 |
| Palengke, hardware, poultry supply, Binhi store | full shops with vendors, shoppers, tricycles, loading boys | palengke x 170; hardware x -60; poultry x 92; Binhi x -18 |
| Warehouse / bagsakan | dock, roll-up doors, kargador, other traders' trucks | x 62 |
| Meat-buying factory | Mega Foods compound, gate and guard, conveyor shed, 3 closed vans | x 395 (333 units from the warehouse) |
| Closed vans warehouse → factory | real routes on the highway lanes, load / unload states | `vans`, `updateBiz()` |
| Three hireable workers | Taniman / Ani / Biyahero roles, wages, level-gated slots | `HIRE_FEE`, `helperSlots()` |

Because houses, garages, buildings, vehicles and worker jobs all depend on these coordinates and on saved tile indexes,
nothing that gameplay or saves depend on was moved. Old saves load unchanged; no migration is needed.

## Added in this redesign

| Area | Where | Notes |
|---|---|---|
| Halamanan (orchard) | `ORCH` x 15.5..31.5, z -11.2..4.2 | mangga, kalamansi, bayabas, saging, path, fruit kubol, sign. Decorative: the Mango tree you build is still the one that produces |
| Talyer at imbakan (utility yard) | `UTIL` x -47..-29.5, z -12.4..4 | water tower, workshop, feed bodega, kuliglig shed, path to the field |
| Sari-sari store | `SARI` x 16.5..28 by the highway | tindera, bench, cooler, motorsiklo |
| Road signs | farm-road junction (x 30.6 / 37.4), km posts along the highway | direction signs are one-sided so arrows never read backwards |
| Trees | windbreak outside the lot fence; countryside and roadside trees now reach the factory (x up to 460) | |
| Hills and mountains | low hills past the farm, town and factory; hazy mountain ring with a Mayon-like volcano | the ring follows the camera like a backdrop and darkens at night; lowest camera tilt 0.45 → 0.28 rad so the horizon can be seen |
| Factory conveyor | `facRun` in `updateBiz()` | runs only while a van unloads your goods and ~24 s after; otherwise empty and the workers idle |
| Worker looks | `spawnHelper()` | each of the 3 slots has its own clothes and hat; roles, wages and the limit are unchanged |

## Performance

`instR()` used to draw every instanced tree, grass tuft and rice tuft everywhere, every frame, in both the camera and shadow passes
(r128 turns culling off for instanced meshes). It now splits each list into 48 m cells with their own bounding spheres and enables culling.
Measured with 20 back-to-back renders in the dev browser:

| View | Original | Redesign |
|---|---|---|
| Farm | 12.1 ms, 1.01 M tris | 10.9 ms, 0.47 M tris |
| Town | 9.4 ms, 1.08 M tris | 7.1 ms, 0.26 M tris |
| Factory | 9.4 ms, 1.00 M tris | 5.8 ms, 0.11 M tris |

Not yet measured on a phone.

## Not done, and why

- **Rigged GLB/GLTF characters with AnimationMixer.** The project has no 3D character assets. People are procedural jointed models
  (arms, legs, knees) with walk / stand / sit / carry poses driven in code. Real rigged characters need licensed or commissioned `.glb`
  files plus a loader; once there are files, `makePerson()` is the one place to swap in.
- **Navmesh / Rapier physics.** NPCs and vehicles follow hand-made routes (`mkRoute`) and fixed paths; there is no collision system to
  extend. Adding a navmesh or Rapier is a separate project and was not started.
- **Terrain height under gameplay areas.** The farm, roads and towns stay flat because every building, vehicle and person is placed at
  ground height 0; hills are only where nothing is built.
- **Moving the farmhouse to the centre of the farm** as in the illustration: the player already chooses where their house and garage go.

## Testing

Run `npx serve public` (or the `sunfield` entry in `.claude/launch.json`), open `/?debug`, and use `SF` in the console
(`SF.cam`, `SF.noon()`, `SF.S`) to fly around and set the time. Checked: no console errors; farm, orchard, utility yard, junction,
factory; hiring 3 workers (limit holds); a warehouse-to-factory delivery starts the conveyor.
