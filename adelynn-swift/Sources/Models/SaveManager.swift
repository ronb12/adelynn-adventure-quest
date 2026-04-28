import Foundation

class SaveManager {
    static let shared = SaveManager()
    private let key = "adelynn_quest_v2"

    struct SaveData: Codable {
        var hearts, maxHearts: Double
        var rupees, arrows, moonbowAmmo, bombs, shurikens, frostCharges, flareCharges, armorLevel: Int
        var activeWeapon: String
        var unlockedWeapons: [String]
        var currentArea: String
        var shardsCollected: Int
        var chestsOpened, heartPiecesCollected, talkedToNPCs, loreRead, areasVisited: [String]
        var bossHP: Double
        var bossDefeated: Bool
        var guardianDefeated: [String]
        var score, eliteKills: Int
    }

    func hasSave() -> Bool { UserDefaults.standard.data(forKey: key) != nil }

    func save() {
        let s = GameStore.shared
        let d = SaveData(
            hearts: Double(s.hearts), maxHearts: Double(s.maxHearts),
            rupees: s.rupees, arrows: s.arrows, moonbowAmmo: s.moonbowAmmo, bombs: s.bombs,
            shurikens: s.shurikens, frostCharges: s.frostCharges, flareCharges: s.flareCharges,
            armorLevel: s.armorLevel, activeWeapon: s.activeWeapon.rawValue,
            unlockedWeapons: s.unlockedWeapons.map{$0.rawValue},
            currentArea: s.currentArea.rawValue, shardsCollected: s.shardsCollected,
            chestsOpened: Array(s.chestsOpened), heartPiecesCollected: Array(s.heartPiecesCollected),
            talkedToNPCs: Array(s.talkedToNPCs), loreRead: Array(s.loreRead),
            areasVisited: Array(s.areasVisited.map{$0.rawValue}),
            bossHP: Double(s.bossHP), bossDefeated: s.bossDefeated,
            guardianDefeated: Array(s.guardianDefeated.map{$0.rawValue}),
            score: s.score, eliteKills: s.eliteKills)
        if let e = try? JSONEncoder().encode(d) { UserDefaults.standard.set(e, forKey: key) }
    }

    @discardableResult func load() -> Bool {
        guard let raw = UserDefaults.standard.data(forKey: key),
              let d = try? JSONDecoder().decode(SaveData.self, from: raw) else { return false }
        let s = GameStore.shared
        s.hearts = CGFloat(d.hearts); s.maxHearts = CGFloat(d.maxHearts)
        s.rupees = d.rupees; s.arrows = d.arrows; s.moonbowAmmo = d.moonbowAmmo
        s.bombs = d.bombs; s.shurikens = d.shurikens; s.frostCharges = d.frostCharges
        s.flareCharges = d.flareCharges; s.armorLevel = d.armorLevel
        s.activeWeapon = WeaponType(rawValue: d.activeWeapon) ?? .sword
        s.unlockedWeapons = d.unlockedWeapons.compactMap{WeaponType(rawValue:$0)}
        s.unlockedSet = Set(s.unlockedWeapons)
        s.currentArea = AreaId(rawValue: d.currentArea) ?? .field
        s.shardsCollected = d.shardsCollected
        s.chestsOpened = Set(d.chestsOpened); s.heartPiecesCollected = Set(d.heartPiecesCollected)
        s.talkedToNPCs = Set(d.talkedToNPCs); s.loreRead = Set(d.loreRead)
        s.areasVisited = Set(d.areasVisited.compactMap{AreaId(rawValue:$0)})
        s.bossHP = CGFloat(d.bossHP); s.bossDefeated = d.bossDefeated
        s.guardianDefeated = Set(d.guardianDefeated.compactMap{AreaId(rawValue:$0)})
        s.score = d.score; s.eliteKills = d.eliteKills
        s.gameState = .playing
        return true
    }

    func deleteSave() { UserDefaults.standard.removeObject(forKey: key) }
}
