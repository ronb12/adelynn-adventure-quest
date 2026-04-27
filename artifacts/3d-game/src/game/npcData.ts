// ─── NPC definitions for Adelynn's Adventure Quest ──────────────
// Full cast: 14 interactive NPCs across 4 areas

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  area: string;
  position: [number, number, number];
  bodyColor: string;
  accentColor: string;
  hairColor: string;
  dialogue: string[];
}

export const NPC_DATA: NPCDef[] = [

  // ── SUNFIELD PLAINS (field) ─────────────────────────────────────

  {
    id: 'elder',
    name: 'Elder Osric',
    title: 'Village Elder',
    area: 'field',
    position: [6, 0, 3],
    bodyColor: '#7b5e3a',
    accentColor: '#d4a870',
    hairColor: '#e8e8e8',
    dialogue: [
      'Adelynn! Thank the light you\'ve come to Sunfield Village.',
      'The Shadow Sorcerer Malgrath shattered the Crown of Radiance into three Crystal Shards.',
      'Each Shard holds a Bound Spirit prisoner. Free the spirits and restore the Crown!',
      'One shard lies hidden here in Sunfield Plains — search for the glowing chest to the north.',
      'The second shard is deep inside Whisper Woods. The third burns in Ashrock Summit.',
      'Once you have all three, a dark portal appears to the WEST — that leads to Malgrath\'s Lair!',
      'Tip: the Fairy Fountain south-west of the village will fully restore your health.',
    ],
  },

  {
    id: 'merchant',
    name: 'Zarko',
    title: 'Travelling Merchant',
    area: 'field',
    position: [8, 0, 12],
    bodyColor: '#5d4037',
    accentColor: '#ff8f00',
    hairColor: '#212121',
    dialogue: [
      'Step right up! Zarko\'s Wares — finest deals in all of Aldenmere!',
      'I stock heart potions, shurikens, and whatever else a hero might need.',
      'Press E near my stall to open the shop. Rupees are the currency!',
      'Heard the Bound Spirit Solara used to light up this whole valley every dawn. Miss those days...',
    ],
  },

  {
    id: 'lily',
    name: 'Lily',
    title: 'Flower Keeper',
    area: 'field',
    position: [13, 0, 7],
    bodyColor: '#f48fb1',
    accentColor: '#f8bbd0',
    hairColor: '#c8a060',
    dialogue: [
      'Oh, Adelynn! The shadows have been growing darker every night.',
      'I saw a golden glow north of the village — near the old stone chest!',
      'Collect 4 heart pieces for a new heart container — they\'re scattered everywhere.',
      'Please hurry... the flowers are wilting without the Crown\'s light.',
    ],
  },

  {
    id: 'tomas',
    name: 'Tomas',
    title: 'Village Guard',
    area: 'field',
    position: [9, 0, 11],
    bodyColor: '#37474f',
    accentColor: '#78909c',
    hairColor: '#4e342e',
    dialogue: [
      'Halt! Oh — it\'s you, Adelynn. Sorry, on edge with all the shadow creatures lately.',
      'Those Shadow Slimes have been crawling up from the ground since the Crown broke.',
      'Hold your sword button for about a second, then release for a Spin Attack!',
      'Hold F to raise your shield — blocks 75% of incoming damage. Stay sharp!',
    ],
  },

  {
    id: 'brynn',
    name: 'Brynn',
    title: 'Innkeeper',
    area: 'field',
    position: [2, 0, 8],
    bodyColor: '#8d6e63',
    accentColor: '#bcaaa4',
    hairColor: '#bf360c',
    dialogue: [
      'Welcome to the Amber Lantern! Best stew in Aldenmere, though the kitchen\'s been cold since the Crown broke.',
      'My grandmother used to say that the Bound Spirit Zephyr carried warm breezes over these fields.',
      'I saw King Aldric\'s royal messenger ride through weeks ago. Never came back.',
      'Rest when you can, Adelynn. Even heroes need sleep.',
    ],
  },

  {
    id: 'nyla',
    name: 'Nyla',
    title: 'Wandering Seer',
    area: 'field',
    position: [-6, 0, 5],
    bodyColor: '#4a148c',
    accentColor: '#ce93d8',
    hairColor: '#1a0030',
    dialogue: [
      'The threads of fate glow bright around you, young Adelynn...',
      'I see three shards of blazing light — and one sorcerer shrouded in void.',
      'Malgrath fears the seven Bound Spirits. He caged them because they are the only power that can undo him.',
      'When Lumis, the Spirit of Light, is freed — Malgrath\'s shadow armour will crack. Remember that.',
    ],
  },

  // ── WHISPER WOODS (forest) ──────────────────────────────────────

  {
    id: 'mira',
    name: 'Mira',
    title: 'Forest Botanist',
    area: 'forest',
    position: [10, 0, 14],
    bodyColor: '#2e7d32',
    accentColor: '#66bb6a',
    hairColor: '#4e342e',
    dialogue: [
      'Shh... you\'ll disturb the ancient spirits of the forest.',
      'I\'ve studied these woods for years. Something extraordinary pulses at its heart.',
      'The Shard of Dusk — it sits in a chest at the very center of Whisper Woods.',
      'Beware the Briar Wolves. They\'re not natural creatures — Malgrath\'s corruption twisted them from regular wolves.',
      'There\'s a Fairy Fountain to the south-east of the forest — it will fully restore you!',
    ],
  },

  {
    id: 'gwynn',
    name: 'Gwynn',
    title: 'Root Herbalist',
    area: 'forest',
    position: [-8, 0, 10],
    bodyColor: '#1b5e20',
    accentColor: '#a5d6a7',
    hairColor: '#6d4c41',
    dialogue: [
      'These roots I\'m harvesting normally glow faintly with Thornwick\'s blessing. Not anymore.',
      'Thornwick — the Spirit of the Wild — has been silent since Malgrath took the Shard.',
      'Every plant in this forest feels it. The bark has gone cold. The mushrooms smell of ash.',
      'The Dusk Bats didn\'t used to attack people. Malgrath\'s shadow seeped into them.',
      'Collect every heart piece you can find. This forest is not safe.',
    ],
  },

  {
    id: 'ryn',
    name: 'Ryn',
    title: 'Hermit Sage',
    area: 'forest',
    position: [-14, 0, 4],
    bodyColor: '#3e2723',
    accentColor: '#a1887f',
    hairColor: '#bdbdbd',
    dialogue: [
      '...I have lived in these woods for forty years and I have never seen darkness like this.',
      'The seven Bound Spirits were woven into the Crown long before Aldenmere was a kingdom.',
      'Solara, Thornwick, Embris, Glacira, Lumis, Zephyr, Cragus — seven aspects of the world\'s balance.',
      'Malgrath didn\'t just steal power. He broke the world\'s heartbeat.',
      'You carry all seven hopes with you, girl. Do not fail them.',
    ],
  },

  // ── ASHROCK SUMMIT (desert) ─────────────────────────────────────

  {
    id: 'kael',
    name: 'Kael',
    title: 'Desert Miner',
    area: 'desert',
    position: [-12, 0, -6],
    bodyColor: '#5d4037',
    accentColor: '#8d6e63',
    hairColor: '#3e2723',
    dialogue: [
      'Whew, this heat... you sure you want to be out here, lass?',
      'I\'ve mined these dunes for twenty years. Never seen anything like that orange glow.',
      'The Shard of Ember — it burns north of the rock pillars in an ancient chest.',
      'Those Ember Scorpions are new. Malgrath\'s fire corrupted the desert scorpions. They\'re much bigger now.',
      'There\'s a Fairy Fountain to the north-east — a safe haven! Use your Spin Attack on the Stone Sentinels!',
    ],
  },

  {
    id: 'daxar',
    name: 'Daxar',
    title: 'Blast-Crafter',
    area: 'desert',
    position: [-6, 0, -14],
    bodyColor: '#bf360c',
    accentColor: '#ff8a65',
    hairColor: '#212121',
    dialogue: [
      'Careful where you step — I\'ve got powder charges drying in the sun!',
      'I used to sell my craft to the miners. Now the whole summit\'s overrun with Malgrath\'s creatures.',
      'The Stone Sentinels — those used to be actual soldiers. He turned them to stone and kept them marching.',
      'Embris, the Spirit of the Forge — they say she taught the first smiths to work metal and fire.',
      'If you find the Shard of Ember... please free her. These rocks aren\'t right without her warmth.',
    ],
  },

  {
    id: 'priya',
    name: 'Priya',
    title: 'Water-Seller',
    area: 'desert',
    position: [-4, 0, -10],
    bodyColor: '#0277bd',
    accentColor: '#81d4fa',
    hairColor: '#37474f',
    dialogue: [
      'Water! Clean, cold water — last barrel I managed to haul from the valley spring.',
      'Glacira, the Spirit of Frost, used to keep a hidden spring of pure water under this summit.',
      'Since she\'s been trapped... the spring dried up. This desert is getting worse by the week.',
      'I\'ve been trying to lead the last few villagers to safety, but the Sentinels block every path south.',
      'Clear us a safe route when you can, hero. The children haven\'t had a clean drink in three days.',
    ],
  },

  // ── MALGRATH'S LAIR (boss area) ────────────────────────────────

  {
    id: 'calla',
    name: 'Sister Calla',
    title: 'Sanctuary Keeper',
    area: 'boss',
    position: [-4, 0, 8],
    bodyColor: '#fce4ec',
    accentColor: '#f48fb1',
    hairColor: '#f5f5f5',
    dialogue: [
      'You made it this far... I never dared hope.',
      'This used to be a sanctuary. Malgrath tore out the light and left only the Void Wraiths to patrol.',
      'The Fairy Fountain still works — hidden in the north corner. He couldn\'t corrupt something that pure.',
      'Seraphine was brought here three days ago. I haven\'t seen her since. Please — find her.',
      'All seven Bound Spirits cry out in here. You can almost hear them if the lair goes quiet.',
      'Go. Face Malgrath. The whole kingdom\'s future rests on your next few steps.',
    ],
  },

  {
    id: 'corvax',
    name: 'Corvax',
    title: 'Former Shadow Lieutenant',
    area: 'boss',
    position: [8, 0, -4],
    bodyColor: '#1a0030',
    accentColor: '#7c4dff',
    hairColor: '#311b92',
    dialogue: [
      '...I served Malgrath for six years. I believed his promises of a new age.',
      'Then I saw what he did to the seven Bound Spirits. What he did to Seraphine.',
      'He doesn\'t want a new age. He wants a dead one. A world of silence, where he is the only voice.',
      'I can\'t fight him — he stripped my power when he sensed my doubt. But you can.',
      'His weak point is the Crown fragment at his chest. The Bound Spirits\' light can pierce it.',
      'Adelynn... end this. For all of us.',
    ],
  },
];
