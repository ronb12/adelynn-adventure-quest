import SpriteKit
import UIKit

class GuardianNode: SKNode {

    let cfg: WorldConfig.GuardianCfg
    var hp: CGFloat
    var isDead = false
    var isPhase2: Bool { hp < cfg.maxHP * 0.5 }

    private var bodyNode: SKShapeNode!
    private var hurtTimer: TimeInterval = 0
    private var boltTimer: TimeInterval = 0
    private var moveTimer: TimeInterval = 0
    private var moveTarget: CGPoint = .zero
    private var chillRemaining: TimeInterval = 0
    private var burnStacks: Int = 0
    private var burnTickTimer: TimeInterval = 0

    init(cfg: WorldConfig.GuardianCfg) {
        self.cfg = cfg
        self.hp = cfg.maxHP
        super.init()
        buildVisual()
        setupPhysics()
        boltTimer = cfg.boltRate1 * 0.5
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Visual
    private func buildVisual() {
        let s = cfg.size / 2

        // Main body
        let bodyPath = buildGuardianPath(size: s)
        bodyNode = SKShapeNode(path: bodyPath)
        bodyNode.fillColor = cfg.bodyColor
        bodyNode.strokeColor = cfg.accentColor
        bodyNode.lineWidth = 3
        addChild(bodyNode)

        let silPath = buildGuardianPath(size: s * 1.08)
        let silhouette = SKShapeNode(path: silPath)
        silhouette.fillColor = UIColor(white: 0, alpha: 0.34)
        silhouette.strokeColor = .clear
        silhouette.position = CGPoint(x: 3, y: -4)
        silhouette.zPosition = -2
        insertChild(silhouette, at: 0)

        // Inner core
        let corePath = buildGuardianPath(size: s * 0.5)
        let core = SKShapeNode(path: corePath)
        core.fillColor = cfg.accentColor.withAlphaComponent(0.7)
        core.strokeColor = .clear
        addChild(core)
        core.run(SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 4)))

        // Name label
        let nameLabel = SKLabelNode(text: cfg.name)
        nameLabel.fontName = "Georgia-Bold"
        nameLabel.fontSize = 12
        nameLabel.fontColor = cfg.accentColor
        nameLabel.position = CGPoint(x: 0, y: s + 14)
        nameLabel.verticalAlignmentMode = .center
        addChild(nameLabel)

        let titleLabel = SKLabelNode(text: cfg.title)
        titleLabel.fontName = "Georgia-Italic"
        titleLabel.fontSize = 9
        titleLabel.fontColor = cfg.accentColor.withAlphaComponent(0.8)
        titleLabel.position = CGPoint(x: 0, y: s + 4)
        titleLabel.verticalAlignmentMode = .center
        addChild(titleLabel)

        // Orbit particles
        for i in 0..<3 {
            let angle = CGFloat(i) / 3 * .pi * 2
            let orb = SKShapeNode(circleOfRadius: 5)
            orb.fillColor = cfg.accentColor
            orb.strokeColor = .clear
            orb.position = CGPoint(x: cos(angle) * s * 1.3, y: sin(angle) * s * 1.3)
            addChild(orb)
            orb.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.wait(forDuration: Double(i) * 0.4),
                SKAction.moveBy(x: CGFloat.random(in:-5...5), y: CGFloat.random(in:-5...5), duration: 0.4),
                SKAction.moveBy(x: CGFloat.random(in:-5...5), y: CGFloat.random(in:-5...5), duration: 0.4)
            ])))
        }

        // Aura glow
        let glow = SKShapeNode(circleOfRadius: s * 1.6)
        glow.fillColor = cfg.accentColor.withAlphaComponent(0.08)
        glow.strokeColor = cfg.accentColor.withAlphaComponent(0.3)
        glow.lineWidth = 2
        glow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.3, duration: 1.2),
            SKAction.fadeAlpha(to: 1.0, duration: 1.2)
        ])))
        insertChild(glow, at: 0)

        // Pulse animation
        bodyNode.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.06, duration: 0.8),
            SKAction.scale(to: 0.96, duration: 0.8)
        ])))
    }

    private func buildGuardianPath(size: CGFloat) -> CGPath {
        // Hexagonal shape
        let path = UIBezierPath()
        for i in 0..<6 {
            let angle = CGFloat(i) * .pi / 3 - .pi / 6
            let pt = CGPoint(x: cos(angle) * size, y: sin(angle) * size)
            i == 0 ? path.move(to: pt) : path.addLine(to: pt)
        }
        path.close()
        return path.cgPath
    }

    private func setupPhysics() {
        let r = cfg.size / 2
        let body = SKPhysicsBody(circleOfRadius: r)
        body.isDynamic = true; body.allowsRotation = false; body.linearDamping = 5
        body.categoryBitMask = PhysicsCategory.guardian
        body.contactTestBitMask = PhysicsCategory.playerWeapon
        body.collisionBitMask = PhysicsCategory.wall | PhysicsCategory.player | PhysicsCategory.enemy
            | PhysicsCategory.chest | PhysicsCategory.loreStone | PhysicsCategory.shard
        physicsBody = body
    }

    // MARK: - Update
    func update(playerPosition: CGPoint, delta: TimeInterval) {
        guard !isDead else { return }
        if hurtTimer > 0 { hurtTimer -= delta }
        if chillRemaining > 0 { chillRemaining -= delta }

        if burnStacks > 0 {
            burnTickTimer -= delta
            while burnTickTimer <= 0 && burnStacks > 0 && !isDead {
                burnTickTimer += 0.58
                let defeated = GameStore.shared.damageGuardian(0.26)
                burnStacks -= 1
                hp = GameStore.shared.currentGuardianHP
                if let w = scene?.childNode(withName: "world") {
                    GameJuice.addHitSparks(to: w, at: position, color: UIColor(red: 1, green: 0.42, blue: 0.08, alpha: 1), count: 5)
                }
                bodyNode.run(SKAction.sequence([
                    SKAction.colorize(with: UIColor.orange, colorBlendFactor: 0.4, duration: 0.05),
                    SKAction.colorize(withColorBlendFactor: 0, duration: 0.12)
                ]))
                if defeated { isDead = true; return }
            }
        }

        let speed = isPhase2 ? cfg.speed2 : cfg.speed1
        let chillMult: CGFloat = chillRemaining > 0 ? 0.62 : 1
        let dir = (playerPosition - position).normalized()

        // Chase player
        physicsBody?.velocity = CGVector(dx: dir.x * speed * chillMult, dy: dir.y * speed * chillMult)
        zRotation = atan2(dir.y, dir.x) - .pi / 2

        // Fire bolts
        boltTimer -= delta * (chillRemaining > 0 ? 0.55 : 1)
        if boltTimer <= 0 {
            let rate = isPhase2 ? cfg.boltRate2 : cfg.boltRate1
            boltTimer = rate
            let count = isPhase2 ? cfg.bolts2 : cfg.bolts1
            fireBolts(toward: playerPosition, count: count)
        }

        // Phase 2 visual effect
        if isPhase2 && !bodyNode.hasActions() {
            bodyNode.fillColor = cfg.accentColor
            bodyNode.strokeColor = cfg.bodyColor
        }
    }

    private func fireBolts(toward target: CGPoint, count: Int) {
        guard let scene = scene else { return }
        let baseDir = (target - position).normalized()
        let spread = count > 1 ? CGFloat.pi / CGFloat(count) * 0.6 : 0

        for i in 0..<count {
            let angle = spread * CGFloat(i) - spread * CGFloat(count-1) / 2
            let rotated = CGPoint(
                x: baseDir.x * cos(angle) - baseDir.y * sin(angle),
                y: baseDir.x * sin(angle) + baseDir.y * cos(angle)
            )
            let proj = EnemyProjectileNode(damage: isPhase2 ? 0.75 : 0.5,
                                           color: cfg.boltColor, radius: 9)
            proj.position = position + rotated * (cfg.size / 2 + 12)
            proj.zPosition = 5
            proj.physicsBody?.velocity = CGVector(dx: rotated.x * cfg.boltSpeed,
                                                  dy: rotated.y * cfg.boltSpeed)
            scene.childNode(withName: "world")?.addChild(proj)
            proj.run(SKAction.sequence([SKAction.wait(forDuration: 3.0), SKAction.removeFromParent()]))
        }
    }

    // MARK: - Damage
    func takeDamage(_ amount: CGFloat, isCritical: Bool = false, hitEffect: ProjectileHitEffect = .physical) {
        guard !isDead && hurtTimer <= 0 else { return }
        hurtTimer = isCritical ? 0.14 : 0.2

        switch hitEffect {
        case .burn:
            burnStacks = min(5, burnStacks + 1)
            burnTickTimer = min(burnTickTimer, 0.2)
        case .chill:
            chillRemaining = max(chillRemaining, 1.55)
        case .physical:
            break
        }

        let defeated = GameStore.shared.damageGuardian(amount)
        hp = GameStore.shared.currentGuardianHP

        // Flash
        bodyNode.run(SKAction.sequence([
            SKAction.colorize(with: .white, colorBlendFactor: 0.9, duration: 0.06),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.14)
        ]))

        if isCritical {
            let lbl = SKLabelNode(text: "CRIT! -\(Int(ceil(amount * 10)))")
            lbl.fontName = "AvenirNext-Heavy"
            lbl.fontSize = 14
            lbl.fontColor = UIColor(red: 1, green: 0.9, blue: 0.2, alpha: 1)
            lbl.position = CGPoint(x: 0, y: cfg.size * 0.65)
            lbl.zPosition = 30
            addChild(lbl)
            lbl.run(SKAction.sequence([
                SKAction.group([SKAction.moveBy(x: 0, y: 24, duration: 0.4), SKAction.fadeOut(withDuration: 0.5)]),
                SKAction.removeFromParent()
            ]))
        }

        if defeated { isDead = true }
    }

    func playDeathEffect() {
        run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 2.0, duration: 0.4),
                SKAction.fadeOut(withDuration: 0.4)
            ]),
            SKAction.removeFromParent()
        ]))
    }
}
