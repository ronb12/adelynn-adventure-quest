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

    /// 0...8 — Crystal → Divine (upgrade on guardian defeats).
    var swordTier: Int = 0
    /// Hold-to-block (matches web “hold B”).
    var isBlocking: Bool = false

    /// Invulnerability after dodge roll (seconds remaining).
    var dodgeInvulnerabilityRemaining: TimeInterval = 0

    /// Last time block was pressed (for perfect parry window).
    private(set) var blockPressTime: TimeInterval = -1
    /// One-shot flag: UI/VFX should flash parry (consumed in WorldScene).
    var pendingParryPulse: Bool = false

    // MARK: - Progression
    var playerLevel: Int = 1
    var playerXP: Int = 0
    var totalEnemiesSlain: Int = 0
    var healthPotions: Int = 1
    /// Kills credited to the weapon that last damaged the enemy (DOT inherits last hit).
    var weaponKillCounts: [WeaponType: Int] = [:]

    static let swordTierNames = ["Crystal", "Iron", "Silver", "Golden", "Shadow", "Flame", "Ice", "Thunder", "Divine"]

    /// Melee damage scales gently per tier (~+11.5% per tier).
    var swordDamageMultiplier: CGFloat { 1.0 + CGFloat(min(max(swordTier, 0), 8)) * 0.115 }

    var xpToNextLevel: Int { 45 + playerLevel * 38 }

    /// Crit chance scales slightly with level (base ~11%).
    var effectiveCritChance: CGFloat { min(0.28, 0.11 + CGFloat(min(playerLevel, 22)) * 0.0045) }

    /// Up to +25% damage from kills with that weapon (~0.2% per kill).
    func weaponMasteryDamageMultiplier(for weapon: WeaponType) -> CGFloat {
        let k = weaponKillCounts[weapon, default: 0]
        return 1.0 + min(0.25, CGFloat(k) * 0.002)
    }

    var swordDisplayTitle: String {
        "\(Self.swordTierNames[min(max(swordTier, 0), 8)]) Sword"
    }

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

    func tickDodgeInvulnerability(_ delta: TimeInterval) {
        dodgeInvulnerabilityRemaining = max(0, dodgeInvulnerabilityRemaining - delta)
    }

    func markBlockPressed() {
        blockPressTime = ProcessInfo.processInfo.systemUptime
    }

    func grantXP(_ amount: Int) {
        guard amount > 0 else { return }
        playerXP += amount
        while playerXP >= xpToNextLevel {
            playerXP -= xpToNextLevel
            playerLevel += 1
            applyLevelUp()
        }
    }

    private func applyLevelUp() {
        healPlayer(2)
        if playerLevel % 2 == 0 {
            maxHearts = min(maxHearts + 0.5, 18)
        }
        score += 100 * playerLevel
        itemFanfare = ItemFanfare(
            name: "Level \(playerLevel)",
            icon: "✨",
            desc: "Max health grows. Crit chance rises. The Crown hears you."
        )
    }

    func registerEnemySlain(maxHP: CGFloat, wasElite: Bool, killingWeapon: WeaponType) {
        totalEnemiesSlain += 1
        weaponKillCounts[killingWeapon, default: 0] += 1
        let xp = Int(maxHP * 4) + (wasElite ? 28 : 0) + min(playerLevel, 14) * 3
        grantXP(xp)
    }

    // MARK: - Shop & consumables
    @discardableResult func buyHeartPotion() -> Bool {
        guard rupees >= 16 else { return false }
        rupees -= 16
        healthPotions += 1
        return true
    }

    @discardableResult func buyAmmoSatchel() -> Bool {
        guard rupees >= 24 else { return false }
        rupees -= 24
        arrows += 8
        bombs += 3
        shurikens += 10
        moonbowAmmo += 4
        frostCharges += 4
        return true
    }

    @discardableResult func buyArmorPolish() -> Bool {
        guard rupees >= 40, armorLevel < 2 else { return false }
        rupees -= 40
        armorLevel += 1
        return true
    }

    @discardableResult func useHeartPotion() -> Bool {
        guard healthPotions > 0 else { return false }
        healthPotions -= 1
        healPlayer(4)
        itemFanfare = ItemFanfare(name: "Heart Draught", icon: "❤️", desc: "Warmth returns — hearts restored.")
        return true
    }

    // MARK: - Damage / Heal
    func damagePlayer(_ amount: CGFloat) {
        if dodgeInvulnerabilityRemaining > 0 { return }
        var dmg = amount
        if isBlocking {
            let held = ProcessInfo.processInfo.systemUptime - blockPressTime
            if blockPressTime > 0, held >= 0, held < 0.26 {
                pendingParryPulse = true
                score += 22
                comboCount = min(5, comboCount + 1)
                comboTimer = max(comboTimer, 2.0)
                return
            }
            dmg *= 0.32
        }
        let mult: CGFloat = armorLevel==2 ? 0.5 : armorLevel==1 ? 0.75 : 1.0
        hearts = max(0, hearts - dmg * mult)
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
        swordTier = min(8, swordTier + 1)
        grantXP(120 + playerLevel * 8)
        itemFanfare = ItemFanfare(name: "Guardian Defeated!", icon: "👑", desc: "+15 Rupees · +1 Heart · Sword ascends!")
        return true
    }

    @discardableResult func damageBoss(_ dmg: CGFloat) -> Bool {
        bossHP = max(0, bossHP - dmg)
        guard bossHP <= 0 else { return false }
        bossDefeated = true
        score += 10000
        grantXP(420 + playerLevel * 12)
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
        swordTier=0; isBlocking=false; dodgeInvulnerabilityRemaining=0
        blockPressTime = -1; pendingParryPulse = false
        playerLevel=1; playerXP=0; totalEnemiesSlain=0; healthPotions=1; weaponKillCounts=[:]
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
