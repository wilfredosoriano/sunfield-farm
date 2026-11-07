// Proposed organic farm layout (revision 2). World units are metres: x runs east, z runs south, the highway is at z = -110.
// This file is the single source for the planning map (docs/farm-plan.svg, built by docs/build-farm-plan.js) and is meant to
// become the game's FARM layout config when the redesign is implemented, so the plan and the game cannot drift apart.
const FARM = {
  // the lot fence follows the land instead of a rectangle (smoothed through these points)
  fence: [[38,-36],[39,-6],[41,24],[37,54],[22,76],[-6,86],[-44,85],[-82,78],[-106,56],[-111,16],[-106,-18],[-88,-42],[-50,-45],[-10,-43]],
  gate: {x:38.6, z:-17, w:6},
  // roads: centre-line control points (smooth Catmull-Rom curve through them) and width in metres
  roads: [
    {id:'access',  kind:'farm road: dirt with gravel shoulders', w:4.5, pts:[[34,-104],[31,-88],[36,-70],[42,-54],[42,-36],[40,-23],[37.5,-17]]},
    {id:'service', kind:'main farm service road: dirt', w:4.5, pts:[[37.5,-17],[26,-13],[12,-11],[-4,-10],[-18,-10.5],[-30,-11],[-40,-13],[-52,-8],[-56,4],[-52,20],[-44,40],[-40,53],[-28,58],[-10,56],[8,53],[17,41],[17,23],[17,3],[21,-8],[26,-13]]},
    {id:'t-water', kind:'farm vehicle track', w:3.5, pts:[[-30,-11],[-34,-15],[-36,-18.5]]},
    {id:'t-goat',  kind:'farm vehicle track', w:3.5, pts:[[-56,2],[-66,1],[-74,0]]},
    {id:'t-cow',   kind:'farm vehicle track', w:3.5, pts:[[-53,18],[-58,24],[-62,27]]},
    {id:'t-broil', kind:'farm vehicle track', w:3.5, pts:[[-44.5,37],[-38,37]]},
    {id:'t-egg',   kind:'farm vehicle track', w:3.5, pts:[[17,37],[12,37]]},
    {id:'t-pig',   kind:'farm vehicle track', w:3.5, pts:[[-22,57.5],[-20,62]]},
    {id:'p-house', kind:'footpath', w:1.5, pts:[[0,-10],[0,-12.5]]},
    {id:'p-field', kind:'footpath (round the beds)', w:1.5, pts:[[-14.5,-9],[-14.5,19],[14.5,19],[14.5,-9],[-14.5,-9]]},
    {id:'p-poultry',kind:'footpath', w:1.5, pts:[[-15,21],[-15,51]]},
    {id:'p-dike',  kind:'footpath on the pond dike', w:1.5, pts:[[-54,-27.75],[-22,-27.75]]},
  ],
  turning: [{x:14,z:-12,r:7,name:'garage apron'},{x:-27,z:-15,r:7,name:'bodega yard'},{x:-34,z:57,r:6,name:'feed drop'}],
  // fixed buildings (the house and garage stay movable by the player)
  buildings: [
    {id:'house',   name:'Farmhouse',        x:0,    z:-19.5, w:9.2,  d:11.3},
    {id:'garage',  name:'4-bay garage',     x:16.7, z:-21,   w:23.6, d:9,  note:'4 bays of 5.6 × 8.5 m, shared 9 m apron'},
    {id:'bodega',  name:'Bodega (storage)', x:-24,  z:-2,    w:14,   d:9},
    {id:'utility', name:'Utility yard',     x:-38,  z:-1,    w:14,   d:12},
  ],
  // crop field: the same 12 × 12 plots (2 m each), drawn as four beds of 6 × 6 with 1.5 m soil tracks between them
  field: {x:0, z:5, plot:2, beds:2, gap:1.5},
  orchard: {pts:[[21,-6],[35,-6],[38,12],[36,44],[22,47],[20,24]]},
  // animal areas: each has its own fence, gate and up to three slots (the game allows up to 3 of each); slot = [x, z, w, d]
  areas: [
    {type:'coop',    name:'Egg-laying houses', fence:[-12,24,12,50],    gate:[12,37],  slots:[[0,29,16,6.5],[0,37,16,6.5],[0,45,16,6.5]]},
    {type:'broiler', name:'Broiler houses',    fence:[-38,24,-18,50],   gate:[-38,37], slots:[[-28,29,14,6.5],[-28,37,14,6.5],[-28,45,14,6.5]]},
    {type:'cows',    name:'Cow pasture and barns', fence:[-104,18,-62,70], gate:[-62,27], slots:[[-92,24,10,7],[-80,24,10,7],[-68,24,10,7]], pasture:true},
    {type:'goat',    name:'Goat yard',         fence:[-100,-14,-74,12], gate:[-74,0],  slots:[[-94,-6,7,5],[-84,-6,7,5],[-94,5,7,5]]},
    {type:'pig',     name:'Pig pens',          fence:[-44,62,0,80],     gate:[-20,62], slots:[[-36,71,11,9],[-22,71,11,9],[-8,71,11,9]]},
    {type:'fish',    name:'Tilapia ponds',     fence:[-54,-40,-22,-18], gate:[-36,-18.5], slots:[[-46,-33,13,9],[-30,-33,13,9],[-46,-23,13,8]], water:true},
    {type:'duck',    name:'Duck enclosures',   fence:[-70,-40,-58,-12], gate:[-58,-26], slots:[[-64,-35,10,7],[-64,-26,10,7],[-64,-17,10,6]], water:true},
  ],
  canal: [[-58,-13],[-34,-14],[-17,-8],[-16,20.5],[14,20.5],[19,46]],
};
if (typeof module !== 'undefined') module.exports = FARM;
