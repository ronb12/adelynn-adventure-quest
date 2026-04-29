import SpriteKit
import UIKit

/// Decaying camera shake — `impulse` adds energy; `tick` returns a random offset while magnitude decays.
final class ScreenShake {
    private var magnitude: CGFloat = 0

    func impulse(_ amount: CGFloat) {
        magnitude = min(magnitude + amount, 24)
    }

    func tick(delta: TimeInterval) -> CGVector {
        guard magnitude > 0.01 else { return .zero }
        let ox = (CGFloat.random(in: 0...1) - 0.5) * 2 * magnitude
        let oy = (CGFloat.random(in: 0...1) - 0.5) * 2 * magnitude
        magnitude *= pow(0.82, CGFloat(delta * 60))
        if magnitude < 0.2 { magnitude = 0 }
        return CGVector(dx: ox, dy: oy)
    }
}

enum GameJuice {

    static func addHitSparks(to parent: SKNode, at position: CGPoint, color: UIColor, count: Int = 8) {
        for _ in 0..<count {
            let r = CGFloat.random(in: 1.5...4)
            let spark = SKShapeNode(circleOfRadius: r)
            spark.fillColor = color
            spark.strokeColor = UIColor.white.withAlphaComponent(0.35)
            spark.lineWidth = 0.5
            spark.position = position
            spark.zPosition = 15
            parent.addChild(spark)
            let ang = CGFloat.random(in: 0..<(2 * .pi))
            let dist = CGFloat.random(in: 22...58)
            let lift = SKAction.group([
                SKAction.moveBy(x: cos(ang) * dist, y: sin(ang) * dist, duration: CGFloat.random(in: 0.12...0.22)),
                SKAction.fadeOut(withDuration: 0.2),
                SKAction.scale(to: 0.2, duration: 0.2)
            ])
            spark.run(SKAction.sequence([lift, SKAction.removeFromParent()]))
        }
    }

    static func addDeathBurst(to parent: SKNode, at position: CGPoint, accent: UIColor) {
        let ring = SKShapeNode(circleOfRadius: 8)
        ring.fillColor = .clear
        ring.strokeColor = accent.withAlphaComponent(0.85)
        ring.lineWidth = 3
        ring.position = position
        ring.zPosition = 14
        parent.addChild(ring)
        ring.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 3.2, duration: 0.28),
                SKAction.fadeOut(withDuration: 0.28)
            ]),
            SKAction.removeFromParent()
        ]))
        addHitSparks(to: parent, at: position, color: accent, count: 12)
        addHitSparks(to: parent, at: position, color: UIColor.white.withAlphaComponent(0.9), count: 4)
    }

    static func addExplosionFlash(to parent: SKNode, at position: CGPoint) {
        let core = SKShapeNode(circleOfRadius: 40)
        core.fillColor = UIColor(red: 1, green: 0.55, blue: 0.1, alpha: 0.45)
        core.strokeColor = UIColor(red: 1, green: 0.9, blue: 0.4, alpha: 0.9)
        core.lineWidth = 4
        core.position = position
        core.zPosition = 16
        parent.addChild(core)
        core.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.9, duration: 0.22),
                SKAction.fadeOut(withDuration: 0.25)
            ]),
            SKAction.removeFromParent()
        ]))
        addHitSparks(to: parent, at: position, color: UIColor(red: 1, green: 0.75, blue: 0.2, alpha: 1), count: 22)
    }

    static func addPainSparks(to parent: SKNode, at position: CGPoint) {
        addHitSparks(to: parent, at: position, color: UIColor(red: 1, green: 0.35, blue: 0.35, alpha: 1), count: 10)
        addHitSparks(to: parent, at: position, color: UIColor(red: 0.5, green: 0.65, blue: 1, alpha: 0.9), count: 5)
    }

    static func addDodgeBurst(to parent: SKNode, at position: CGPoint, color: UIColor) {
        for i in 0..<9 {
            let ang = CGFloat(i) / 9 * 2 * .pi + CGFloat.random(in: -0.2...0.2)
            let p = SKShapeNode(circleOfRadius: CGFloat.random(in: 2...5))
            p.fillColor = color.withAlphaComponent(0.75)
            p.strokeColor = UIColor.white.withAlphaComponent(0.35)
            p.lineWidth = 0.5
            p.position = position
            p.zPosition = 14
            parent.addChild(p)
            let d = CGFloat.random(in: 28...48)
            p.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: cos(ang) * d, y: sin(ang) * d, duration: 0.18),
                    SKAction.fadeOut(withDuration: 0.22),
                    SKAction.scale(to: 0.15, duration: 0.22)
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    static func addParryFlash(to parent: SKNode, at position: CGPoint) {
        let ring = SKShapeNode(circleOfRadius: 10)
        ring.fillColor = UIColor(red: 0.5, green: 0.85, blue: 1, alpha: 0.35)
        ring.strokeColor = UIColor.white.withAlphaComponent(0.95)
        ring.lineWidth = 4
        ring.position = position
        ring.zPosition = 19
        parent.addChild(ring)
        ring.run(SKAction.sequence([
            SKAction.group([SKAction.scale(to: 2.4, duration: 0.18), SKAction.fadeOut(withDuration: 0.22)]),
            SKAction.removeFromParent()
        ]))
        addHitSparks(to: parent, at: position, color: UIColor(red: 0.7, green: 0.95, blue: 1, alpha: 1), count: 14)
    }

    static func addCritFlash(to parent: SKNode, at position: CGPoint) {
        let ring = SKShapeNode(circleOfRadius: 6)
        ring.fillColor = UIColor(red: 1, green: 0.92, blue: 0.2, alpha: 0.35)
        ring.strokeColor = UIColor(red: 1, green: 0.85, blue: 0.1, alpha: 0.95)
        ring.lineWidth = 3
        ring.position = position
        ring.zPosition = 17
        parent.addChild(ring)
        ring.run(SKAction.sequence([
            SKAction.group([SKAction.scale(to: 2.8, duration: 0.2), SKAction.fadeOut(withDuration: 0.25)]),
            SKAction.removeFromParent()
        ]))
    }

    /// Parallax-style backdrop + drifting motes (per biome).
    static func attachAreaAtmosphere(to world: SKNode, area: AreaId) {
        let root = SKNode()
        root.zPosition = -18
        root.name = "areaAtmosphere"
        let ws = WorldConfig.worldSize
        let w = ws.width + 120
        let h = ws.height + 120

        let base = SKShapeNode(rectOf: CGSize(width: w, height: h), cornerRadius: 18)
        base.fillColor = area.backgroundColor
        base.strokeColor = area.accentColor.withAlphaComponent(0.12)
        base.lineWidth = 1
        root.addChild(base)

        let glow = SKShapeNode(ellipseIn: CGRect(x: -w * 0.35, y: -h * 0.2, width: w * 0.7, height: h * 0.55))
        glow.fillColor = area.accentColor.withAlphaComponent(0.08)
        glow.strokeColor = .clear
        root.addChild(glow)

        let vignette = SKShapeNode(ellipseIn: CGRect(x: -w * 0.48, y: -h * 0.48, width: w * 0.96, height: h * 0.96))
        vignette.fillColor = .clear
        vignette.strokeColor = UIColor.black.withAlphaComponent(0.22)
        vignette.lineWidth = 42
        root.addChild(vignette)

        let moteCount: Int
        switch area {
        case .forest, .jungle: moteCount = 28
        case .sky, .void:      moteCount = 36
        case .ice:             moteCount = 22
        case .volcano:         moteCount = 20
        default:               moteCount = 16
        }

        for _ in 0..<moteCount {
            let m = SKShapeNode(circleOfRadius: CGFloat.random(in: 0.6...2.4))
            m.fillColor = moteColor(for: area)
            m.strokeColor = .clear
            let x = CGFloat.random(in: -w / 2 ... w / 2)
            let y = CGFloat.random(in: -h / 2 ... h / 2)
            m.position = CGPoint(x: x, y: y)
            m.alpha = CGFloat.random(in: 0.2...0.85)
            root.addChild(m)
            let dur = Double.random(in: 2.8...6.2)
            let dx = CGFloat.random(in: -18...18)
            let dy = CGFloat.random(in: -14...14)
            m.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: dx, y: dy, duration: dur),
                SKAction.moveBy(x: -dx, y: -dy, duration: dur)
            ])))
            m.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.15, duration: Double.random(in: 0.8...2)),
                SKAction.fadeAlpha(to: 0.9, duration: Double.random(in: 0.8...2))
            ])))
        }

        world.addChild(root)
    }

    private static func moteColor(for area: AreaId) -> UIColor {
        switch area {
        case .field:   return UIColor(red: 0.9, green: 1, blue: 0.75, alpha: 1)
        case .forest:  return UIColor(red: 0.5, green: 1, blue: 0.55, alpha: 1)
        case .desert:  return UIColor(red: 1, green: 0.92, blue: 0.55, alpha: 1)
        case .boss:    return UIColor(red: 0.85, green: 0.45, blue: 1, alpha: 1)
        case .jungle:  return UIColor(red: 0.55, green: 1, blue: 0.65, alpha: 1)
        case .ice:     return UIColor.white
        case .volcano: return UIColor(red: 1, green: 0.55, blue: 0.2, alpha: 1)
        case .sky:     return UIColor(red: 0.85, green: 0.95, blue: 1, alpha: 1)
        case .crypt:   return UIColor(red: 0.95, green: 0.9, blue: 0.55, alpha: 1)
        case .void:    return UIColor(red: 0.75, green: 0.35, blue: 1, alpha: 1)
        case .cave:    return UIColor(red: 0.65, green: 0.55, blue: 1, alpha: 1)
        }
    }
}
