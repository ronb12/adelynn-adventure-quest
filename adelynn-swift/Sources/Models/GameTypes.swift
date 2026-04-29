import Foundation
import SpriteKit
import UIKit

// MARK: - Area
enum AreaId: String, Codable, CaseIterable {
    case field, forest, desert, boss, jungle, ice, volcano, sky, crypt, void, cave

    var displayName: String {
        switch self {
        case .field:   return "Sunfield Plains"
        case .forest:  return "Whisper Woods"
        case .desert:  return "Ashrock Summit"
        case .boss:    return "Malgrath's Keep"
        case .jungle:  return "Jungle Ruins"
        case .ice:     return "Frostpeak Tundra"
        case .volcano: return "Ember Volcano"
        case .sky:     return "Skyreach Islands"
        case .crypt:   return "Ancient Crypt"
        case .void:    return "The Void"
        case .cave:    return "Crystal Cavern"
        }
    }

    var subtitle: String {
        switch self {
        case .field:   return "Where the adventure begins"
        case .forest:  return "Ancient secrets hide in shadow"
        case .desert:  return "The shard calls from the sand"
        case .boss:    return "The Shattered Crown awaits…"
        case .jungle:  return "Vines remember old kings"
        case .ice:     return "The cold preserves all things"
        case .volcano: return "Fire forged the world"
        case .sky:     return "Above the clouds, truth waits"
        case .crypt:   return "The dead still serve"
        case .void:    return "Nothing and everything"
        case .cave:    return "Crystals sing in darkness"
        }
    }

    var backgroundColor: UIColor {
        switch self {
        case .field:   return UIColor(red:0.15, green:0.35, blue:0.12, alpha:1)
        case .forest:  return UIColor(red:0.05, green:0.15, blue:0.05, alpha:1)
        case .desert:  return UIColor(red:0.50, green:0.34, blue:0.12, alpha:1)
        case .boss:    return UIColor(red:0.04, green:0.00, blue:0.08, alpha:1)
        case .jungle:  return UIColor(red:0.04, green:0.20, blue:0.02, alpha:1)
        case .ice:     return UIColor(red:0.55, green:0.78, blue:0.95, alpha:1)
        case .volcano: return UIColor(red:0.22, green:0.04, blue:0.01, alpha:1)
        case .sky:     return UIColor(red:0.28, green:0.48, blue:0.92, alpha:1)
        case .crypt:   return UIColor(red:0.08, green:0.07, blue:0.06, alpha:1)
        case .void:    return UIColor(red:0.03, green:0.00, blue:0.07, alpha:1)
        case .cave:    return UIColor(red:0.04, green:0.02, blue:0.10, alpha:1)
        }
    }

    var accentColor: UIColor {
        switch self {
        case .field:   return UIColor(red:0.4,  green:0.9,  blue:0.3,  alpha:1)
        case .forest:  return UIColor(red:0.3,  green:0.8,  blue:0.3,  alpha:1)
        case .desert:  return UIColor(red:1.0,  green:0.7,  blue:0.2,  alpha:1)
        case .boss:    return UIColor(red:0.7,  green:0.2,  blue:1.0,  alpha:1)
        case .jungle:  return UIColor(red:0.3,  green:1.0,  blue:0.2,  alpha:1)
        case .ice:     return UIColor(red:0.7,  green:0.9,  blue:1.0,  alpha:1)
        case .volcano: return UIColor(red:1.0,  green:0.4,  blue:0.1,  alpha:1)
        case .sky:     return UIColor(red:0.7,  green:0.85, blue:1.0,  alpha:1)
        case .crypt:   return UIColor(red:0.9,  green:0.9,  blue:0.6,  alpha:1)
        case .void:    return UIColor(red:0.8,  green:0.1,  blue:1.0,  alpha:1)
        case .cave:    return UIColor(red:0.6,  green:0.4,  blue:1.0,  alpha:1)
        }
    }
}

// MARK: - Weapon
enum WeaponType: String, Codable, CaseIterable {
    case sword, bow, moonbow, bomb, boomerang, wand, frost, shuriken, flare

    var displayName: String {
        switch self {
        case .sword:     return "Crystal Sword"
        case .bow:       return "Bow & Arrow"
        case .moonbow:   return "Moonbow"
        case .bomb:      return "Bomb"
        case .boomerang: return "Shadow Veil"
        case .wand:      return "Wand of Sparks"
        case .frost:     return "Frost Wand"
        case .shuriken:  return "Shuriken"
        case .flare:     return "Fire Flare"
        }
    }

    var icon: String {
        switch self {
        case .sword:     return "⚔️"
        case .bow:       return "🏹"
        case .moonbow:   return "🌙"
        case .bomb:      return "💣"
        case .boomerang: return "🌑"
        case .wand:      return "🪄"
        case .frost:     return "❄️"
        case .shuriken:  return "⭐"
        case .flare:     return "☀️"
        }
    }

    var damage: CGFloat {
        switch self {
        case .sword:     return 1.5
        case .bow:       return 1.0
        case .moonbow:   return 1.2
        case .bomb:      return 5.0
        case .boomerang: return 0.8
        case .wand:      return 0.5
        case .frost:     return 1.0
        case .shuriken:  return 1.0
        case .flare:     return 3.0
        }
    }

    var color: UIColor {
        switch self {
        case .sword:     return .from(hex: "#88ccff")
        case .bow:       return .from(hex: "#ffcc44")
        case .moonbow:   return .from(hex: "#8844ff")
        case .bomb:      return .from(hex: "#ff8800")
        case .boomerang: return .from(hex: "#cc8844")
        case .wand:      return .from(hex: "#ffff44")
        case .frost:     return .from(hex: "#88eeff")
        case .shuriken:  return .from(hex: "#cccccc")
        case .flare:     return .from(hex: "#ffaa00")
        }
    }

    var requiresAmmo: Bool {
        switch self {
        case .sword: return false
        default:     return true
        }
    }
}

// MARK: - Enemy
enum EnemyType: String {
    case slime, bat, knight, briarwolf, scorpion, wraith, goblin, thornspitter

    var radius: CGFloat {
        switch self {
        case .knight:      return 18
        case .briarwolf:   return 17
        case .scorpion:    return 17
        case .bat:         return 14
        case .wraith:      return 16
        case .goblin:      return 14
        case .slime:       return 15
        case .thornspitter: return 13
        }
    }
}

enum EnemyBehavior { case chase, charge, ranged }

// MARK: - Physics
struct PhysicsCategory {
    static let none:         UInt32 = 0
    static let player:       UInt32 = 1 << 0
    static let enemy:        UInt32 = 1 << 1
    static let playerWeapon: UInt32 = 1 << 2
    static let enemyWeapon:  UInt32 = 1 << 3
    static let portal:       UInt32 = 1 << 4
    static let chest:        UInt32 = 1 << 5
    static let loreStone:    UInt32 = 1 << 6
    static let wall:         UInt32 = 1 << 7
    static let guardian:     UInt32 = 1 << 8
    static let boss:         UInt32 = 1 << 9
    static let shard:        UInt32 = 1 << 10
}

// MARK: - SpriteKit emoji / icon labels
/// Custom fonts omit emoji glyphs → **?** — use Apple’s emoji font for emoji-only `SKLabelNode` text.
enum SpriteKitEmojiSupport {
    static func applyEmojiFont(to label: SKLabelNode, size: CGFloat) {
        let uif = emojiUIFont(size: size)
        label.fontName = uif.fontName
        label.fontSize = uif.pointSize
    }

    static func emojiUIFont(size: CGFloat) -> UIFont {
        if let f = UIFont(name: "Apple Color Emoji", size: size) { return f }
        if let f = UIFont(name: "AppleColorEmoji", size: size) { return f }
        return .systemFont(ofSize: size)
    }
}

// MARK: - Data structs
struct ItemFanfare { let name: String; let icon: String; let desc: String }
struct PortalDef   { let position: CGPoint; let destinationArea: AreaId; let destinationPosition: CGPoint; let color: UIColor; let label: String }
struct EnemySpawnConfig { let count: Int; let maxHP: CGFloat; let speed: ClosedRange<CGFloat>; let bodyColor: UIColor; let accentColor: UIColor; let chaseRange: CGFloat; let enemyType: EnemyType; let behavior: EnemyBehavior }
struct ChestDef    { let id: String; let position: CGPoint; let weaponUnlock: WeaponType?; let rupeeReward: Int }
struct LoreStoneDef { let id: String; let position: CGPoint; let title: String; let text: String }
struct NPCDef      { let id: String; let name: String; let position: CGPoint; let color: UIColor; let lines: [String] }
struct ShopkeeperDef { let id: String; let position: CGPoint }

/// Elemental rider on player projectiles / explosions (enemies only for DOT/slow).
enum ProjectileHitEffect: Equatable {
    case physical
    case burn
    case chill
}
struct ShardDef    { let id: String; let areaId: AreaId; let position: CGPoint; let name: String }

// MARK: - Extensions
extension UIColor {
    static func from(hex: String) -> UIColor {
        var h = hex.trimmingCharacters(in: .whitespaces)
        if h.hasPrefix("#") { h = String(h.dropFirst()) }
        guard h.count == 6, let rgb = UInt64(h, radix: 16) else { return .gray }
        return UIColor(red: CGFloat((rgb>>16)&0xff)/255, green: CGFloat((rgb>>8)&0xff)/255,
                       blue: CGFloat(rgb&0xff)/255, alpha: 1)
    }
}

extension CGPoint {
    func distance(to p: CGPoint) -> CGFloat { sqrt((x-p.x)*(x-p.x)+(y-p.y)*(y-p.y)) }
    func normalized() -> CGPoint { let l = sqrt(x*x+y*y); guard l>0 else{return .zero}; return CGPoint(x:x/l,y:y/l) }
    static func +(l:CGPoint,r:CGPoint)->CGPoint { CGPoint(x:l.x+r.x,y:l.y+r.y) }
    static func -(l:CGPoint,r:CGPoint)->CGPoint { CGPoint(x:l.x-r.x,y:l.y-r.y) }
    static func *(l:CGPoint,r:CGFloat)->CGPoint { CGPoint(x:l.x*r,y:l.y*r) }
}
