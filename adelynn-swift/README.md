# Adelynn's Adventure Quest — Swift iOS

A complete native iOS clone of the web game, built with **SpriteKit**.  
Top-down 2D action-adventure with all the same worlds, enemies, weapons, guardians, and bosses.

---

## What's Included

| Feature | Details |
|---|---|
| **11 Worlds** | Sunfield Plains, Whisper Woods, Ashrock Summit, Crystal Caverns, Verdant Canopy, Frostpeak Tundra, Volcara's Caldera, Tempest Spire, Ashenmoor Crypt, The Void Realm, Shadowmere Throne |
| **10 Area Guardians** | Thornback Brute, Gorgomara, Embric Sentinel, Canopy Tyrant, Frostveil Wraith, Magma Titan, Storm Herald Vayne, The Bonelord, Null Predator, Crystal Golem Shard |
| **Final Boss** | Malgrath, The Shattered King — two-phase fight with teleport |
| **9 Weapons** | Crystal Sword, Elven Bow, Moonbow, Bomb, Shadowrang, Wand, Frost Scepter, Shuriken, Solar Flare |
| **8 Enemy Types** | Slime, Bat, Knight, BriarWolf, Scorpion, Wraith, Goblin, ThornSpitter — with chase/charge/ranged AI |
| **31+ Lore Stones** | Narrative text across all worlds |
| **Score + Combo** | Kill combo multiplier, run timer, elite kills |
| **Save System** | Auto-save + manual save via UserDefaults |
| **Virtual Controls** | Joystick (left) + A/B/X/Y buttons (right) |

---

## Setup Instructions (macOS + Xcode)

### Step 1 — Create a new Xcode project

1. Open **Xcode** (14.0+ required)
2. **File → New → Project**
3. Choose **iOS → Game**
4. Set:
   - **Product Name**: `AdelynnAdventureQuest`
   - **Game Technology**: `SpriteKit`
   - **Language**: `Swift`
5. Click **Next**, choose a save location, click **Create**

### Step 2 — Remove default files

In Xcode's Project Navigator, **delete** these files (Move to Trash):
- `GameScene.swift`
- `GameScene.sks`
- `Actions.sks`

### Step 3 — Add source files

1. Drag the entire `Sources/` folder from Finder into the Project Navigator
2. In the dialog: make sure **"Copy items if needed"** is checked and **"Add to target: AdelynnAdventureQuest"** is checked
3. Click **Finish**

### Step 4 — Fix Info.plist (optional, for landscape)

In your `Info.plist`, ensure:
```
UIInterfaceOrientation → Landscape Right
UISupportedInterfaceOrientations → Landscape Left, Landscape Right
```

Or add to `Info.plist` as source:
```xml
<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

### Step 5 — Build and Run

- Select your iPhone or iPad simulator (or a real device)
- Press **⌘R** to build and run
- The game will launch to the title screen

---

## Controls

| Input | Action |
|---|---|
| **Left joystick** (drag anywhere on left side) | Move Adelynn |
| **A** (bottom right) | Attack with active weapon |
| **B** (left of A) | Run / Sprint |
| **X** (upper left cluster) | Interact (open chest, read lore stone) |
| **Y** (upper right cluster) | Cycle weapon |
| **⏸** (top right corner) | Pause |

---

## Gameplay

- **Explore** each area and find Crystal Shards (3 total — field, forest, desert)
- **Defeat** the Area Guardian in each world to unlock +15 Rupees and +1 Heart
- **Collect all 3 Shards** to unlock the portal to Shadowmere Throne
- **Defeat Malgrath** to win the game
- **Open chests** in each area to unlock new weapons
- **Read lore stones** to uncover the story of the Shattered Crown

---

## File Overview

| File | Purpose |
|---|---|
| `AppDelegate.swift` | App entry point |
| `GameViewController.swift` | SpriteKit host, landscape lock |
| `GameTypes.swift` | All enums, structs, extensions |
| `GameStore.swift` | Central game state (singleton) |
| `SaveManager.swift` | UserDefaults persistence |
| `WorldConfig.swift` | All area data: portals, enemies, guardians, chests, lore |
| `TitleScene.swift` | Title screen |
| `WorldScene.swift` | Main gameplay scene + helper sprites |
| `GameOverScene.swift` | Game over screen with stats |
| `VictoryScene.swift` | Victory screen with final score |
| `PlayerNode.swift` | Player movement, all 9 weapons |
| `EnemyNode.swift` | All 8 enemy types, 3 AI behaviors |
| `GuardianNode.swift` | Area guardian boss (two-phase) |
| `BossNode.swift` | Malgrath final boss (two-phase, teleport) |
| `WeaponNode.swift` | Projectile node classes |
| `HUDNode.swift` | Hearts, rupees, weapon bar, boss/guardian HP bars |
| `ControlsNode.swift` | Virtual joystick + action buttons |

---

## Minimum Requirements

- **Xcode** 14.0 or later
- **iOS** 15.0 or later
- **Swift** 5.7 or later

No third-party dependencies. Uses only Apple's built-in **SpriteKit** framework.
