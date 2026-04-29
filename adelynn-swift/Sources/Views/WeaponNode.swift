import SpriteKit
import UIKit

// MARK: - Player Weapon / Hitbox
class WeaponProjectileNode: SKNode {
    let damage: CGFloat
    let isPersistent: Bool
    var hitEffect: ProjectileHitEffect = .physical
    /// Used for mastery damage bonus (kills tracked separately per weapon).
    var sourceWeapon: WeaponType = .sword
    var hasHit = false

    init(damage: CGFloat, isPersistent: Bool, hitEffect: ProjectileHitEffect = .physical, sourceWeapon: WeaponType = .sword) {
        self.damage = damage
        self.isPersistent = isPersistent
        self.hitEffect = hitEffect
        self.sourceWeapon = sourceWeapon
        super.init()
        name = "playerWeapon"
    }
    required init?(coder: NSCoder) { fatalError() }

    func onHit() {
        guard !isPersistent else { return }
        if !hasHit {
            hasHit = true
            // Small flash then remove
            run(SKAction.sequence([
                SKAction.fadeOut(withDuration: 0.06),
                SKAction.removeFromParent()
            ]))
        }
    }
}

// MARK: - Enemy Projectile
class EnemyProjectileNode: SKNode {
    let damage: CGFloat

    init(damage: CGFloat, color: UIColor, radius: CGFloat = 7) {
        self.damage = damage
        super.init()
        name = "enemyWeapon"

        let visual = SKShapeNode(circleOfRadius: radius)
        visual.fillColor = color
        visual.strokeColor = color.withAlphaComponent(0.6)
        visual.lineWidth = 1
        addChild(visual)

        // Trailing glow
        let glow = SKShapeNode(circleOfRadius: radius + 3)
        glow.fillColor = .clear
        glow.strokeColor = color.withAlphaComponent(0.3)
        glow.lineWidth = 2
        addChild(glow)

        let body = SKPhysicsBody(circleOfRadius: radius)
        body.isDynamic = true
        body.affectedByGravity = false
        body.linearDamping = 0
        body.categoryBitMask = PhysicsCategory.enemyWeapon
        body.contactTestBitMask = PhysicsCategory.player
        body.collisionBitMask = PhysicsCategory.none
        physicsBody = body
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - Sword Slash Arc (purely visual)
class SwordSlashNode: SKNode {
    init(color: UIColor, radius: CGFloat = 52, damage: CGFloat) {
        super.init()
        name = "playerWeapon"

        let arcPath = UIBezierPath()
        arcPath.addArc(withCenter: .zero, radius: radius,
                       startAngle: -CGFloat.pi * 0.85,
                       endAngle: -CGFloat.pi * 0.15, clockwise: false)
        let arc = SKShapeNode(path: arcPath.cgPath)
        arc.strokeColor = color
        arc.lineWidth = 10
        arc.lineCap = .round
        arc.fillColor = color.withAlphaComponent(0.12)
        addChild(arc)

        // Hitbox (physics on WeaponProjectileNode so contacts resolve mastery/elementals)
        let hitbox = WeaponProjectileNode(damage: damage, isPersistent: true, hitEffect: .physical, sourceWeapon: .sword)
        let pb = SKPhysicsBody(circleOfRadius: radius)
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.playerWeapon
        pb.contactTestBitMask = PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        pb.collisionBitMask = PhysicsCategory.none
        hitbox.physicsBody = pb
        addChild(hitbox)

        run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.18),
            SKAction.removeFromParent()
        ]))
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - Generic Ranged Projectile Builder
func makePlayerBolt(damage: CGFloat, color: UIColor, speed: CGFloat,
                    from pos: CGPoint, direction: CGPoint,
                    radius: CGFloat = 7, lifetime: TimeInterval = 2.0,
                    hitEffect: ProjectileHitEffect = .physical,
                    sourceWeapon: WeaponType = .sword) -> WeaponProjectileNode {
    let proj = WeaponProjectileNode(damage: damage, isPersistent: false, hitEffect: hitEffect, sourceWeapon: sourceWeapon)

    let visual = SKShapeNode(circleOfRadius: radius)
    visual.fillColor = color
    visual.strokeColor = color.withAlphaComponent(0.5)
    visual.lineWidth = 1
    proj.addChild(visual)

    let pb = SKPhysicsBody(circleOfRadius: radius)
    pb.isDynamic = true
    pb.affectedByGravity = false
    pb.linearDamping = 0
    pb.categoryBitMask = PhysicsCategory.playerWeapon
    pb.contactTestBitMask = PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
    pb.collisionBitMask = PhysicsCategory.none
    pb.velocity = CGVector(dx: direction.x * speed, dy: direction.y * speed)
    proj.physicsBody = pb

    proj.position = pos + direction * 28
    proj.zPosition = 6
    proj.run(SKAction.sequence([SKAction.wait(forDuration: lifetime), SKAction.removeFromParent()]))
    return proj
}
