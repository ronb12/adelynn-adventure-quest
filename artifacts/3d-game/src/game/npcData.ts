// ─── NPC definitions for Adelynn Adventure Quest ─────────────────

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
      'The Shadow Sorcerer Malgrath has shattered the Crown of Radiance into three Crystal Shards.',
      'One shard lies hidden here in Sunfield Plains... search for the glowing chest to the north.',
      'The second shard is deep inside Whisper Woods — go through the north portal.',
      'The third burns in the ruins of Ashrock Summit. Take the east portal to reach it.',
      'Once you have all three shards, a dark portal will appear to the WEST — that leads to Malgrath\'s Lair!',
      'Tip: The Fairy Fountain south-west of the village will fully restore your health. Look for the blue glow!',
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
      'Step right up, brave adventurer! Zarko\'s Wares — finest deals in all of Aldenmere!',
      'I stock arrows for your bow, bombs for tight spots, and heart potions to keep you alive.',
      'Press E near my stall to open the shop. Rupees are the currency — grab those green gems!',
      'Heard rumours that armor can be found deep in Malgrath\'s Lair. Worth the risk, I\'d say!',
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
      'Also — heart pieces are scattered all over the land. Collect 4 for a new heart container!',
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
      'Halt! Oh — it\'s you, Adelynn. Sorry, on edge lately with all the shadow creatures.',
      'Those Slimes have been crawling out of the ground since the Crown broke.',
      'Pro tip: Hold your sword button (Space) for about a second, then release for a Spin Attack!',
      'And hold F to raise your shield — blocks 75%% of incoming damage. Handy against Malgrath!',
      'Stay sharp out there. Sword first, questions later!',
    ],
  },
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
      'A purple glow — the Shard of Dusk. The chest sits at the very center of Whisper Woods.',
      'There\'s a Fairy Fountain to the south-east of the forest — it will fully restore your vitality!',
      'Beware the bats that swarm in the darkness. They\'re Malgrath\'s spies. Good luck!',
    ],
  },
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
      'There\'s a Fairy Fountain to the north-east corner of the summit — a safe haven!',
      'Watch out for those stone knights. Use your Spin Attack — hits \'em all at once!',
    ],
  },
];
