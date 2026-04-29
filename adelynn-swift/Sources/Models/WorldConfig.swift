import Foundation
import UIKit

struct WorldConfig {

    static let worldSize = CGSize(width: 700, height: 700)

    // MARK: - Portals
    static let portals: [AreaId: [PortalDef]] = [
        .field: [
            PortalDef(position: CGPoint(x:0,y:300),   destinationArea:.forest,  destinationPosition:CGPoint(x:0,y:-260),  color:.from(hex:"#22ff44"), label:"Whisper Woods"),
            PortalDef(position: CGPoint(x:300,y:0),   destinationArea:.desert,  destinationPosition:CGPoint(x:-260,y:0),  color:.from(hex:"#ffaa22"), label:"Ashrock Summit"),
            PortalDef(position: CGPoint(x:0,y:-300),  destinationArea:.cave,    destinationPosition:CGPoint(x:0,y:260),   color:.from(hex:"#aa44ff"), label:"Crystal Caverns"),
        ],
        .forest: [
            PortalDef(position: CGPoint(x:0,y:-300),  destinationArea:.field,   destinationPosition:CGPoint(x:0,y:260),   color:.from(hex:"#22aa44"), label:"Sunfield Plains"),
            PortalDef(position: CGPoint(x:0,y:300),   destinationArea:.jungle,  destinationPosition:CGPoint(x:0,y:-260),  color:.from(hex:"#44ff22"), label:"Verdant Canopy"),
        ],
        .desert: [
            PortalDef(position: CGPoint(x:-300,y:0),  destinationArea:.field,   destinationPosition:CGPoint(x:260,y:0),   color:.from(hex:"#aa7722"), label:"Sunfield Plains"),
            PortalDef(position: CGPoint(x:300,y:0),   destinationArea:.ice,     destinationPosition:CGPoint(x:-260,y:0),  color:.from(hex:"#88ccff"), label:"Frostpeak Tundra"),
        ],
        .jungle: [
            PortalDef(position: CGPoint(x:0,y:-300),  destinationArea:.forest,  destinationPosition:CGPoint(x:0,y:260),   color:.from(hex:"#22aa44"), label:"Whisper Woods"),
            PortalDef(position: CGPoint(x:0,y:300),   destinationArea:.sky,     destinationPosition:CGPoint(x:0,y:-260),  color:.from(hex:"#88aaff"), label:"Tempest Spire"),
        ],
        .ice: [
            PortalDef(position: CGPoint(x:-300,y:0),  destinationArea:.desert,  destinationPosition:CGPoint(x:260,y:0),   color:.from(hex:"#ffaa22"), label:"Ashrock Summit"),
            PortalDef(position: CGPoint(x:300,y:0),   destinationArea:.volcano, destinationPosition:CGPoint(x:-260,y:0),  color:.from(hex:"#ff4400"), label:"Volcara's Caldera"),
        ],
        .volcano: [
            PortalDef(position: CGPoint(x:-300,y:0),  destinationArea:.ice,     destinationPosition:CGPoint(x:260,y:0),   color:.from(hex:"#88ccff"), label:"Frostpeak Tundra"),
            PortalDef(position: CGPoint(x:300,y:0),   destinationArea:.crypt,   destinationPosition:CGPoint(x:-260,y:0),  color:.from(hex:"#ffffaa"), label:"Ashenmoor Crypt"),
        ],
        .sky: [
            PortalDef(position: CGPoint(x:0,y:-300),  destinationArea:.jungle,  destinationPosition:CGPoint(x:0,y:260),   color:.from(hex:"#44ff22"), label:"Verdant Canopy"),
            PortalDef(position: CGPoint(x:0,y:300),   destinationArea:.crypt,   destinationPosition:CGPoint(x:0,y:-260),  color:.from(hex:"#ffffaa"), label:"Ashenmoor Crypt"),
        ],
        .crypt: [
            PortalDef(position: CGPoint(x:-300,y:0),  destinationArea:.volcano, destinationPosition:CGPoint(x:260,y:0),   color:.from(hex:"#ff4400"), label:"Volcara's Caldera"),
            PortalDef(position: CGPoint(x:0,y:-300),  destinationArea:.sky,     destinationPosition:CGPoint(x:0,y:260),   color:.from(hex:"#88aaff"), label:"Tempest Spire"),
            PortalDef(position: CGPoint(x:0,y:300),   destinationArea:.void,    destinationPosition:CGPoint(x:0,y:-260),  color:.from(hex:"#cc00ff"), label:"The Void Realm"),
        ],
        .void: [
            PortalDef(position: CGPoint(x:0,y:-300),  destinationArea:.crypt,   destinationPosition:CGPoint(x:0,y:260),   color:.from(hex:"#ffffaa"), label:"Ashenmoor Crypt"),
        ],
        .cave: [
            PortalDef(position: CGPoint(x:0,y:300),   destinationArea:.field,   destinationPosition:CGPoint(x:0,y:-260),  color:.from(hex:"#22aa44"), label:"Sunfield Plains"),
        ],
        .boss: [],
    ]

    // MARK: - Enemy Spawns
    static let enemySpawns: [AreaId: [EnemySpawnConfig]] = [
        .field: [
            EnemySpawnConfig(count:5, maxHP:2,  speed:80...120,  bodyColor:.from(hex:"#c0392b"), accentColor:.from(hex:"#922b21"), chaseRange:200, enemyType:.slime,       behavior:.chase),
            EnemySpawnConfig(count:3, maxHP:1,  speed:130...180, bodyColor:.from(hex:"#2d7d20"), accentColor:.from(hex:"#55cc44"), chaseRange:280, enemyType:.goblin,      behavior:.charge),
        ],
        .forest: [
            EnemySpawnConfig(count:4, maxHP:2,  speed:100...160, bodyColor:.from(hex:"#4a235a"), accentColor:.from(hex:"#6c3483"), chaseRange:240, enemyType:.bat,         behavior:.chase),
            EnemySpawnConfig(count:3, maxHP:3,  speed:90...130,  bodyColor:.from(hex:"#2d6a2d"), accentColor:.from(hex:"#81c784"), chaseRange:200, enemyType:.briarwolf,   behavior:.charge),
            EnemySpawnConfig(count:2, maxHP:2,  speed:50...70,   bodyColor:.from(hex:"#4a6e2a"), accentColor:.from(hex:"#9acd50"), chaseRange:260, enemyType:.thornspitter,behavior:.ranged),
        ],
        .desert: [
            EnemySpawnConfig(count:3, maxHP:3,  speed:45...75,   bodyColor:.from(hex:"#a04020"), accentColor:.from(hex:"#c0703a"), chaseRange:120, enemyType:.knight,      behavior:.chase),
            EnemySpawnConfig(count:4, maxHP:2,  speed:100...140, bodyColor:.from(hex:"#b7770d"), accentColor:.from(hex:"#f0b03a"), chaseRange:220, enemyType:.scorpion,    behavior:.ranged),
        ],
        .jungle: [
            EnemySpawnConfig(count:5, maxHP:5,  speed:110...160, bodyColor:.from(hex:"#2a6e1a"), accentColor:.from(hex:"#66ee44"), chaseRange:220, enemyType:.briarwolf,   behavior:.charge),
            EnemySpawnConfig(count:3, maxHP:4,  speed:60...100,  bodyColor:.from(hex:"#1a4a0a"), accentColor:.from(hex:"#44cc22"), chaseRange:300, enemyType:.thornspitter,behavior:.ranged),
            EnemySpawnConfig(count:2, maxHP:6,  speed:35...60,   bodyColor:.from(hex:"#3a5a1a"), accentColor:.from(hex:"#88dd44"), chaseRange:140, enemyType:.knight,      behavior:.chase),
        ],
        .ice: [
            EnemySpawnConfig(count:5, maxHP:5,  speed:75...120,  bodyColor:.from(hex:"#88ccff"), accentColor:.from(hex:"#ffffff"), chaseRange:200, enemyType:.slime,       behavior:.chase),
            EnemySpawnConfig(count:3, maxHP:4,  speed:110...160, bodyColor:.from(hex:"#5588cc"), accentColor:.from(hex:"#aaddff"), chaseRange:280, enemyType:.bat,         behavior:.ranged),
            EnemySpawnConfig(count:2, maxHP:7,  speed:35...65,   bodyColor:.from(hex:"#336699"), accentColor:.from(hex:"#99ccff"), chaseRange:140, enemyType:.knight,      behavior:.chase),
        ],
        .volcano: [
            EnemySpawnConfig(count:5, maxHP:5,  speed:140...190, bodyColor:.from(hex:"#cc2200"), accentColor:.from(hex:"#ff6600"), chaseRange:260, enemyType:.goblin,      behavior:.charge),
            EnemySpawnConfig(count:3, maxHP:5,  speed:70...120,  bodyColor:.from(hex:"#aa3300"), accentColor:.from(hex:"#ff8800"), chaseRange:260, enemyType:.scorpion,    behavior:.ranged),
            EnemySpawnConfig(count:2, maxHP:8,  speed:40...70,   bodyColor:.from(hex:"#882200"), accentColor:.from(hex:"#ff4400"), chaseRange:140, enemyType:.knight,      behavior:.chase),
        ],
        .sky: [
            EnemySpawnConfig(count:5, maxHP:5,  speed:160...220, bodyColor:.from(hex:"#2244cc"), accentColor:.from(hex:"#88bbff"), chaseRange:260, enemyType:.bat,         behavior:.charge),
            EnemySpawnConfig(count:3, maxHP:5,  speed:90...140,  bodyColor:.from(hex:"#1133aa"), accentColor:.from(hex:"#5599ff"), chaseRange:300, enemyType:.thornspitter,behavior:.ranged),
            EnemySpawnConfig(count:2, maxHP:8,  speed:50...90,   bodyColor:.from(hex:"#0022aa"), accentColor:.from(hex:"#3366ff"), chaseRange:140, enemyType:.knight,      behavior:.chase),
        ],
        .crypt: [
            EnemySpawnConfig(count:5, maxHP:6,  speed:100...160, bodyColor:.from(hex:"#c8c888"), accentColor:.from(hex:"#ffff99"), chaseRange:240, enemyType:.goblin,      behavior:.charge),
            EnemySpawnConfig(count:4, maxHP:6,  speed:120...180, bodyColor:.from(hex:"#553311"), accentColor:.from(hex:"#aa6622"), chaseRange:300, enemyType:.wraith,      behavior:.ranged),
            EnemySpawnConfig(count:2, maxHP:10, speed:35...65,   bodyColor:.from(hex:"#888866"), accentColor:.from(hex:"#ccccaa"), chaseRange:120, enemyType:.knight,      behavior:.chase),
        ],
        .void: [
            EnemySpawnConfig(count:6, maxHP:8,  speed:150...225, bodyColor:.from(hex:"#110022"), accentColor:.from(hex:"#cc00ff"), chaseRange:320, enemyType:.wraith,      behavior:.ranged),
            EnemySpawnConfig(count:4, maxHP:9,  speed:100...160, bodyColor:.from(hex:"#220033"), accentColor:.from(hex:"#8800cc"), chaseRange:200, enemyType:.knight,      behavior:.charge),
            EnemySpawnConfig(count:3, maxHP:6,  speed:200...275, bodyColor:.from(hex:"#330044"), accentColor:.from(hex:"#ff00cc"), chaseRange:280, enemyType:.bat,         behavior:.chase),
        ],
        .cave: [
            EnemySpawnConfig(count:6, maxHP:3,  speed:140...200, bodyColor:.from(hex:"#2a1a4a"), accentColor:.from(hex:"#aa66ff"), chaseRange:280, enemyType:.bat,         behavior:.chase),
            EnemySpawnConfig(count:3, maxHP:4,  speed:80...130,  bodyColor:.from(hex:"#4a3366"), accentColor:.from(hex:"#cc88ff"), chaseRange:200, enemyType:.slime,       behavior:.chase),
            EnemySpawnConfig(count:2, maxHP:5,  speed:50...90,   bodyColor:.from(hex:"#553388"), accentColor:.from(hex:"#8844cc"), chaseRange:160, enemyType:.wraith,      behavior:.ranged),
        ],
        .boss: [
            EnemySpawnConfig(count:4, maxHP:4,  speed:110...150, bodyColor:.from(hex:"#1a0030"), accentColor:.from(hex:"#7c4dff"), chaseRange:280, enemyType:.wraith,      behavior:.ranged),
        ],
    ]

    // MARK: - Guardians
    struct GuardianCfg {
        let name: String; let title: String; let maxHP: CGFloat
        let speed1: CGFloat; let speed2: CGFloat
        let bolts1: Int; let bolts2: Int; let boltRate1: TimeInterval; let boltRate2: TimeInterval
        let boltColor: UIColor; let boltSpeed: CGFloat
        let bodyColor: UIColor; let accentColor: UIColor; let barColor: UIColor; let size: CGFloat
    }

    /// Hub area (Sunfield Plains) has no guardian — only regular enemies so the village stays approachable.
    static let guardians: [AreaId: GuardianCfg] = [
        .forest:  GuardianCfg(name:"Thornwick",          title:"Spirit of the Wild",            maxHP:18, speed1:90,  speed2:160, bolts1:3, bolts2:5, boltRate1:2.0, boltRate2:1.2, boltColor:.from(hex:"#88dd22"), boltSpeed:300, bodyColor:.from(hex:"#1a4a0a"), accentColor:.from(hex:"#66ff22"), barColor:.from(hex:"#44bb00"), size:65),
        .desert:  GuardianCfg(name:"Embris",             title:"Spirit of the Forge",           maxHP:20, speed1:70,  speed2:140, bolts1:2, bolts2:4, boltRate1:2.0, boltRate2:1.0, boltColor:.from(hex:"#ff8800"), boltSpeed:375, bodyColor:.from(hex:"#aa4400"), accentColor:.from(hex:"#ff8800"), barColor:.from(hex:"#ff6600"), size:68),
        .jungle:  GuardianCfg(name:"Mirekon",            title:"Spirit of the Deep",            maxHP:22, speed1:150, speed2:250, bolts1:1, bolts2:3, boltRate1:2.2, boltRate2:1.2, boltColor:.from(hex:"#66ff22"), boltSpeed:450, bodyColor:.from(hex:"#1a5a0a"), accentColor:.from(hex:"#88ff44"), barColor:.from(hex:"#55cc00"), size:65),
        .ice:     GuardianCfg(name:"Glacira",            title:"Spirit of Frost",               maxHP:22, speed1:110, speed2:200, bolts1:4, bolts2:6, boltRate1:1.8, boltRate2:0.9, boltColor:.from(hex:"#aaddff"), boltSpeed:400, bodyColor:.from(hex:"#88ccff"), accentColor:.from(hex:"#ffffff"), barColor:.from(hex:"#99ddff"), size:62),
        .volcano: GuardianCfg(name:"Cinder",             title:"Spirit of the Volcano",         maxHP:26, speed1:60,  speed2:120, bolts1:4, bolts2:6, boltRate1:1.5, boltRate2:0.8, boltColor:.from(hex:"#ff4400"), boltSpeed:350, bodyColor:.from(hex:"#882200"), accentColor:.from(hex:"#ff6600"), barColor:.from(hex:"#ff5500"), size:78),
        .sky:     GuardianCfg(name:"Solara",             title:"Spirit of Light",               maxHP:24, speed1:175, speed2:275, bolts1:2, bolts2:4, boltRate1:1.8, boltRate2:0.9, boltColor:.from(hex:"#88aaff"), boltSpeed:500, bodyColor:.from(hex:"#2244cc"), accentColor:.from(hex:"#88aaff"), barColor:.from(hex:"#6688ff"), size:62),
        .crypt:   GuardianCfg(name:"Sorvath",            title:"Crypt Warden",                  maxHP:28, speed1:90,  speed2:175, bolts1:5, bolts2:8, boltRate1:1.5, boltRate2:0.7, boltColor:.from(hex:"#ffffaa"), boltSpeed:325, bodyColor:.from(hex:"#cccc88"), accentColor:.from(hex:"#ffffaa"), barColor:.from(hex:"#eeee88"), size:68),
        .void:    GuardianCfg(name:"Nullis",             title:"The Void Sovereign",            maxHP:30, speed1:140, speed2:250, bolts1:3, bolts2:6, boltRate1:1.3, boltRate2:0.6, boltColor:.from(hex:"#cc00ff"), boltSpeed:450, bodyColor:.from(hex:"#220033"), accentColor:.from(hex:"#cc00ff"), barColor:.from(hex:"#aa00ee"), size:70),
        .cave:    GuardianCfg(name:"Crystara",           title:"Cave Shaper",                   maxHP:20, speed1:75,  speed2:150, bolts1:4, bolts2:6, boltRate1:1.8, boltRate2:0.9, boltColor:.from(hex:"#bb88ff"), boltSpeed:350, bodyColor:.from(hex:"#553388"), accentColor:.from(hex:"#aa66ff"), barColor:.from(hex:"#9955ff"), size:66),
    ]

    // MARK: - NPCs (dialogue — interact with X)
    static let npcsByArea: [AreaId: [NPCDef]] = [
        .field: [
            NPCDef(id: "npc-maren", name: "Elder Maren", position: CGPoint(x: 165, y: -125), color: .from(hex: "#c4b898"), lines: [
                "Child of the plains — the Crown's echo still hums in you.",
                "Three shards hide where dawn breaks, where dusk gathers, and where ember-sand sleeps.",
                "Double-tap Run to roll past the Bonelord's jaws. Time your shield for a perfect parry!"
            ]),
            NPCDef(id: "npc-finn", name: "Scout Finn", position: CGPoint(x: -195, y: -85), color: .from(hex: "#88aa66"), lines: [
                "I mapped nine guardian courts. Each spirit guards a sword blessing.",
                "Buy draughts from Rowan at the crossroads — you'll need them in the Void."
            ]),
        ],
        .forest: [
            NPCDef(id: "npc-hermit", name: "Hermit Yarrow", position: CGPoint(x: 130, y: 160), color: .from(hex: "#6a8a5a"), lines: [
                "The roots remember Malgrath's footsteps. Frost and fire both scar the deep paths."
            ]),
        ],
        .desert: [
            NPCDef(id: "npc-caravan", name: "Caravan Master", position: CGPoint(x: -140, y: 130), color: .from(hex: "#c9a055"), lines: [
                "Moonbow bolts pierce wraith-fog. Keep shurikens for the quick ones."
            ]),
        ],
    ]

    // MARK: - Shop (Rowan's Wares — field hub)
    static let shopkeepers: [AreaId: ShopkeeperDef] = [
        .field: ShopkeeperDef(id: "shop-rowan", position: CGPoint(x: -125, y: 108)),
    ]

    // MARK: - Lore Stones
    static let loreStones: [AreaId: [LoreStoneDef]] = [
        .field: [
            LoreStoneDef(id:"ls-field-1", position:CGPoint(x:150,y:-50),   title:"Ancient Boundary Stone",       text:"Here stood the Northern Gate of Sunfield, raised in the Age of Accord. The glyph reads: 'Let no shadow pass while Solara watches.'"),
            LoreStoneDef(id:"ls-field-2", position:CGPoint(x:-180,y:-120), title:"Adelynn's Journal — Entry 1",  text:"Today I found the first shard near the old mill. It hums when I hold it — like it remembers something. Grandmother always said the Crown was more than gold."),
            LoreStoneDef(id:"ls-field-3", position:CGPoint(x:100,y:-200),  title:"Traveler's Warning",           text:"Turn back, wanderer. The dark grows deeper past the treeline. Three scouts entered Whisper Woods last autumn. Only their boots returned."),
        ],
        .forest: [
            LoreStoneDef(id:"ls-forest-1", position:CGPoint(x:-60,y:-100),  title:"The Pact of Green",      text:"In the Age before counting, the Forest Queen made a pact with the roots: 'Feed on the fallen, spare the living.' The roots still honor it. Mostly."),
            LoreStoneDef(id:"ls-forest-2", position:CGPoint(x:140,y:-80),   title:"Malgrath's First Sin",   text:"He came from the east claiming to be a scholar. We gave him shelter. He drank from the Black Pool and changed on the third night. The screaming lasted until dawn."),
            LoreStoneDef(id:"ls-forest-3", position:CGPoint(x:-120,y:-180), title:"Root-Tongue Inscription", text:"YOUNG ONE. THE SECOND SHARD SLEEPS BENEATH SAND. FOLLOW THE RIVER OF HEAT WHERE STONE REMEMBERS FIRE."),
        ],
        .desert: [
            LoreStoneDef(id:"ls-desert-1", position:CGPoint(x:140,y:-100), title:"The Ashrock Proclamation", text:"Let it be known: the Summit was not always barren. Once, rivers ran here. Until Malgrath's first experiment cracked the sky and the rain forgot this place."),
            LoreStoneDef(id:"ls-desert-2", position:CGPoint(x:60,y:140),   title:"Shard-Seeker's Note",     text:"Found it at last — the Shard of Ember, buried beneath the red stone archway. The heat does not touch it. Cold as winter, even here."),
            LoreStoneDef(id:"ls-desert-3", position:CGPoint(x:-180,y:140), title:"Hermit's Last Words",     text:"Forty years I watched the storm at the horizon. It never moved. Today it moved. Today I leave."),
        ],
        .jungle: [
            LoreStoneDef(id:"ls-jungle-1", position:CGPoint(x:160,y:100),  title:"The Overgrowth Speaks",  text:"The jungle does not welcome strangers. But it remembers the Crown. The roots pull toward the North, away from the Caldera."),
            LoreStoneDef(id:"ls-jungle-2", position:CGPoint(x:-150,y:-80), title:"Ranger Havik's Log",     text:"Day 12: The Canopy Tyrant has returned. Bigger than before. We cannot fight it. We cannot outrun it. We can only pray it feeds elsewhere."),
            LoreStoneDef(id:"ls-jungle-3", position:CGPoint(x:80,y:-180),  title:"Buried Stele",           text:"Three kings built their thrones on jungle soil. Three kings fed the roots. The jungle grows still."),
        ],
        .ice: [
            LoreStoneDef(id:"ls-ice-1", position:CGPoint(x:180,y:100),  title:"Frozen Dispatch",       text:"The frost came in a single night. The sentinels were not prepared. We have sealed the lower keep. Whoever finds this: the Frostveil Wraith guards the Tundra Gate."),
            LoreStoneDef(id:"ls-ice-2", position:CGPoint(x:-160,y:-90), title:"Glacial Inscription",   text:"Ice remembers what fire forgets. The shard fragment passed through here — we felt its warmth even through the permafrost."),
            LoreStoneDef(id:"ls-ice-3", position:CGPoint(x:60,y:-180),  title:"The Ice Queen's Edict", text:"None shall pass to the Caldera without the blessing of the Frozen Gate. The Wraith is my proxy. Satisfy it, and the passage opens."),
        ],
        .volcano: [
            LoreStoneDef(id:"ls-volcano-1", position:CGPoint(x:160,y:120),  title:"Magma-Etched Warning",  text:"The Caldera was sealed for ten thousand years. Malgrath unsealed it. The Titan woke with it. Do not mistake its power for mindlessness."),
            LoreStoneDef(id:"ls-volcano-2", position:CGPoint(x:-150,y:-80), title:"Forge-Master's Notes",  text:"I tried to forge a weapon using Caldera-iron. The metal screamed. I heard words in the screaming. I will not write them here."),
            LoreStoneDef(id:"ls-volcano-3", position:CGPoint(x:80,y:-190),  title:"Cinder Inscription",   text:"Fire forged the world. Fire will unmake it. Unless the Crown is restored. Hurry, child of light."),
        ],
        .sky: [
            LoreStoneDef(id:"ls-sky-1", position:CGPoint(x:-180,y:100), title:"Cloud-Carved Warning",  text:"Storm Herald Vayne was once a soldier of the sky kingdom. Malgrath offered him power over the tempest. He accepted. He regrets it. He cannot stop."),
            LoreStoneDef(id:"ls-sky-2", position:CGPoint(x:160,y:-90),  title:"Windstone Inscription", text:"From here, on the clearest days, you can see Shadowmere Throne. The darkness grows. Restore the Crown before the storm becomes permanent."),
            LoreStoneDef(id:"ls-sky-3", position:CGPoint(x:-80,y:-180), title:"Skywatcher's Final Log", text:"Day 314: The sky has not cleared since the Crown shattered. Day 315: I am leaving the spire. The stones can watch themselves."),
        ],
        .crypt: [
            LoreStoneDef(id:"ls-crypt-1", position:CGPoint(x:160,y:100),  title:"Crypt-Keeper's Epitaph", text:"Here lies everyone who entered the Ashenmoor Crypt believing they were brave. The Bonelord collects them. It is patient."),
            LoreStoneDef(id:"ls-crypt-2", position:CGPoint(x:-160,y:-80), title:"Necromantic Treatise",   text:"The Bonelord does not hate the living. It simply does not distinguish between the living and the not-yet-dead."),
            LoreStoneDef(id:"ls-crypt-3", position:CGPoint(x:80,y:-180),  title:"Adelynn's Journal — Entry 12", text:"I've defeated eight guardians now. Each one weaker than my fear of them. The Throne is close. I can feel the shards resonating."),
        ],
        .void: [
            LoreStoneDef(id:"ls-void-1", position:CGPoint(x:160,y:100),  title:"Void-Carved Whisper",  text:"The Null Predator was not created. It emerged when the Crown shattered. It feeds on absence. Destroy it and the void begins to heal."),
            LoreStoneDef(id:"ls-void-2", position:CGPoint(x:-160,y:-80), title:"Malgrath's Last Note",  text:"I did not understand what I was doing when I shattered the Crown. I understand now. I am sorry. I cannot undo it. But perhaps she can."),
            LoreStoneDef(id:"ls-void-3", position:CGPoint(x:80,y:-180),  title:"Pulse of the Realm",   text:"The void has a heartbeat. It is slow. It is counting down. Restore the Crown before the count reaches zero."),
        ],
        .cave: [
            LoreStoneDef(id:"ls-cave-1", position:CGPoint(x:160,y:100),  title:"Crystal Resonance Log", text:"The crystals here sing the same note as the Crown of Radiance. The golem was built to guard them. Ancient. Older than Aldenmere itself."),
            LoreStoneDef(id:"ls-cave-2", position:CGPoint(x:-160,y:-80), title:"Miner's Last Entry",    text:"We cracked the big crystal by accident. The golem woke. Jenkins and Morra got out. I did not. If you find this: the golem's core glows purple."),
            LoreStoneDef(id:"ls-cave-3", position:CGPoint(x:80,y:-180),  title:"Inscription of Origin", text:"Before the Crown, before the kingdoms, there were the Crystals. They remember the shape of the world before it had a name."),
        ],
        .boss: [],
    ]

    // MARK: - Shards
    static let shards: [ShardDef] = [
        ShardDef(id:"shard-dawn",  areaId:.field,  position:CGPoint(x:0,y:200),    name:"Shard of Dawn"),
        ShardDef(id:"shard-dusk",  areaId:.forest, position:CGPoint(x:-150,y:150), name:"Shard of Dusk"),
        ShardDef(id:"shard-ember", areaId:.desert, position:CGPoint(x:150,y:-150), name:"Shard of Ember"),
    ]

    // MARK: - Player Spawn
    static func spawnPosition(for area: AreaId) -> CGPoint {
        switch area {
        case .field:   return CGPoint(x:0,   y:-100)
        case .forest:  return CGPoint(x:0,   y:100)
        case .desert:  return CGPoint(x:-100,y:0)
        case .boss:    return CGPoint(x:0,   y:200)
        case .jungle:  return CGPoint(x:0,   y:100)
        case .ice:     return CGPoint(x:-100,y:0)
        case .volcano: return CGPoint(x:-100,y:0)
        case .sky:     return CGPoint(x:0,   y:100)
        case .crypt:   return CGPoint(x:0,   y:100)
        case .void:    return CGPoint(x:0,   y:100)
        case .cave:    return CGPoint(x:0,   y:-100)
        }
    }

    // MARK: - Chests
    static let chests: [AreaId: [ChestDef]] = [
        .field:   [ChestDef(id:"ch-field-1",   position:CGPoint(x:-200,y:150),  weaponUnlock:nil,       rupeeReward:10),
                   ChestDef(id:"ch-field-2",   position:CGPoint(x:180,y:-160),  weaponUnlock:.bow,      rupeeReward:5)],
        .forest:  [ChestDef(id:"ch-forest-1",  position:CGPoint(x:160,y:180),   weaponUnlock:.bomb,     rupeeReward:5)],
        .desert:  [ChestDef(id:"ch-desert-1",  position:CGPoint(x:-160,y:-160), weaponUnlock:.wand,     rupeeReward:5)],
        .jungle:  [ChestDef(id:"ch-jungle-1",  position:CGPoint(x:160,y:180),   weaponUnlock:.shuriken, rupeeReward:5)],
        .ice:     [ChestDef(id:"ch-ice-1",     position:CGPoint(x:-160,y:180),  weaponUnlock:.frost,    rupeeReward:5)],
        .volcano: [ChestDef(id:"ch-volcano-1", position:CGPoint(x:160,y:-160),  weaponUnlock:.flare,    rupeeReward:5)],
        .sky:     [ChestDef(id:"ch-sky-1",     position:CGPoint(x:-160,y:-160), weaponUnlock:.boomerang,rupeeReward:5)],
        .crypt:   [ChestDef(id:"ch-crypt-1",   position:CGPoint(x:160,y:160),   weaponUnlock:.moonbow,  rupeeReward:5)],
        .void:    [ChestDef(id:"ch-void-1",    position:CGPoint(x:-160,y:-160), weaponUnlock:nil,       rupeeReward:30)],
        .cave:    [ChestDef(id:"ch-cave-1",    position:CGPoint(x:160,y:160),   weaponUnlock:nil,       rupeeReward:20),
                   ChestDef(id:"ch-cave-2",    position:CGPoint(x:-160,y:-160), weaponUnlock:nil,       rupeeReward:20)],
        .boss:    [],
    ]
}
