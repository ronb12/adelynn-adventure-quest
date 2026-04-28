import SpriteKit
import UIKit

class BossNode: SKNode {

    var hp: CGFloat { GameStore.shared.bossHP }
    var maxHP: CGFloat { GameStore.shared.bossMaxHP }
    var isDead = false
    var isPhase2: Bool { hp < maxHP * 0.5 }

    private var bodyNode: SKShapeNode!
    private var cloakNode: SKShapeNode!
    private var eyesNode: SKNode!
    private var hurtTimer: TimeInterval = 0
    private var boltTimer: TimeInterval = 0
    private var teleportTimer: TimeInterval = 0
    private var sweepTimer: TimeInterval = 0
    private var isVulnerable = true
    private var invulnWindow: TimeInterval = 0
    private var phase2Triggered = false

    override init() {
        super.init()
        buildVisual()
        setupPhysics()
        boltTimer = 2.0
        teleportTimer = 8.0
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Visual
    private func buildVisual() {
        // Dark cloak body (large)
        let cloakPath = UIBezierPath()
        cloakPath.move(to: CGPoint(x:0, y:55))
        cloakPath.addLine(to: CGPoint(x:35, y:20))
        cloakPath.addLine(to: CGPoint(x:45, y:-40))
        cloakPath.addLine(to: CGPoint(x:20, y:-60))
        cloakPath.addLine(to: CGPoint(x:-20, y:-60))
        cloakPath.addLine(to: CGPoint(x:-45, y:-40))
        cloakPath.addLine(to: CGPoint(x:-35, y:20))
        cloakPath.close()

        cloakNode = SKShapeNode(path: cloakPath.cgPath)
        cloakNode.fillColor = UIColor(red:0.04, green:0.0, blue:0.10, alpha:1)
        cloakNode.strokeColor = UIColor(red:0.5, green:0.0, blue:0.8, alpha:0.8)
        cloakNode.lineWidth = 2.5
        addChild(cloakNode)

        // Glowing runes on cloak
        for i in 0..<5 {
            let rune = SKShapeNode(circleOfRadius: 3)
            let angle = CGFloat(i) * .pi * 0.4 - .pi * 0.8
            rune.position = CGPoint(x: cos(angle)*28, y: sin(angle)*28 - 15)
            rune.fillColor = UIColor(red:0.7, green:0.0, blue:1.0, alpha:0.9)
            rune.strokeColor = .clear
            rune.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to:0.2, duration:CGFloat.random(in:0.3...0.8)),
                SKAction.fadeAlpha(to:1.0, duration:CGFloat.random(in:0.3...0.8))
            ])))
            addChild(rune)
        }

        // Body core
        bodyNode = SKShapeNode(circleOfRadius: 28)
        bodyNode.fillColor = UIColor(red:0.15, green:0.0, blue:0.30, alpha:1)
        bodyNode.strokeColor = UIColor(red:0.8, green:0.2, blue:1.0, alpha:0.6)
        bodyNode.lineWidth = 2
        addChild(bodyNode)

        // Crown
        let crownPath = UIBezierPath()
        crownPath.move(to: CGPoint(x:-18, y:55))
        crownPath.addLine(to: CGPoint(x:-18, y:70))
        crownPath.addLine(to: CGPoint(x:-8, y:63))
        crownPath.addLine(to: CGPoint(x:0, y:78))
        crownPath.addLine(to: CGPoint(x:8, y:63))
        crownPath.addLine(to: CGPoint(x:18, y:70))
        crownPath.addLine(to: CGPoint(x:18, y:55))
        crownPath.close()
        let crown = SKShapeNode(path: crownPath.cgPath)
        crown.fillColor = UIColor(red:0.6, green:0.0, blue:0.8, alpha:1)
        crown.strokeColor = UIColor(red:1.0, green:0.5, blue:1.0, alpha:0.8)
        crown.lineWidth = 1.5
        addChild(crown)

        // Eyes (two glowing red)
        eyesNode = SKNode()
        for xOff: CGFloat in [-11, 11] {
            let eye = SKShapeNode(circleOfRadius: 6)
            eye.fillColor = UIColor(red:1.0, green:0.1, blue:0.1, alpha:1)
            eye.strokeColor = UIColor(red:1.0, green:0.5, blue:0.5, alpha:0.5)
            eye.lineWidth = 2
            eye.position = CGPoint(x: xOff, y: 10)
            eyesNode.addChild(eye)
            eye.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.scale(to:1.3, duration:0.4), SKAction.scale(to:0.8, duration:0.4)
            ])))
        }
        addChild(eyesNode)

        // Name
        let nameLabel = SKLabelNode(text: "Malgrath")
        nameLabel.fontName = "Georgia-Bold"
        nameLabel.fontSize = 16
        nameLabel.fontColor = UIColor(red:0.8, green:0.4, blue:1.0, alpha:1)
        nameLabel.position = CGPoint(x:0, y:88)
        nameLabel.verticalAlignmentMode = .center
        addChild(nameLabel)

        let titleLabel = SKLabelNode(text: "The Shattered King")
        titleLabel.fontName = "Georgia-Italic"
        titleLabel.fontSize = 11
        titleLabel.fontColor = UIColor(red:0.6, green:0.3, blue:0.8, alpha:0.8)
        titleLabel.position = CGPoint(x:0, y:75)
        titleLabel.verticalAlignmentMode = .center
        addChild(titleLabel)

        // Aura
        let aura = SKShapeNode(circleOfRadius: 60)
        aura.fillColor = UIColor(red:0.3, green:0.0, blue:0.6, alpha:0.08)
        aura.strokeColor = UIColor(red:0.5, green:0.0, blue:0.9, alpha:0.25)
        aura.lineWidth = 3
        aura.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to:0.3, duration:1.5), SKAction.fadeAlpha(to:1.0, duration:1.5)
        ])))
        insertChild(aura, at:0)

        // Float animation
        run(SKAction.repeatForever(SKAction.sequence([
            SKAction.moveBy(x:0, y:8, duration:1.2),
            SKAction.moveBy(x:0, y:-8, duration:1.2)
        ])))
    }

    private func setupPhysics() {
        let body = SKPhysicsBody(circleOfRadius: 40)
        body.isDynamic = true; body.allowsRotation = false; body.linearDamping = 6
        body.categoryBitMask = PhysicsCategory.boss
        body.contactTestBitMask = PhysicsCategory.playerWeapon
        body.collisionBitMask = PhysicsCategory.wall
        physicsBody = body
    }

    // MARK: - Update
    func update(playerPosition: CGPoint, delta: TimeInterval) {
        guard !isDead else { return }
        if hurtTimer > 0 { hurtTimer -= delta }
        if invulnWindow > 0 { invulnWindow -= delta; isVulnerable = invulnWindow <= 0 }

        let dir = (playerPosition - position).normalized()
        let speed: CGFloat = isPhase2 ? 140 : 90
        physicsBody?.velocity = CGVector(dx: dir.x*speed, dy: dir.y*speed)
        zRotation = atan2(dir.y, dir.x) - .pi / 2

        // Fire shadow bolts
        boltTimer -= delta
        if boltTimer <= 0 {
            boltTimer = isPhase2 ? 1.0 : 2.2
            fireShadowBolts(toward: playerPosition)
        }

        // Teleport in phase 2
        if isPhase2 {
            teleportTimer -= delta
            if teleportTimer <= 0 {
                teleportTimer = CGFloat.random(in: 3.5...6.0)
                performTeleport(near: playerPosition)
            }
        }

        // Trigger phase 2 change
        if !phase2Triggered && isPhase2 {
            phase2Triggered = true
            triggerPhase2()
        }

        // Sweep attack at close range
        let dist = position.distance(to: playerPosition)
        if dist < 60 {
            sweepTimer -= delta
            if sweepTimer <= 0 {
                sweepTimer = 2.5
                GameStore.shared.damagePlayer(1.0)
            }
        }
    }

    private func fireShadowBolts(toward target: CGPoint) {
        guard let scene = scene else { return }
        let boltCount = isPhase2 ? 5 : 3
        let boltColor = UIColor(red:0.7, green:0.0, blue:1.0, alpha:1)

        for i in 0..<boltCount {
            let spreadAngle = CGFloat(i - boltCount/2) * (.pi / CGFloat(boltCount)) * 0.5
            let baseDir = (target - position).normalized()
            let dir = CGPoint(
                x: baseDir.x * cos(spreadAngle) - baseDir.y * sin(spreadAngle),
                y: baseDir.x * sin(spreadAngle) + baseDir.y * cos(spreadAngle)
            )
            let bolt = EnemyProjectileNode(damage: isPhase2 ? 1.0 : 0.75, color: boltColor, radius: 10)
            bolt.position = position + dir * 55
            bolt.zPosition = 5
            let spd: CGFloat = isPhase2 ? 420 : 340
            bolt.physicsBody?.velocity = CGVector(dx: dir.x*spd, dy: dir.y*spd)
            scene.childNode(withName: "world")?.addChild(bolt)
            bolt.run(SKAction.sequence([SKAction.wait(forDuration:3.5), SKAction.removeFromParent()]))
        }
    }

    private func performTeleport(near target: CGPoint) {
        isVulnerable = false
        invulnWindow = 0.8

        run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.2),
            SKAction.run { [weak self] in
                guard let self else { return }
                let angle = CGFloat.random(in: 0...(2 * .pi))
                let dist: CGFloat = CGFloat.random(in: 80...160)
                self.position = CGPoint(x: target.x + cos(angle)*dist, y: target.y + sin(angle)*dist)
            },
            SKAction.fadeIn(withDuration: 0.2)
        ]))
    }

    private func triggerPhase2() {
        // Visual shift
        cloakNode.strokeColor = UIColor(red:1.0, green:0.2, blue:0.5, alpha:1)
        cloakNode.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.colorize(with: UIColor(red:0.3,green:0,blue:0.4,alpha:1), colorBlendFactor: 0.5, duration: 0.8),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.8)
        ])))

        // Rage burst
        for i in 0..<8 {
            let angle = CGFloat(i) * .pi / 4
            let dir = CGPoint(x: cos(angle), y: sin(angle))
            if let proj = buildRageBolt(dir: dir) {
                scene?.childNode(withName: "world")?.addChild(proj)
            }
        }
    }

    private func buildRageBolt(dir: CGPoint) -> EnemyProjectileNode? {
        let bolt = EnemyProjectileNode(damage: 0.5, color: UIColor(red:1.0,green:0.3,blue:0.6,alpha:1), radius: 8)
        bolt.position = position + dir * 60
        bolt.zPosition = 5
        bolt.physicsBody?.velocity = CGVector(dx: dir.x*380, dy: dir.y*380)
        bolt.run(SKAction.sequence([SKAction.wait(forDuration:3.0), SKAction.removeFromParent()]))
        return bolt
    }

    // MARK: - Damage
    func takeDamage(_ amount: CGFloat) {
        guard !isDead && hurtTimer <= 0 && isVulnerable else { return }
        hurtTimer = 0.15

        let defeated = GameStore.shared.damageBoss(amount)

        bodyNode.run(SKAction.sequence([
            SKAction.colorize(with: .white, colorBlendFactor: 0.95, duration: 0.06),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.15)
        ]))

        // Damage number
        let lbl = SKLabelNode(text: "-\(Int(ceil(amount * 10)))")
        lbl.fontName = "AvenirNext-Bold"; lbl.fontSize = 16
        lbl.fontColor = UIColor(red:1,green:0.8,blue:0,alpha:1)
        lbl.position = CGPoint(x:0, y:100); lbl.zPosition = 25
        addChild(lbl)
        lbl.run(SKAction.sequence([
            SKAction.group([SKAction.moveBy(x:0,y:30,duration:0.6), SKAction.fadeOut(withDuration:0.6)]),
            SKAction.removeFromParent()
        ]))

        if defeated { isDead = true }
    }

    func playDeathEffect() {
        removeAllActions()
        run(SKAction.sequence([
            SKAction.group([SKAction.scale(to:2.5, duration:0.6), SKAction.fadeOut(withDuration:0.6)]),
            SKAction.removeFromParent()
        ]))
    }
}
