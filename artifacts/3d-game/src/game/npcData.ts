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
      'Reunite all three shards and the Crown shall be restored. We believe in you!',
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
      'Watch out for those stone knights guarding the ruins. You\'ll need your sword arm ready!',
    ],
  },
];
