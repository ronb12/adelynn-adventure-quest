import Foundation
import UIKit

enum GameStateEnum { case title, playing, paused, gameOver, victory }

class GameStore {
    static let shared = GameStore()

    // MARK: - Player Stats
    var hearts: CGFloat = 5
    var maxHearts: CGFloat = 5
    var rupees: Int = 0
    var armorLevel: Int = 0

    // MARK: - Ammo
    var arrows: Int = 10
    var moonbowAmmo: Int = 8
    var bombs: Int = 5
    var shurikens: Int = 15
    var frostCharges: Int = 8
    var flareCharges: Int = 3
    var boomerangReady: Bool = true

    // MARK: - Weapons
    var activeWeapon: WeaponType = .sword
    var unlockedWeapons: [WeaponType] = [.sword]
    var unlockedSet: Set<WeaponType> = [.sword]

    // MARK: - Progress
    var currentArea: AreaId = .field
    var shardsCollected: Int = 0
    var chestsOpened: Set<String> = []
    var heartPiecesCollected: Set<String> = []
    var talkedToNPCs: Set<String> = []
    var loreRead: Set<String> = []
    var areasVisited: Set<AreaId> = [.field]

    // MARK: - Boss
    var bossHP: CGFloat = 20
    let bossMaxHP: CGFloat = 20
    var bossDefeated: Bool = false

    // MARK: - Guardian
    var guardianDefeated: Set<AreaId> = []
    var currentGuardianHP: CGFloat = 0
    var currentGuardianMaxHP: CGFloat = 0

    // MARK: - Score / Combo
    var score: Int = 0
    var comboCount: Int = 0
    var comboTimer: TimeInterval = 0
    var eliteKills: Int = 0
    var runStartTime: Date = Date()

    // MARK: - UI
    var gameState: GameStateEnum = .title
    var itemFanfare: ItemFanfare? = nil

    // MARK: - Ammo helpers
    @discardableResult func useArrow()   -> Bool { guard arrows>0 else{return false}; arrows-=1; return true }
    @discardableResult func useMoonbow() -> Bool { guard moonbowAmmo>0 else{return false}; moonbowAmmo-=1; return true }
    @discardableResult func useBomb()    -> Bool { guard bombs>0 else{return false}; bombs-=1; return true }
    @discardableResult func useShuriken()-> Bool { guard shurikens>0 else{return false}; shurikens-=1; return true }
    @discardableResult func useFrost()   -> Bool { guard frostCharges>0 else{return false}; frostCharges-=1; return true }
    @discardableResult func useFlare()   -> Bool { guard flareCharges>0 else{return false}; flareCharges-=1; return true }

    func ammoCount(for weapon: WeaponType) -> Int {
        switch weapon {
        case .sword:     return -1
        case .bow:       return arrows
        case .moonbow:   return moonbowAmmo
        case .bomb:      return bombs
        case .boomerang: return boomerangReady ? 1 : 0
        case .wand:      return -1
        case .frost:     return frostCharges
        case .shuriken:  return shurikens
        case .flare:     return flareCharges
        }
    }

    // MARK: - Damage / Heal
    func damagePlayer(_ amount: CGFloat) {
        let mult: CGFloat = armorLevel==2 ? 0.5 : armorLevel==1 ? 0.75 : 1.0
        hearts = max(0, hearts - amount * mult)
    }

    func healPlayer(_ amount: CGFloat) { hearts = min(maxHearts, hearts + amount) }

    // MARK: - Score
    func addKill(_ pts: Int) {
        let mult = min(comboCount + 1, 5)
        score += pts * mult
        comboCount += 1
        comboTimer = 3.5
    }

    func tickCombo(_ delta: TimeInterval) {
        guard comboTimer > 0 else { return }
        comboTimer -= delta
        if comboTimer <= 0 { comboCount = 0 }
    }

    // MARK: - Guardian
    func spawnGuardian(for area: AreaId, maxHP: CGFloat) {
        guard !guardianDefeated.contains(area) else { return }
        currentGuardianHP = maxHP
        currentGuardianMaxHP = maxHP
    }

    @discardableResult func damageGuardian(_ dmg: CGFloat) -> Bool {
        currentGuardianHP = max(0, currentGuardianHP - dmg)
        guard currentGuardianHP <= 0 else { return false }
        guardianDefeated.insert(currentArea)
        rupees += 15
        healPlayer(1)
        score += 2000
        comboCount += 5
        comboTimer = 5
        itemFanfare = ItemFanfare(name: "Guardian Defeated!", icon: "👑", desc: "+15 Rupees · +1 Heart")
        return true
    }

    @discardableResult func damageBoss(_ dmg: CGFloat) -> Bool {
        bossHP = max(0, bossHP - dmg)
        guard bossHP <= 0 else { return false }
        bossDefeated = true
        score += 10000
        gameState = .victory
        return true
    }

    // MARK: - Weapons
    func cycleWeapon(direction: Int) {
        guard !unlockedWeapons.isEmpty else { return }
        let idx = unlockedWeapons.firstIndex(of: activeWeapon) ?? 0
        activeWeapon = unlockedWeapons[((idx + direction) + unlockedWeapons.count) % unlockedWeapons.count]
    }

    func unlockWeapon(_ weapon: WeaponType) {
        guard !unlockedSet.contains(weapon) else { return }
        unlockedSet.insert(weapon)
        unlockedWeapons.append(weapon)
    }

    // MARK: - Chest / Lore
    func collectHeartPiece(id: String) {
        guard !heartPiecesCollected.contains(id) else { return }
        heartPiecesCollected.insert(id)
        let count = heartPiecesCollected.count
        maxHearts = CGFloat(3 + count / 4)
        let rem = count % 4
        itemFanfare = ItemFanfare(
            name: "Heart Piece (\(rem==0 ? "4/4" : "\(rem)/4"))",
            icon: rem==0 ? "❤️" : "🫀",
            desc: rem==0 ? "New Heart Container!" : "\(4-rem) more for a new heart!")
    }

    func openChest(id: String) { chestsOpened.insert(id) }

    // MARK: - Reset
    func resetGame() {
        hearts=5; maxHearts=5; rupees=0; armorLevel=0
        arrows=10; moonbowAmmo=8; bombs=5; shurikens=15; frostCharges=8; flareCharges=3; boomerangReady=true
        activeWeapon = .sword; unlockedWeapons=[.sword]; unlockedSet=[.sword]
        currentArea = .field; shardsCollected=0; chestsOpened=[]; heartPiecesCollected=[]
        talkedToNPCs=[]; loreRead=[]; areasVisited=[.field]
        bossHP=20; bossDefeated=false
        guardianDefeated=[]; currentGuardianHP=0; currentGuardianMaxHP=0
        score=0; comboCount=0; comboTimer=0; eliteKills=0; runStartTime=Date()
        gameState = .playing; itemFanfare=nil
    }

    var elapsedSeconds: Int { Int(Date().timeIntervalSince(runStartTime)) }
    var elapsedFormatted: String {
        let s = elapsedSeconds; return String(format: "%d:%02d", s/60, s%60)
    }
}
