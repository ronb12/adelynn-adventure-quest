import SpriteKit
import UIKit

class PlayerNode: SKNode {

    // MARK: - State
    var facingAngle: CGFloat = -.pi / 2
    var attackCooldown: TimeInterval = 0
    var hurtCooldown: TimeInterval = 0
    var spinCooldown: TimeInterval = 0
    var dodgeCooldown: TimeInterval = 0
    var isRunning = false

    // MARK: - Constants
    let walkSpeed: CGFloat = 165
    let runSpeed:  CGFloat = 290

    // MARK: - Visuals
    private var bodyNode: SKShapeNode!
    private var hairNode: SKShapeNode!
    private var eyeLeft: SKShapeNode!
    private var eyeRight: SKShapeNode!
    private var swordGlow: SKShapeNode!
    private var shadowNode: SKShapeNode!
    private let bodyFillDefault = UIColor(red: 0.15, green: 0.60, blue: 0.45, alpha: 1)

    override init() {
        super.init()
        buildVisual()
        setupPhysics()
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Build Visual
    private func buildVisual() {
        let outline = SKShapeNode(circleOfRadius: 20)
        outline.fillColor = .clear
        outline.strokeColor = UIColor(white: 0.06, alpha: 0.92)
        outline.lineWidth = 3.5
        outline.zPosition = -0.5
        addChild(outline)

        shadowNode = SKShapeNode(ellipseIn: CGRect(x: -18, y: -26, width: 36, height: 14))
        shadowNode.fillColor = UIColor(white: 0, alpha: 0.35)
        shadowNode.strokeColor = .clear
        shadowNode.zPosition = -2
        addChild(shadowNode)

        // Body (tunic — teal/green)
        bodyNode = SKShapeNode(circleOfRadius: 17)
        bodyNode.fillColor = bodyFillDefault
        bodyNode.strokeColor = UIColor(red:0.05, green:0.32, blue:0.22, alpha:1)
        bodyNode.lineWidth = 2.5
        addChild(bodyNode)

        // Hair (auburn)
        let hairPath = UIBezierPath(ovalIn: CGRect(x:-17, y:6, width:34, height:16))
        hairNode = SKShapeNode(path: hairPath.cgPath)
        hairNode.fillColor = UIColor(red:0.60, green:0.25, blue:0.08, alpha:1)
        hairNode.strokeColor = UIColor(white: 0.04, alpha: 0.55)
        hairNode.lineWidth = 1
        addChild(hairNode)

        // Face
        for (xOff, _) in [(-6, eyeLeft), (6, eyeRight)] as [(CGFloat, SKShapeNode?)] {
            let e = SKShapeNode(circleOfRadius: 3)
            e.fillColor = UIColor(red:0.15, green:0.1, blue:0.35, alpha:1)
            e.strokeColor = .clear
            e.position = CGPoint(x: xOff, y: 5)
            addChild(e)
            if xOff < 0 { eyeLeft = e } else { eyeRight = e }
        }

        // Sword glow indicator
        swordGlow = SKShapeNode(circleOfRadius: 5)
        swordGlow.fillColor = UIColor(red:0.4, green:0.85, blue:1.0, alpha:0.85)
        swordGlow.strokeColor = .clear
        swordGlow.position = CGPoint(x:0, y:22)
        addChild(swordGlow)

        // Weapon color pulse
        swordGlow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to:0.4, duration:0.6),
            SKAction.fadeAlpha(to:1.0, duration:0.6)
        ])))
    }

    private func setupPhysics() {
        let body = SKPhysicsBody(circleOfRadius: 15)
        body.isDynamic = true; body.allowsRotation = false; body.linearDamping = 10
        body.categoryBitMask    = PhysicsCategory.player
        body.contactTestBitMask = PhysicsCategory.enemyWeapon
        body.collisionBitMask   = PhysicsCategory.wall | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
            | PhysicsCategory.chest | PhysicsCategory.loreStone | PhysicsCategory.shard
        physicsBody = body
    }

    // MARK: - Movement
    func updateMovement(direction: CGPoint, delta: TimeInterval) {
        if attackCooldown > 0 { attackCooldown -= delta }
        if hurtCooldown  > 0 { hurtCooldown  -= delta }
        if spinCooldown  > 0 { spinCooldown   -= delta }
        if dodgeCooldown > 0 { dodgeCooldown -= delta }

        if GameStore.shared.dodgeInvulnerabilityRemaining > 0 {
            bodyNode.fillColor = UIColor(red: 0.32, green: 0.82, blue: 0.95, alpha: 1)
            bodyNode.alpha = 0.86 + CGFloat(sin(CACurrentMediaTime() * 14)) * 0.1
        } else {
            bodyNode.fillColor = bodyFillDefault
            bodyNode.alpha = 1
        }

        if direction != .zero {
            var speed = isRunning ? runSpeed : walkSpeed
            if GameStore.shared.isBlocking { speed *= 0.38 }
            physicsBody?.velocity = CGVector(dx: direction.x*speed, dy: direction.y*speed)
            facingAngle = atan2(direction.y, direction.x) - .pi/2
            zRotation = facingAngle

            // Weapon dot follows direction
            swordGlow.position = CGPoint(x: direction.x*22, y: direction.y*22)

            // Update weapon glow color
            swordGlow.fillColor = GameStore.shared.activeWeapon.color

            // Walking bob
            let t = CACurrentMediaTime()
            bodyNode.position = CGPoint(x: 0, y: sin(t*9)*1.8)
        } else {
            physicsBody?.velocity = .zero
        }
    }

    // MARK: - Attack Dispatch
    func performAttack(in scene: SKNode) {
        guard attackCooldown <= 0 else { return }
        let store = GameStore.shared
        let dir = CGPoint(x: sin(facingAngle + .pi/2), y: cos(facingAngle + .pi/2))

        switch store.activeWeapon {
        case .sword:
            swordSlash(in: scene)
        case .bow:
            guard store.useArrow() else { return }
            fireBolt(in: scene, dir: dir, damage: 1.0, color: .from(hex:"#ffcc44"), speed: 520)
            attackCooldown = 0.5
        case .moonbow:
            guard store.useMoonbow() else { return }
            fireMoonbow(in: scene, dir: dir)
            attackCooldown = 0.6
        case .bomb:
            guard store.useBomb() else { return }
            throwBomb(in: scene, dir: dir)
            attackCooldown = 0.9
        case .wand:
            fireWandBolt(in: scene, dir: dir)
            attackCooldown = 0.3
        case .shuriken:
            guard store.useShuriken() else { return }
            fireShuriken(in: scene, dir: dir)
            attackCooldown = 0.22
        case .frost:
            guard store.useFrost() else { return }
            fireFrostCone(in: scene, dir: dir)
            attackCooldown = 0.75
        case .flare:
            guard store.useFlare() else { return }
            throwFlare(in: scene, dir: dir)
            attackCooldown = 1.1
        case .boomerang:
            guard store.boomerangReady else { return }
            store.boomerangReady = false
            throwBoomerang(in: scene, dir: dir)
            attackCooldown = 1.6
        }
    }

    // MARK: - Sword
    private func swordSlash(in scene: SKNode) {
        attackCooldown = 0.38
        let dm = GameStore.shared.swordDamageMultiplier
        let slash = SwordSlashNode(color: GameStore.shared.activeWeapon.color, damage: 1.5 * dm)
        slash.zRotation = facingAngle
        slash.position = position
        slash.zPosition = 6
        scene.addChild(slash)
        worldScene(from: scene)?.juiceSwordSwing()
        bodyNode.run(SKAction.sequence([SKAction.moveBy(x:0,y:3,duration:0.05), SKAction.moveBy(x:0,y:-3,duration:0.05)]))
    }

    // MARK: - Bow
    private func fireBolt(in scene: SKNode, dir: CGPoint, damage: CGFloat, color: UIColor, speed: CGFloat) {
        let proj = makePlayerBolt(damage:damage, color:color, speed:speed, from:position, direction:dir, sourceWeapon: .bow)
        proj.zPosition = 6
        scene.addChild(proj)
    }

    // MARK: - Moonbow (3-spread)
    private func fireMoonbow(in scene: SKNode, dir: CGPoint) {
        for i in -1...1 {
            let spread = CGFloat(i) * 0.22
            let d = CGPoint(x: dir.x*cos(spread)-dir.y*sin(spread),
                            y: dir.x*sin(spread)+dir.y*cos(spread))
            let proj = makePlayerBolt(damage:1.2, color:.from(hex:"#8844ff"), speed:470, from:position, direction:d, radius:8, hitEffect: .chill, sourceWeapon: .moonbow)
            proj.zPosition = 6
            scene.addChild(proj)
        }
    }

    // MARK: - Wand
    private func fireWandBolt(in scene: SKNode, dir: CGPoint) {
        let proj = makePlayerBolt(damage:0.5, color:.from(hex:"#ffff44"), speed:570, from:position, direction:dir, radius:5, lifetime:1.2, hitEffect: .burn, sourceWeapon: .wand)
        proj.zPosition = 6
        scene.addChild(proj)
    }

    // MARK: - Shuriken
    private func fireShuriken(in scene: SKNode, dir: CGPoint) {
        let proj = WeaponProjectileNode(damage:1.0, isPersistent:false, hitEffect: .physical, sourceWeapon: .shuriken)
        let star = buildStarNode(radius:9, points:5, color:.from(hex:"#cccccc"))
        star.run(SKAction.repeatForever(SKAction.rotate(byAngle:.pi*2, duration:0.4)))
        proj.addChild(star)
        let pb = SKPhysicsBody(circleOfRadius:7)
        pb.isDynamic = true; pb.affectedByGravity = false; pb.linearDamping = 0
        pb.categoryBitMask = PhysicsCategory.playerWeapon
        pb.contactTestBitMask = PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        pb.collisionBitMask = PhysicsCategory.none
        pb.velocity = CGVector(dx:dir.x*640, dy:dir.y*640)
        proj.physicsBody = pb
        proj.position = position + dir*25; proj.zPosition = 6
        proj.run(SKAction.sequence([SKAction.wait(forDuration:1.5), SKAction.removeFromParent()]))
        scene.addChild(proj)
    }

    // MARK: - Frost Cone
    private func fireFrostCone(in scene: SKNode, dir: CGPoint) {
        for i in -2...2 {
            let spread = CGFloat(i) * 0.18
            let d = CGPoint(x: dir.x*cos(spread)-dir.y*sin(spread),
                            y: dir.x*sin(spread)+dir.y*cos(spread))
            let proj = makePlayerBolt(damage:1.0, color:.from(hex:"#88eeff"), speed:400, from:position, direction:d, radius:9, lifetime:1.5, hitEffect: .chill, sourceWeapon: .frost)
            proj.zPosition = 6
            scene.addChild(proj)
        }
    }

    // MARK: - Bomb
    private func throwBomb(in scene: SKNode, dir: CGPoint) {
        let bombVisual = SKShapeNode(circleOfRadius:12)
        bombVisual.fillColor = .from(hex:"#334455"); bombVisual.strokeColor = .from(hex:"#ff8800"); bombVisual.lineWidth = 2
        let container = SKNode()
        container.addChild(bombVisual); container.position = position + dir*20; container.zPosition = 6
        scene.addChild(container)

        container.run(SKAction.sequence([
            SKAction.move(to: position + dir*130, duration: 0.45),
            SKAction.run { [weak container, weak self] in
                guard let pos = container?.position else { return }
                self?.explodeBomb(at:pos, in:scene)
                container?.removeFromParent()
            }
        ]))
    }

    private func explodeBomb(at pos: CGPoint, in scene: SKNode) {
        let explosion = WeaponProjectileNode(damage:5.0, isPersistent:true, hitEffect: .burn, sourceWeapon: .bomb)
        let visual = SKShapeNode(circleOfRadius:65)
        visual.fillColor = UIColor(red:1,green:0.5,blue:0,alpha:0.35)
        visual.strokeColor = UIColor(red:1,green:0.8,blue:0,alpha:0.85); visual.lineWidth = 3
        explosion.addChild(visual)
        let pb = SKPhysicsBody(circleOfRadius:65)
        pb.isDynamic = false; pb.categoryBitMask = PhysicsCategory.playerWeapon
        pb.contactTestBitMask = PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        pb.collisionBitMask = PhysicsCategory.none
        explosion.physicsBody = pb
        explosion.position = pos; explosion.zPosition = 6
        scene.addChild(explosion)
        worldScene(from: scene)?.juiceBomb(at: pos)
        visual.run(SKAction.sequence([SKAction.group([SKAction.scale(to:1.4,duration:0.28), SKAction.fadeOut(withDuration:0.28)]), SKAction.removeFromParent()]))
        explosion.run(SKAction.sequence([SKAction.wait(forDuration:0.2), SKAction.removeFromParent()]))
    }

    // MARK: - Flare
    private func throwFlare(in scene: SKNode, dir: CGPoint) {
        let proj = makePlayerBolt(damage:3.0, color:.from(hex:"#ffaa00"), speed:460, from:position, direction:dir, radius:13, lifetime:1.3, hitEffect: .burn, sourceWeapon: .flare)
        proj.zPosition = 6
        scene.addChild(proj)
    }

    // MARK: - Boomerang
    private func throwBoomerang(in scene: SKNode, dir: CGPoint) {
        let proj = WeaponProjectileNode(damage:0.8, isPersistent:false, hitEffect: .physical, sourceWeapon: .boomerang)
        let v = SKShapeNode(circleOfRadius:10)
        v.fillColor = .from(hex:"#cc8844"); v.strokeColor = .from(hex:"#ffcc66"); v.lineWidth = 1.5
        proj.addChild(v); v.run(SKAction.repeatForever(SKAction.rotate(byAngle:.pi*2, duration:0.38)))
        let pb = SKPhysicsBody(circleOfRadius:10)
        pb.isDynamic = true; pb.affectedByGravity = false; pb.linearDamping = 0
        pb.categoryBitMask = PhysicsCategory.playerWeapon
        pb.contactTestBitMask = PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        pb.collisionBitMask = PhysicsCategory.none
        proj.physicsBody = pb; proj.position = position + dir*22; proj.zPosition = 6
        let end = position + dir*210
        scene.addChild(proj)
        proj.run(SKAction.sequence([
            SKAction.move(to:end, duration:0.42),
            SKAction.move(to:position, duration:0.42),
            SKAction.run { GameStore.shared.boomerangReady = true },
            SKAction.removeFromParent()
        ]))
    }

    /// Dodge roll: burst movement + brief i-frames (double-tap Run).
    func performDodge(in scene: SKNode, joystickDirection: CGPoint) {
        guard dodgeCooldown <= 0, spinCooldown <= 0 else { return }
        dodgeCooldown = 1.05
        attackCooldown = max(attackCooldown, 0.22)
        let dir: CGPoint
        if joystickDirection.x * joystickDirection.x + joystickDirection.y * joystickDirection.y > 0.04 {
            dir = joystickDirection.normalized()
        } else {
            dir = CGPoint(x: sin(facingAngle + .pi / 2), y: cos(facingAngle + .pi / 2))
        }
        let burst: CGFloat = 395
        physicsBody?.velocity = CGVector(dx: dir.x * burst, dy: dir.y * burst)
        GameStore.shared.dodgeInvulnerabilityRemaining = max(GameStore.shared.dodgeInvulnerabilityRemaining, 0.42)
        GameStore.shared.isBlocking = false
        worldScene(from: scene)?.juiceDodgeRoll()
        GameJuice.addDodgeBurst(to: scene, at: position, color: GameStore.shared.activeWeapon.color)
        let squish = SKAction.sequence([
            SKAction.group([SKAction.scaleX(to: 1.14, y: 0.86, duration: 0.08), SKAction.fadeAlpha(to: 0.82, duration: 0.08)]),
            SKAction.group([SKAction.scaleX(to: 1, y: 1, duration: 0.12), SKAction.fadeAlpha(to: 1, duration: 0.12)])
        ])
        bodyNode.run(squish)
    }

    // MARK: - Spin Attack
    func performSpinAttack(in scene: SKNode) {
        guard spinCooldown <= 0 else { return }
        spinCooldown = 1.8; attackCooldown = 0.5
        worldScene(from: scene)?.juiceSpinAttack()
        let spin = WeaponProjectileNode(damage: 2.0 * GameStore.shared.swordDamageMultiplier, isPersistent:true, hitEffect: .physical, sourceWeapon: .sword)
        let visual = SKShapeNode(circleOfRadius:60)
        visual.fillColor = UIColor(red:0.4,green:0.8,blue:1.0,alpha:0.2)
        visual.strokeColor = UIColor(red:0.4,green:0.8,blue:1.0,alpha:0.8); visual.lineWidth = 5
        spin.addChild(visual)
        let pb = SKPhysicsBody(circleOfRadius:60)
        pb.isDynamic = false; pb.categoryBitMask = PhysicsCategory.playerWeapon
        pb.contactTestBitMask = PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        pb.collisionBitMask = PhysicsCategory.none
        spin.physicsBody = pb; spin.position = position; spin.zPosition = 6
        scene.addChild(spin)
        visual.run(SKAction.sequence([SKAction.fadeOut(withDuration:0.3), SKAction.removeFromParent()]))
        spin.run(SKAction.sequence([SKAction.wait(forDuration:0.25), SKAction.removeFromParent()]))
    }

    // MARK: - Hit Flash
    func flashHit() {
        guard hurtCooldown <= 0 else { return }
        hurtCooldown = 1.2
        let flash = SKAction.sequence([
            SKAction.colorize(with:.red, colorBlendFactor:0.9, duration:0.06),
            SKAction.colorize(withColorBlendFactor:0, duration:0.12),
            SKAction.colorize(with:.red, colorBlendFactor:0.7, duration:0.06),
            SKAction.colorize(withColorBlendFactor:0, duration:0.12),
            SKAction.colorize(with:.red, colorBlendFactor:0.5, duration:0.06),
            SKAction.colorize(withColorBlendFactor:0, duration:0.20),
        ])
        bodyNode.run(flash)
    }

    // MARK: - Helpers
    private func worldScene(from layer: SKNode) -> WorldScene? {
        layer.scene as? WorldScene
    }

    private func buildStarNode(radius: CGFloat, points: Int, color: UIColor) -> SKShapeNode {
        let path = UIBezierPath(); let inner = radius*0.42
        for i in 0..<points*2 {
            let angle = CGFloat(i) * .pi / CGFloat(points) - .pi/2
            let r = i%2==0 ? radius : inner
            let pt = CGPoint(x:cos(angle)*r, y:sin(angle)*r)
            i==0 ? path.move(to:pt) : path.addLine(to:pt)
        }
        path.close()
        let n = SKShapeNode(path:path.cgPath); n.fillColor=color; n.strokeColor = .white; n.lineWidth=0.5
        return n
    }
}
