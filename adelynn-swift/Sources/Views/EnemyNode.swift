import SpriteKit
import UIKit

class EnemyNode: SKNode {

    // MARK: - Config
    let enemyType: EnemyType
    let behavior: EnemyBehavior
    let maxHP: CGFloat
    let moveSpeed: CGFloat
    let bodyColor: UIColor
    let accentColor: UIColor
    let chaseRange: CGFloat

    // MARK: - State
    var hp: CGFloat
    var isDead = false
    var hurtTimer: TimeInterval = 0
    var attackTimer: TimeInterval = 0
    var chargeTimer: TimeInterval = 0
    var isCharging = false
    var rangedCooldown: TimeInterval = CGFloat.random(in: 1.5...3.5)
    var meleeCooldown: TimeInterval = 0
    var chargeDirection = CGPoint.zero
    var isElite: Bool
    private var chillRemaining: TimeInterval = 0
    private var burnStacks: Int = 0
    private var burnTickTimer: TimeInterval = 0
    private var lastHitWeapon: WeaponType = .sword
    private var bodyNode: SKShapeNode!
    private var hpBarBg: SKShapeNode!
    private var hpBarFill: SKSpriteNode!

    // MARK: - Init
    init(enemyType: EnemyType, behavior: EnemyBehavior, maxHP: CGFloat, moveSpeed: CGFloat,
         bodyColor: UIColor, accentColor: UIColor, chaseRange: CGFloat) {
        self.enemyType = enemyType
        self.behavior = behavior
        self.maxHP = maxHP
        self.moveSpeed = moveSpeed
        self.bodyColor = bodyColor
        self.accentColor = accentColor
        self.chaseRange = chaseRange
        self.hp = maxHP
        self.isElite = maxHP >= 6 && Bool.random()
        super.init()
        buildVisual()
        setupPhysics()
        if isElite { addEliteGlow() }
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Visuals
    private func buildVisual() {
        let r = enemyType.radius

        // Main body shape
        let path: CGPath
        switch enemyType {
        case .slime:
            path = UIBezierPath(ovalIn: CGRect(x:-r, y:-r*0.7, width:r*2, height:r*1.4)).cgPath
        case .bat:
            let bp = UIBezierPath()
            bp.move(to: CGPoint(x:0, y:r))
            bp.addLine(to: CGPoint(x:r*0.8, y:-r*0.4))
            bp.addLine(to: CGPoint(x:r*1.5, y:-r*0.2))
            bp.addLine(to: CGPoint(x:r*0.6, y:-r))
            bp.addLine(to: CGPoint(x:0, y:-r*0.6))
            bp.addLine(to: CGPoint(x:-r*0.6, y:-r))
            bp.addLine(to: CGPoint(x:-r*1.5, y:-r*0.2))
            bp.addLine(to: CGPoint(x:-r*0.8, y:-r*0.4))
            bp.close()
            path = bp.cgPath
        case .knight:
            path = UIBezierPath(rect: CGRect(x:-r, y:-r, width:r*2, height:r*2)).cgPath
        case .briarwolf:
            let wp = UIBezierPath()
            wp.move(to: CGPoint(x:0, y:r)); wp.addLine(to: CGPoint(x:r*0.7, y:r*0.3))
            wp.addLine(to: CGPoint(x:r, y:-r*0.5)); wp.addLine(to: CGPoint(x:r*0.3, y:-r))
            wp.addLine(to: CGPoint(x:-r*0.3, y:-r)); wp.addLine(to: CGPoint(x:-r, y:-r*0.5))
            wp.addLine(to: CGPoint(x:-r*0.7, y:r*0.3)); wp.close()
            path = wp.cgPath
        case .scorpion:
            path = buildStarPath(radius: r, points: 5)
        case .wraith:
            let hp2 = UIBezierPath()
            hp2.move(to: CGPoint(x:0, y:r))
            hp2.addLine(to: CGPoint(x:r*0.6, y:r*0.3))
            hp2.addLine(to: CGPoint(x:r, y:-r*0.2))
            hp2.addLine(to: CGPoint(x:r*0.5, y:-r))
            hp2.addLine(to: CGPoint(x:0, y:-r*0.5))
            hp2.addLine(to: CGPoint(x:-r*0.5, y:-r))
            hp2.addLine(to: CGPoint(x:-r, y:-r*0.2))
            hp2.addLine(to: CGPoint(x:-r*0.6, y:r*0.3))
            hp2.close()
            path = hp2.cgPath
        case .goblin:
            path = buildStarPath(radius: r, points: 6)
        case .thornspitter:
            path = UIBezierPath(ovalIn: CGRect(x:-r, y:-r, width:r*2, height:r*2)).cgPath
        }

        bodyNode = SKShapeNode(path: path)
        bodyNode.fillColor = isElite ? accentColor : bodyColor
        bodyNode.strokeColor = accentColor
        bodyNode.lineWidth = 2.5
        bodyNode.name = "enemyBody"
        addChild(bodyNode)

        let shadow = SKShapeNode(path: path)
        shadow.fillColor = UIColor(white: 0, alpha: 0.38)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 2.5, y: -2)
        shadow.zPosition = -1
        insertChild(shadow, at: 0)

        // Eyes
        for xOff: CGFloat in [-r*0.3, r*0.3] {
            let eye = SKShapeNode(circleOfRadius: 2.5)
            eye.fillColor = isElite ? UIColor.white : accentColor
            eye.strokeColor = .clear
            eye.position = CGPoint(x: xOff, y: r*0.25)
            addChild(eye)
        }

        // Thorns for thornspitter
        if enemyType == .thornspitter {
            for i in 0..<6 {
                let angle = CGFloat(i) * .pi / 3
                let thorn = SKShapeNode(path: {
                    let p = UIBezierPath()
                    p.move(to: .zero)
                    p.addLine(to: CGPoint(x: cos(angle)*r*1.5, y: sin(angle)*r*1.5))
                    return p.cgPath
                }())
                thorn.strokeColor = accentColor
                thorn.lineWidth = 2.5
                thorn.lineCap = .round
                addChild(thorn)
            }
        }

        buildHPBar()

        // Idle animation
        let scale = enemyType == .slime ? SKAction.sequence([SKAction.scaleX(to:1.1, y:0.92, duration:0.5), SKAction.scaleX(to:0.92, y:1.1, duration:0.5)]) :
            SKAction.sequence([SKAction.rotate(byAngle:.pi*0.05, duration:0.8), SKAction.rotate(byAngle:-.pi*0.05, duration:0.8)])
        bodyNode.run(SKAction.repeatForever(scale))
    }

    private func buildStarPath(radius: CGFloat, points: Int) -> CGPath {
        let p = UIBezierPath(); let inner = radius * 0.45
        for i in 0..<points*2 {
            let angle = CGFloat(i) * .pi / CGFloat(points) - .pi/2
            let r2 = i%2 == 0 ? radius : inner
            let pt = CGPoint(x: cos(angle)*r2, y: sin(angle)*r2)
            i==0 ? p.move(to:pt) : p.addLine(to:pt)
        }
        p.close(); return p.cgPath
    }

    private func buildHPBar() {
        let w: CGFloat = max(enemyType.radius * 2 + 8, 36)
        let y = enemyType.radius + 8
        hpBarBg = SKShapeNode(rectOf: CGSize(width:w, height:4), cornerRadius:2)
        hpBarBg.fillColor = UIColor.black.withAlphaComponent(0.6)
        hpBarBg.strokeColor = .clear
        hpBarBg.position = CGPoint(x:0, y:y); hpBarBg.zPosition = 2
        addChild(hpBarBg)

        hpBarFill = SKSpriteNode(color: isElite ? .from(hex:"#ff4444") : .from(hex:"#44ff44"), size: CGSize(width: w, height: 4))
        hpBarFill.anchorPoint = CGPoint(x: 0, y: 0.5)
        hpBarFill.position = CGPoint(x: -w / 2, y: y)
        hpBarFill.zPosition = 3
        addChild(hpBarFill)
    }

    private func addEliteGlow() {
        let glow = SKShapeNode(circleOfRadius: enemyType.radius + 6)
        glow.fillColor = .clear
        glow.strokeColor = UIColor(red:1, green:0.5, blue:0, alpha:0.5)
        glow.lineWidth = 3
        glow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to:0.15, duration:0.5), SKAction.fadeAlpha(to:0.8, duration:0.5)
        ])))
        addChild(glow)
    }

    // MARK: - Physics
    private func setupPhysics() {
        let r = enemyType.radius
        let body = SKPhysicsBody(circleOfRadius: r)
        body.isDynamic = true; body.allowsRotation = false
        body.linearDamping = 4
        body.categoryBitMask = PhysicsCategory.enemy
        body.contactTestBitMask = PhysicsCategory.playerWeapon | PhysicsCategory.player
        body.collisionBitMask = PhysicsCategory.wall | PhysicsCategory.player | PhysicsCategory.guardian | PhysicsCategory.boss
            | PhysicsCategory.chest | PhysicsCategory.loreStone | PhysicsCategory.shard
        physicsBody = body
    }

    // MARK: - Update
    func update(playerPosition: CGPoint, delta: TimeInterval) {
        guard !isDead else { return }

        if hurtTimer > 0 { hurtTimer -= delta }
        if meleeCooldown > 0 { meleeCooldown -= delta }
        if rangedCooldown > 0 { rangedCooldown -= delta }
        if chillRemaining > 0 { chillRemaining -= delta }

        var spdMult: CGFloat = 1
        if chillRemaining > 0 {
            spdMult = 0.5
            bodyNode.strokeColor = UIColor(red: 0.55, green: 0.85, blue: 1, alpha: 0.95)
        } else {
            bodyNode.strokeColor = accentColor
        }

        if burnStacks > 0 {
            burnTickTimer -= delta
            while burnTickTimer <= 0 && burnStacks > 0 && !isDead {
                burnTickTimer += 0.42
                hp -= 0.45
                burnStacks -= 1
                if let w = parent {
                    GameJuice.addHitSparks(to: w, at: position, color: UIColor(red: 1, green: 0.45, blue: 0.1, alpha: 1), count: 4)
                }
                if hp <= 0 {
                    dieAndGrantLoot()
                    return
                }
                updateHPBar()
            }
        }

        let dist = position.distance(to: playerPosition)
        let dir = (playerPosition - position).normalized()

        switch behavior {
        case .chase:
            if dist < chaseRange {
                physicsBody?.velocity = CGVector(dx: dir.x * moveSpeed * spdMult, dy: dir.y * moveSpeed * spdMult)
            } else {
                physicsBody?.velocity = .zero
            }
            // Melee hit
            if dist < 25 && meleeCooldown <= 0 && chillRemaining <= 0 {
                meleeCooldown = 1.0
                GameStore.shared.damagePlayer(isElite ? 0.75 : 0.5)
            }

        case .charge:
            if !isCharging {
                if dist < chaseRange {
                    chargeTimer -= delta
                    if chargeTimer <= 0 {
                        chargeTimer = CGFloat.random(in: 1.5...3.0)
                        isCharging = true
                        chargeDirection = dir
                    } else {
                        physicsBody?.velocity = CGVector(dx: dir.x * moveSpeed * 0.5 * spdMult, dy: dir.y * moveSpeed * 0.5 * spdMult)
                    }
                } else { physicsBody?.velocity = .zero }
            } else {
                let chargeSpeed = moveSpeed * 2.8 * spdMult
                physicsBody?.velocity = CGVector(dx: chargeDirection.x*chargeSpeed, dy: chargeDirection.y*chargeSpeed)
                chargeTimer -= delta
                if chargeTimer <= 0 { isCharging = false; chargeTimer = CGFloat.random(in: 1.0...2.5) }
            }
            if dist < 22 && meleeCooldown <= 0 && chillRemaining <= 0 {
                meleeCooldown = 0.8
                GameStore.shared.damagePlayer(isElite ? 1.0 : 0.75)
            }

        case .ranged:
            let prefDist: CGFloat = 160
            if dist < chaseRange {
                if dist < prefDist - 20 {
                    let away = (position - playerPosition).normalized()
                    physicsBody?.velocity = CGVector(dx: away.x * moveSpeed * 0.7 * spdMult, dy: away.y * moveSpeed * 0.7 * spdMult)
                } else if dist > prefDist + 20 {
                    physicsBody?.velocity = CGVector(dx: dir.x * moveSpeed * 0.5 * spdMult, dy: dir.y * moveSpeed * 0.5 * spdMult)
                } else {
                    physicsBody?.velocity = .zero
                }
                if rangedCooldown <= 0 && chillRemaining <= 0 {
                    rangedCooldown = isElite ? 1.2 : 2.0
                    fireProjectile(toward: playerPosition)
                }
            } else { physicsBody?.velocity = .zero }
        }

        zRotation = atan2(dir.y, dir.x) - .pi/2
        updateHPBar()
    }

    private func fireProjectile(toward target: CGPoint) {
        guard let scene = scene else { return }
        let dir = (target - position).normalized()
        let projColor = isElite ? UIColor(red:1,green:0.3,blue:0.3,alpha:1) : bodyColor.withAlphaComponent(0.9)
        let proj = EnemyProjectileNode(damage: isElite ? 0.75 : 0.5, color: projColor)
        proj.position = position + dir * (enemyType.radius + 10)
        proj.zPosition = 5
        proj.physicsBody?.velocity = CGVector(dx: dir.x*320, dy: dir.y*320)
        scene.childNode(withName: "world")?.addChild(proj)
        proj.run(SKAction.sequence([SKAction.wait(forDuration:2.5), SKAction.removeFromParent()]))
    }

    // MARK: - Damage
    func takeDamage(_ amount: CGFloat, from hitPos: CGPoint, isCritical: Bool = false, hitEffect: ProjectileHitEffect = .physical, sourceWeapon: WeaponType = .sword) {
        guard !isDead && hurtTimer <= 0 else { return }
        hurtTimer = isCritical ? 0.18 : 0.25
        lastHitWeapon = sourceWeapon
        hp -= amount

        switch hitEffect {
        case .burn:
            burnStacks = min(6, burnStacks + 2)
            burnTickTimer = min(burnTickTimer, 0.15)
        case .chill:
            chillRemaining = max(chillRemaining, 2.35)
        case .physical:
            break
        }

        // Knockback
        let kbDir = (position - hitPos).normalized()
        let kb: CGFloat = isCritical ? 165 : 120
        physicsBody?.applyImpulse(CGVector(dx: kbDir.x * kb, dy: kbDir.y * kb))

        // Hit flash
        bodyNode.run(SKAction.sequence([
            SKAction.colorize(with: .white, colorBlendFactor: 0.8, duration: 0.05),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.12)
        ]))

        // Damage number
        showDamageNumber(amount, isCritical: isCritical)

        if hp <= 0 { dieAndGrantLoot() }
        updateHPBar()
    }

    private func dieAndGrantLoot() {
        guard !isDead else { return }
        isDead = true
        let pts = isElite ? 200 : Int(maxHP * 10)
        GameStore.shared.addKill(pts)
        if isElite { GameStore.shared.eliteKills += 1 }
        GameStore.shared.registerEnemySlain(maxHP: maxHP, wasElite: isElite, killingWeapon: lastHitWeapon)
        if Int.random(in: 0..<3) == 0 {
            GameStore.shared.rupees += isElite ? 3 : 1
        }
    }

    private func showDamageNumber(_ amount: CGFloat, isCritical: Bool) {
        let label = SKLabelNode(text: isCritical ? "CRIT -\(Int(ceil(amount * 10)))" : "-\(Int(ceil(amount * 10)))")
        label.fontName = "AvenirNext-Bold"
        label.fontSize = isCritical ? 16 : 14
        label.fontColor = isCritical ? UIColor(red:1,green:0.9,blue:0.25,alpha:1) : (isElite ? UIColor(red:1,green:0.5,blue:0,alpha:1) : .white)
        label.position = CGPoint(x: CGFloat.random(in:-10...10), y: enemyType.radius + 18)
        label.zPosition = 20
        addChild(label)
        label.run(SKAction.sequence([
            SKAction.group([SKAction.moveBy(x:0, y:22, duration:0.5), SKAction.fadeOut(withDuration:0.5)]),
            SKAction.removeFromParent()
        ]))
    }

    private func updateHPBar() {
        guard hpBarBg != nil else { return }
        let ratio = max(0, hp / maxHP)
        hpBarFill.xScale = ratio
        hpBarFill.color = ratio > 0.5 ? .from(hex:"#44ff44") : ratio > 0.25 ? .from(hex:"#ffaa00") : .from(hex:"#ff2222")
    }

    func playDeathEffect() {
        run(SKAction.sequence([
            SKAction.group([SKAction.scale(to:1.4, duration:0.15), SKAction.fadeOut(withDuration:0.2)]),
            SKAction.removeFromParent()
        ]))
    }
}
