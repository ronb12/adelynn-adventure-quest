import SpriteKit
import UIKit

class WorldScene: SKScene, SKPhysicsContactDelegate {

    // MARK: - Nodes
    private var worldLayer:    SKNode!
    private var cameraNode:    SKCameraNode!
    private var player:        PlayerNode!
    private var hudNode:       HUDNode!
    private var controlsNode:  ControlsNode!
    private var enemies:       [EnemyNode] = []
    private var guardianNode:  GuardianNode?
    private var bossNode:      BossNode?

    private let screenShake = ScreenShake()

    // MARK: - State
    private var transitionCooldown: TimeInterval = 0
    private var autosaveTimer:      TimeInterval = 0
    private var fanfareTimer:       TimeInterval = 0
    private var fanfareNode:        SKNode?
    private var lorePopupNode:      SKNode?
    private var pauseMenuNode:      SKNode?
    private var pauseQuestLogNode:  SKNode?
    private var nearLoreDef:        LoreStoneDef?
    private var nearChestNode:      ChestSprite?
    private var nearPortalDef:      PortalDef?
    private var nearNPCDef:         NPCDef?
    private var nearShopId:         String?
    private var shopMenuNode:       SKNode?
    private var npcDialogueNode:    SKNode?
    private var didTriggerGameOver  = false
    private var didTriggerVictory   = false

    var currentArea: AreaId { GameStore.shared.currentArea }

    // MARK: - Lifecycle
    override func didMove(to view: SKView) {
        physicsWorld.gravity = .zero
        physicsWorld.contactDelegate = self

        setupCamera()
        setupWorld()
        GameJuice.attachAreaAtmosphere(to: worldLayer, area: currentArea)
        setupHUD()
        setupControls()
        showAreaBanner()

        // Spawn guardian
        if let cfg = WorldConfig.guardians[currentArea],
           !GameStore.shared.guardianDefeated.contains(currentArea) {
            GameStore.shared.spawnGuardian(for: currentArea, maxHP: cfg.maxHP)
            spawnGuardian(cfg: cfg)
        }

        // Spawn boss
        if currentArea == .boss && !GameStore.shared.bossDefeated {
            spawnBoss()
        }
    }

    // MARK: - Setup
    private func setupCamera() {
        cameraNode = SKCameraNode()
        addChild(cameraNode)
        camera = cameraNode
    }

    private func setupWorld() {
        worldLayer = SKNode(); worldLayer.name = "world"
        addChild(worldLayer)

        backgroundColor = currentArea.backgroundColor
        setupWalls()
        addEnvironmentDecor()
        addPortals()
        addChests()
        addLoreStones()
        addNPCs()
        addShopkeepers()
        addShards()
        spawnEnemies()

        // Player
        let spawn = WorldConfig.spawnPosition(for: currentArea)
        player = PlayerNode(); player.position = spawn; player.zPosition = 5
        worldLayer.addChild(player)
    }

    private func setupWalls() {
        let ws = WorldConfig.worldSize; let hw = ws.width/2; let hh = ws.height/2; let t: CGFloat = 36
        let rects: [CGRect] = [
            CGRect(x:-hw-t, y:-hh-t, width:t, height:ws.height+t*2),
            CGRect(x:hw,    y:-hh-t, width:t, height:ws.height+t*2),
            CGRect(x:-hw,   y:hh,    width:ws.width, height:t),
            CGRect(x:-hw,   y:-hh-t, width:ws.width, height:t),
        ]
        for r in rects {
            let wall = SKShapeNode(rect:r); wall.fillColor = .clear; wall.strokeColor = .clear
            let pb = SKPhysicsBody(rectangleOf:r.size, center:CGPoint(x:r.midX,y:r.midY))
            pb.isDynamic = false; pb.categoryBitMask = PhysicsCategory.wall
            pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
            wall.physicsBody = pb; worldLayer.addChild(wall)
        }
    }

    private func addEnvironmentDecor() {
        let ws = WorldConfig.worldSize; let hw = ws.width/2; let hh = ws.height/2
        for i in 0..<22 {
            let seed = Float(i+1)*113.7 + Float(currentArea.rawValue.hashValue & 0xFFFF)*0.001
            let x = CGFloat(sin(seed)) * (hw-28)
            let y = CGFloat(cos(seed*1.73)) * (hh-28)
            if abs(x)<60 && abs(y)<60 { continue }
            let d = makeDecorNode(index:i); d.position = CGPoint(x:x,y:y); d.zPosition = 2
            attachDecorPhysics(d, index:i)
            worldLayer.addChild(d)
        }

        // Border wall visual
        let border = SKShapeNode(rectOf:CGSize(width:ws.width-2, height:ws.height-2), cornerRadius:4)
        border.fillColor = .clear
        border.strokeColor = currentArea.accentColor.withAlphaComponent(0.25); border.lineWidth = 2
        worldLayer.addChild(border)
    }

    private func makeDecorNode(index: Int) -> SKShapeNode {
        let node = SKShapeNode()
        switch currentArea {
        case .field:
            node.path = UIBezierPath(ovalIn:CGRect(x:-9,y:-7,width:18,height:14)).cgPath
            node.fillColor = UIColor(red:0.15,green:0.55,blue:0.12,alpha:0.8); node.strokeColor = .clear
        case .forest:
            let p = UIBezierPath(); p.move(to:CGPoint(x:0,y:28)); p.addLine(to:CGPoint(x:14,y:0)); p.addLine(to:CGPoint(x:-14,y:0)); p.close()
            node.path = p.cgPath; node.fillColor = UIColor(red:0.08,green:0.30,blue:0.08,alpha:0.92); node.strokeColor = .clear
        case .desert:
            let h = CGFloat(12 + (index%5)*7)
            node.path = UIBezierPath(rect:CGRect(x:-5,y:0,width:10,height:h)).cgPath
            node.fillColor = UIColor(red:0.55,green:0.45,blue:0.18,alpha:0.85); node.strokeColor = .clear
        case .volcano:
            node.path = UIBezierPath(ovalIn:CGRect(x:-13,y:-9,width:26,height:18)).cgPath
            node.fillColor = UIColor(red:0.35,green:0.08,blue:0.0,alpha:0.92); node.strokeColor = UIColor(red:1.0,green:0.4,blue:0.0,alpha:0.4); node.lineWidth=1
        case .ice:
            let p = UIBezierPath(); p.move(to:CGPoint(x:0,y:22)); p.addLine(to:CGPoint(x:7,y:0)); p.addLine(to:CGPoint(x:0,y:-22)); p.addLine(to:CGPoint(x:-7,y:0)); p.close()
            node.path = p.cgPath; node.fillColor = UIColor(red:0.65,green:0.88,blue:1.0,alpha:0.75); node.strokeColor = UIColor.white.withAlphaComponent(0.4); node.lineWidth=0.5
        case .cave:
            node.path = UIBezierPath(ovalIn:CGRect(x:-10,y:-28,width:20,height:32)).cgPath
            node.fillColor = UIColor(red:0.45,green:0.25,blue:0.75,alpha:0.85); node.strokeColor = UIColor(red:0.7,green:0.5,blue:1.0,alpha:0.4); node.lineWidth=0.5
        case .sky:
            node.path = UIBezierPath(ovalIn:CGRect(x:-22,y:-6,width:44,height:12)).cgPath
            node.fillColor = UIColor.white.withAlphaComponent(0.28); node.strokeColor = .clear
        case .crypt:
            node.path = UIBezierPath(rect:CGRect(x:-9,y:0,width:18,height:30)).cgPath
            node.fillColor = UIColor(red:0.28,green:0.26,blue:0.22,alpha:0.9); node.strokeColor = UIColor.gray.withAlphaComponent(0.3); node.lineWidth=0.5
        default:
            node.path = UIBezierPath(ovalIn:CGRect(x:-9,y:-9,width:18,height:18)).cgPath
            node.fillColor = currentArea.accentColor.withAlphaComponent(0.25); node.strokeColor = .clear
        }
        return node
    }

    /// Trees / rocks / props — solid obstacles (category `wall` matches border walls).
    private func attachDecorPhysics(_ node: SKShapeNode, index: Int) {
        let radius: CGFloat
        switch currentArea {
        case .field:   radius = 11
        case .forest:  radius = 15
        case .desert:  radius = 8 + CGFloat(index % 5) * 2.5
        case .volcano: radius = 14
        case .ice:     radius = 13
        case .cave:    radius = 12
        case .sky:     radius = 18
        case .crypt:   radius = 12
        default:       radius = 13
        }
        let pb = SKPhysicsBody(circleOfRadius: radius)
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.wall
        pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        node.physicsBody = pb
    }

    private func addPortals() {
        guard let defs = WorldConfig.portals[currentArea] else { return }
        for def in defs {
            let p = PortalSprite(def:def); p.position = def.position; p.zPosition = 2
            worldLayer.addChild(p)
        }
    }

    private func addChests() {
        guard let defs = WorldConfig.chests[currentArea] else { return }
        for def in defs where !GameStore.shared.chestsOpened.contains(def.id) {
            let c = ChestSprite(def:def); c.position = def.position; c.zPosition = 3
            worldLayer.addChild(c)
        }
    }

    private func addLoreStones() {
        guard let defs = WorldConfig.loreStones[currentArea] else { return }
        for def in defs {
            let s = LoreStoneSprite(def:def); s.position = def.position; s.zPosition = 3
            worldLayer.addChild(s)
        }
    }

    private func addNPCs() {
        guard let defs = WorldConfig.npcsByArea[currentArea] else { return }
        for def in defs {
            let n = NPCSprite(def: def)
            n.position = def.position
            n.zPosition = 3
            worldLayer.addChild(n)
        }
    }

    private func addShopkeepers() {
        guard let sh = WorldConfig.shopkeepers[currentArea] else { return }
        let m = MerchantSprite(id: sh.id)
        m.position = sh.position
        m.zPosition = 4
        worldLayer.addChild(m)
    }

    private func addShards() {
        let mine = WorldConfig.shards.filter { $0.areaId == currentArea }
        let collected = GameStore.shared.shardsCollected
        // Track collected shards by count (simple approach — all 3 required)
        if collected < WorldConfig.shards.count {
            for (i,def) in mine.enumerated() {
                // Skip if already collected (approximation by count)
                if collected > i { continue }
                let s = ShardSprite(def:def); s.position = def.position; s.zPosition = 4
                worldLayer.addChild(s)
            }
        }
    }

    private func spawnEnemies() {
        guard let configs = WorldConfig.enemySpawns[currentArea] else { return }
        let ws = WorldConfig.worldSize
        for cfg in configs {
            for i in 0..<cfg.count {
                let angle  = CGFloat(i)/CGFloat(max(cfg.count,1)) * .pi * 2 + CGFloat.random(in:0...0.6)
                let radius = CGFloat.random(in:90...210)
                var x = cos(angle)*radius; var y = sin(angle)*radius
                if abs(x)<55 && abs(y)<55 { x += 70; y += 70 }
                x = max(-ws.width/2+40, min(ws.width/2-40, x))
                y = max(-ws.height/2+40, min(ws.height/2-40, y))
                let e = EnemyNode(enemyType:cfg.enemyType, behavior:cfg.behavior, maxHP:cfg.maxHP,
                                  moveSpeed: CGFloat.random(in: cfg.speed), bodyColor:cfg.bodyColor,
                                  accentColor:cfg.accentColor, chaseRange:cfg.chaseRange)
                e.position = CGPoint(x:x,y:y); e.zPosition = 4
                worldLayer.addChild(e); enemies.append(e)
            }
        }
    }

    private func spawnGuardian(cfg: WorldConfig.GuardianCfg) {
        let g = GuardianNode(cfg:cfg); g.position = CGPoint(x:0,y:-160); g.zPosition = 5
        worldLayer.addChild(g); guardianNode = g
    }

    private func spawnBoss() {
        let b = BossNode()
        b.position = CGPoint(x: 0, y: -150)
        b.zPosition = 5
        b.onSpawnAdd = { [weak self] pp in self?.spawnMalgrathAdd(near: pp) }
        worldLayer.addChild(b)
        bossNode = b
    }

    /// Phase-3 Malgrath adds — tracked like normal enemies for AI.
    private func spawnMalgrathAdd(near playerPos: CGPoint) {
        let ws = WorldConfig.worldSize
        let hx = ws.width / 2 - 36
        let hy = ws.height / 2 - 36
        let angle = CGFloat.random(in: 0..<(2 * .pi))
        var x = playerPos.x + cos(angle) * 125
        var y = playerPos.y + sin(angle) * 125
        x = max(-hx, min(hx, x))
        y = max(-hy, min(hy, y))
        let e = EnemyNode(
            enemyType: .wraith, behavior: .ranged, maxHP: 2,
            moveSpeed: CGFloat.random(in: 100...140),
            bodyColor: .from(hex: "#220022"),
            accentColor: .from(hex: "#ff4488"),
            chaseRange: 260
        )
        e.position = CGPoint(x: x, y: y)
        e.zPosition = 4
        worldLayer.addChild(e)
        enemies.append(e)
    }

    private func setupHUD() {
        hudNode = HUDNode(size:size); hudNode.zPosition = 100
        cameraNode.addChild(hudNode)
    }

    private func setupControls() {
        controlsNode = ControlsNode(size:size); controlsNode.zPosition = 110
        cameraNode.addChild(controlsNode)

        controlsNode.onAttack      = { [weak self] in
            GameStore.shared.isBlocking = false
            guard let self else { return }
            player.performAttack(in: worldLayer)
        }
        controlsNode.onSpinAttack  = { [weak self] in
            GameStore.shared.isBlocking = false
            guard let self else { return }
            player.performSpinAttack(in: worldLayer)
        }
        controlsNode.onBlock       = { GameStore.shared.isBlocking = $0 }
        controlsNode.onInteract    = { [weak self] in self?.handleInteract() }
        controlsNode.onCycleWeapon = { GameStore.shared.cycleWeapon(direction:1) }
        controlsNode.onRun         = { [weak self] r in self?.player.isRunning = r }
        controlsNode.onTogglePause = { [weak self] in self?.togglePause() }
        controlsNode.onDodge = { [weak self] in
            guard let self else { return }
            player.performDodge(in: worldLayer, joystickDirection: controlsNode.joystickDirection)
        }
        controlsNode.onUsePotion = {
            if GameStore.shared.useHeartPotion() { SaveManager.shared.save() }
        }
    }

    // MARK: - Update Loop
    override func update(_ currentTime: TimeInterval) {
        guard GameStore.shared.gameState == .playing else { return }
        let delta: TimeInterval = 1.0/60.0
        let store = GameStore.shared
        store.tickDodgeInvulnerability(delta)

        // Player movement
        player.updateMovement(direction: controlsNode.joystickDirection, delta: delta)
        let shake = screenShake.tick(delta: delta)
        cameraNode.position = CGPoint(x: player.position.x + shake.dx, y: player.position.y + shake.dy)

        // Enemies
        let pp = player.position
        for e in enemies { if !e.isDead { e.update(playerPosition:pp, delta:delta) } }
        guardianNode?.update(playerPosition:pp, delta:delta)
        bossNode?.update(playerPosition:pp, delta:delta)

        // Proximity checks
        checkPortals()
        checkChests()
        checkLoreStones()
        checkShards()
        checkNPCs()
        checkShopkeeper()
        refreshInteractHint()

        if GameStore.shared.pendingParryPulse {
            GameStore.shared.pendingParryPulse = false
            GameJuice.addParryFlash(to: worldLayer, at: player.position)
            screenShake.impulse(3.5)
        }

        // HUD
        hudNode.update(store: store, playerWorldPos: player.position)

        // Combo
        store.tickCombo(delta)

        // Fanfare
        if let f = store.itemFanfare, fanfareTimer <= 0 {
            showFanfare(f); store.itemFanfare = nil; fanfareTimer = 3.2
        }
        if fanfareTimer > 0 { fanfareTimer -= delta }

        // Autosave
        autosaveTimer += delta
        if autosaveTimer >= 30 { autosaveTimer=0; SaveManager.shared.save() }

        // Transition cooldown
        if transitionCooldown > 0 { transitionCooldown -= delta }

        // Clean dead
        enemies.removeAll { e in
            if e.isDead {
                GameJuice.addDeathBurst(to: worldLayer, at: e.position, accent: e.accentColor)
                e.playDeathEffect()
                return true
            }
            return false
        }
        if let g = guardianNode, g.isDead {
            GameJuice.addDeathBurst(to: worldLayer, at: g.position, accent: g.cfg.accentColor)
            g.playDeathEffect()
            guardianNode = nil
        }
        if let b = bossNode, b.isDead {
            GameJuice.addDeathBurst(to: worldLayer, at: b.position, accent: UIColor(red: 0.85, green: 0.15, blue: 1, alpha: 1))
            b.playDeathEffect()
            bossNode = nil
        }

        // Game state checks
        if store.hearts <= 0 && !didTriggerGameOver { didTriggerGameOver=true; triggerGameOver() }
        if store.gameState == .victory && !didTriggerVictory { didTriggerVictory=true; triggerVictory() }
    }

    // MARK: - Proximity Checks
    private func checkPortals() {
        guard let defs = WorldConfig.portals[currentArea] else { hudNode.hidePortalHint(); return }
        let threshold: CGFloat = 52
        var closest: PortalDef? = nil
        for def in defs {
            if player.position.distance(to:def.position) < threshold { closest=def; break }
        }
        if let p = closest {
            if p.destinationArea == .boss && GameStore.shared.shardsCollected < 3 {
                hudNode.showPortalHint(label:"Need 3 Shards to enter"); nearPortalDef=nil; return
            }
            hudNode.showPortalHint(label:p.label); nearPortalDef=p
            if player.position.distance(to:p.position) < 26 && transitionCooldown <= 0 {
                doTransition(to:p.destinationArea)
            }
        } else { hudNode.hidePortalHint(); nearPortalDef=nil }
    }

    private func checkChests() {
        let threshold: CGFloat = 52
        nearChestNode = nil
        for node in worldLayer.children.compactMap({ $0 as? ChestSprite }) {
            if player.position.distance(to: node.position) < threshold {
                nearChestNode = node
                return
            }
        }
    }

    private func checkLoreStones() {
        let threshold: CGFloat = 52
        nearLoreDef = nil
        for node in worldLayer.children.compactMap({ $0 as? LoreStoneSprite }) {
            if player.position.distance(to: node.position) < threshold {
                nearLoreDef = node.def
                return
            }
        }
    }

    private func checkNPCs() {
        let th: CGFloat = 52
        nearNPCDef = nil
        guard let defs = WorldConfig.npcsByArea[currentArea] else { return }
        for def in defs where player.position.distance(to: def.position) < th {
            nearNPCDef = def
            return
        }
    }

    private func checkShopkeeper() {
        let th: CGFloat = 52
        nearShopId = nil
        guard let sh = WorldConfig.shopkeepers[currentArea] else { return }
        if player.position.distance(to: sh.position) < th {
            nearShopId = sh.id
        }
    }

    private func refreshInteractHint() {
        if nearChestNode != nil {
            hudNode.showInteractHint("Open Chest")
            return
        }
        if let lore = nearLoreDef {
            hudNode.showInteractHint("Read: \(lore.title)")
            return
        }
        if nearShopId != nil {
            hudNode.showInteractHint("Rowan's Wares — Shop")
            return
        }
        if let npc = nearNPCDef {
            hudNode.showInteractHint("Talk: \(npc.name)")
            return
        }
        hudNode.hideInteractHint()
    }

    private func checkShards() {
        let threshold: CGFloat = 38
        for node in worldLayer.children.compactMap({$0 as? ShardSprite}) {
            if player.position.distance(to:node.position) < threshold && !node.collected {
                node.collect(); break
            }
        }
    }

    // MARK: - Interact
    private func handleInteract() {
        if shopMenuNode != nil { dismissShop(); return }
        if npcDialogueNode != nil { dismissNPCDialogue(); return }
        if lorePopupNode != nil { dismissLorePopup(); return }
        if nearShopId != nil { openShop(); return }
        if let npc = nearNPCDef { showNPCDialogue(npc); return }
        if let chest = nearChestNode { openChest(chest); return }
        if let stone = nearLoreDef { showLorePopup(stone); return }
    }

    private func openChest(_ chest: ChestSprite) {
        GameStore.shared.openChest(id:chest.def.id)
        if let w = chest.def.weaponUnlock {
            GameStore.shared.unlockWeapon(w)
            GameStore.shared.itemFanfare = ItemFanfare(name:w.displayName, icon:w.icon, desc:"New weapon unlocked!")
        } else {
            GameStore.shared.rupees += chest.def.rupeeReward
            GameStore.shared.itemFanfare = ItemFanfare(name:"Treasure Chest", icon:"💎", desc:"+\(chest.def.rupeeReward) Rupees!")
        }
        chest.open(); nearChestNode=nil; hudNode.hideInteractHint()
        SaveManager.shared.save()
    }

    // MARK: - Lore Popup
    private func showLorePopup(_ def: LoreStoneDef) {
        GameStore.shared.loreRead.insert(def.id)
        dismissLorePopup()
        let popup = buildLorePopup(def)
        popup.position = CGPoint(x:0, y:-size.height*0.18)
        popup.alpha=0; popup.zPosition=95
        cameraNode.addChild(popup); lorePopupNode=popup
        popup.run(SKAction.fadeIn(withDuration:0.25))
    }

    private func dismissLorePopup() {
        lorePopupNode?.run(SKAction.sequence([SKAction.fadeOut(withDuration:0.2), SKAction.removeFromParent()]))
        lorePopupNode=nil
    }

    // MARK: - Shop (Rowan)
    private func openShop() {
        guard shopMenuNode == nil else { return }
        let root = SKNode()
        root.zPosition = 210
        let overlay = SKShapeNode(rectOf: size)
        overlay.fillColor = UIColor.black.withAlphaComponent(0.72)
        overlay.strokeColor = .clear
        root.addChild(overlay)

        let panelW = min(size.width * 0.88, 340)
        let bg = SKShapeNode(rectOf: CGSize(width: panelW, height: 220), cornerRadius: 14)
        bg.fillColor = UIColor(red: 0.06, green: 0.04, blue: 0.12, alpha: 0.96)
        bg.strokeColor = UIColor(red: 0.9, green: 0.55, blue: 0.2, alpha: 0.85)
        bg.lineWidth = 2
        root.addChild(bg)

        let title = SKLabelNode(text: "Rowan's Wares")
        title.fontName = "Georgia-Bold"
        title.fontSize = 20
        title.fontColor = UIColor(red: 1, green: 0.82, blue: 0.35, alpha: 1)
        title.position = CGPoint(x: 0, y: 82)
        root.addChild(title)

        let sub = SKLabelNode(text: "Rupees: \(GameStore.shared.rupees)")
        sub.fontName = "AvenirNext"
        sub.fontSize = 13
        sub.fontColor = UIColor.white.withAlphaComponent(0.75)
        sub.position = CGPoint(x: 0, y: 56)
        sub.name = "shopRupeeLabel"
        root.addChild(sub)

        let rows: [(String, String, Int)] = [
            ("shopPotion", "Heart Draught — restores hearts (16 r)", 16),
            ("shopAmmo", "Ammo Satchel — arrows, bombs & more (24 r)", 24),
            ("shopArmor", "Armor Polish — +1 armor tier, max 2 (40 r)", 40),
        ]
        for (i, row) in rows.enumerated() {
            let btn = makeShopRow(name: row.0, label: row.1, y: CGFloat(12 - i * 44))
            root.addChild(btn)
        }

        let close = makePauseBtn(text: "Close", name: "shopClose")
        close.position = CGPoint(x: 0, y: -92)
        root.addChild(close)

        cameraNode.addChild(root)
        shopMenuNode = root
    }

    private func makeShopRow(name: String, label: String, y: CGFloat) -> SKShapeNode {
        let btn = SKShapeNode(rectOf: CGSize(width: min(size.width * 0.82, 300), height: 38), cornerRadius: 8)
        btn.fillColor = UIColor(red: 0.15, green: 0.12, blue: 0.22, alpha: 1)
        btn.strokeColor = UIColor.white.withAlphaComponent(0.2)
        btn.lineWidth = 1
        btn.name = name
        btn.position = CGPoint(x: 0, y: y)
        let l = SKLabelNode(text: label)
        l.fontName = "AvenirNext-DemiBold"
        l.fontSize = 11
        l.fontColor = .white
        l.verticalAlignmentMode = .center
        l.preferredMaxLayoutWidth = min(size.width * 0.78, 280)
        l.numberOfLines = 2
        btn.addChild(l)
        return btn
    }

    private func dismissShop() {
        shopMenuNode?.removeFromParent()
        shopMenuNode = nil
    }

    private func handleShopTap(at loc: CGPoint) {
        guard let root = shopMenuNode else { return }
        for n in root.nodes(at: loc) {
            var node: SKNode? = n
            while let c = node {
                switch c.name {
                case "shopClose", "lbl_shopClose":
                    dismissShop(); return
                case "shopPotion":
                    if GameStore.shared.buyHeartPotion() { SaveManager.shared.save(); refreshShopRupeeLabel(in: root) }
                    return
                case "shopAmmo":
                    if GameStore.shared.buyAmmoSatchel() { SaveManager.shared.save(); refreshShopRupeeLabel(in: root) }
                    return
                case "shopArmor":
                    if GameStore.shared.buyArmorPolish() { SaveManager.shared.save(); refreshShopRupeeLabel(in: root) }
                    return
                default: break
                }
                node = c.parent
            }
        }
        dismissShop()
    }

    private func refreshShopRupeeLabel(in root: SKNode) {
        (root.childNode(withName: "shopRupeeLabel") as? SKLabelNode)?.text = "Rupees: \(GameStore.shared.rupees)"
    }

    // MARK: - NPC dialogue
    private func showNPCDialogue(_ def: NPCDef) {
        GameStore.shared.talkedToNPCs.insert(def.id)
        dismissNPCDialogue()
        let root = SKNode()
        root.zPosition = 200
        let mw = min(size.width * 0.88, 360)
        let text = def.lines.joined(separator: "\n\n")
        let approxLines = max(4, def.lines.count * 2)
        let boxH = CGFloat(min(220, 70 + CGFloat(approxLines) * 18))

        let bg = SKShapeNode(rectOf: CGSize(width: mw, height: boxH), cornerRadius: 14)
        bg.fillColor = UIColor(red: 0.05, green: 0.03, blue: 0.1, alpha: 0.95)
        bg.strokeColor = def.color.withAlphaComponent(0.75)
        bg.lineWidth = 2
        root.addChild(bg)

        let nameLbl = SKLabelNode(text: def.name)
        nameLbl.fontName = "Georgia-Bold"
        nameLbl.fontSize = 15
        nameLbl.fontColor = def.color
        nameLbl.position = CGPoint(x: 0, y: boxH * 0.5 - 28)
        root.addChild(nameLbl)

        let body = SKLabelNode(text: text)
        body.fontName = "Georgia"
        body.fontSize = 12
        body.fontColor = UIColor.white.withAlphaComponent(0.9)
        body.preferredMaxLayoutWidth = mw - 28
        body.numberOfLines = 0
        body.verticalAlignmentMode = .top
        body.horizontalAlignmentMode = .center
        body.position = CGPoint(x: 0, y: boxH * 0.5 - 52)
        root.addChild(body)

        let hint = SKLabelNode(text: "Tap X or anywhere to close")
        hint.fontName = "AvenirNext"
        hint.fontSize = 10
        hint.fontColor = UIColor.white.withAlphaComponent(0.45)
        hint.position = CGPoint(x: 0, y: -boxH * 0.5 + 20)
        root.addChild(hint)

        root.position = CGPoint(x: 0, y: -size.height * 0.12)
        cameraNode.addChild(root)
        npcDialogueNode = root
    }

    private func dismissNPCDialogue() {
        npcDialogueNode?.removeFromParent()
        npcDialogueNode = nil
    }

    private func buildLorePopup(_ def: LoreStoneDef) -> SKNode {
        let c = SKNode(); let mw = min(size.width*0.88, 370)
        let bg = SKShapeNode(rectOf:CGSize(width:mw, height:130), cornerRadius:14)
        bg.fillColor = UIColor(red:0.04,green:0.02,blue:0.14,alpha:0.95)
        bg.strokeColor = UIColor(red:0.45,green:0.35,blue:0.85,alpha:0.7); bg.lineWidth=1.5; c.addChild(bg)

        let icon = SKLabelNode(text: "📜")
        icon.fontSize = 20
        SpriteKitEmojiSupport.applyEmojiFont(to: icon, size: 20)
        icon.position = CGPoint(x:-mw/2+28, y:44); icon.verticalAlignmentMode = .center; c.addChild(icon)

        let title = SKLabelNode(text:def.title); title.fontName="Georgia-Bold"; title.fontSize=13
        title.fontColor = UIColor(red:0.65,green:0.55,blue:1.0,alpha:1)
        title.position = CGPoint(x:12, y:44); title.verticalAlignmentMode = .center; title.horizontalAlignmentMode = .center; c.addChild(title)

        let body = SKLabelNode(text:def.text); body.fontName="Georgia"; body.fontSize=11
        body.fontColor = UIColor.white.withAlphaComponent(0.82)
        body.numberOfLines=5; body.preferredMaxLayoutWidth = mw-28
        body.position = CGPoint(x:0, y:16); body.verticalAlignmentMode = .top; body.horizontalAlignmentMode = .center
        c.addChild(body)

        let hint = SKLabelNode(text:"Tap [X] or anywhere to close")
        hint.fontName="AvenirNext"; hint.fontSize=9; hint.fontColor = UIColor.white.withAlphaComponent(0.4)
        hint.position = CGPoint(x:0, y:-55); hint.verticalAlignmentMode = .center; c.addChild(hint)
        return c
    }

    // MARK: - Area Banner
    private func showAreaBanner() {
        let area = currentArea
        let node = SKNode(); node.zPosition=90
        let bg = SKShapeNode(rectOf:CGSize(width:min(size.width*0.88,370), height:76), cornerRadius:12)
        bg.fillColor = UIColor.black.withAlphaComponent(0.72)
        bg.strokeColor = area.accentColor.withAlphaComponent(0.55); bg.lineWidth=1.5; node.addChild(bg)

        let nl = SKLabelNode(text:area.displayName); nl.fontName="Georgia-Bold"; nl.fontSize=22
        nl.fontColor = area.accentColor; nl.position = CGPoint(x:0,y:14); nl.verticalAlignmentMode = .center; node.addChild(nl)

        let sl = SKLabelNode(text:area.subtitle); sl.fontName="Georgia-Italic"; sl.fontSize=13
        sl.fontColor = UIColor.white.withAlphaComponent(0.65); sl.position = CGPoint(x:0,y:-13); sl.verticalAlignmentMode = .center; node.addChild(sl)

        node.position = CGPoint(x:0, y:size.height*0.26); node.alpha=0
        cameraNode.addChild(node)
        node.run(SKAction.sequence([SKAction.fadeIn(withDuration:0.5), SKAction.wait(forDuration:2.0), SKAction.fadeOut(withDuration:0.5), SKAction.removeFromParent()]))
    }

    // MARK: - Fanfare
    private func showFanfare(_ f: ItemFanfare) {
        fanfareNode?.removeFromParent()
        let node = SKNode(); node.zPosition=99
        let bg = SKShapeNode(rectOf:CGSize(width:min(size.width*0.72,290), height:68), cornerRadius:12)
        bg.fillColor = UIColor.black.withAlphaComponent(0.82)
        bg.strokeColor = UIColor(red:1.0,green:0.8,blue:0.2,alpha:0.65); bg.lineWidth=1.5; node.addChild(bg)

        let icon = SKLabelNode(text: f.icon)
        icon.fontSize = 26
        SpriteKitEmojiSupport.applyEmojiFont(to: icon, size: 26)
        icon.position = CGPoint(x:-110, y:0); icon.verticalAlignmentMode = .center; node.addChild(icon)

        let nl = SKLabelNode(text:f.name); nl.fontName="Georgia-Bold"; nl.fontSize=15
        nl.fontColor = UIColor(red:1.0,green:0.85,blue:0.3,alpha:1)
        nl.position = CGPoint(x:10, y:12); nl.verticalAlignmentMode = .center; node.addChild(nl)

        let dl = SKLabelNode(text:f.desc); dl.fontName="AvenirNext"; dl.fontSize=12
        dl.fontColor = UIColor.white.withAlphaComponent(0.75)
        dl.position = CGPoint(x:10, y:-10); dl.verticalAlignmentMode = .center; node.addChild(dl)

        node.position = CGPoint(x:0, y:size.height*0.16); node.alpha=0
        cameraNode.addChild(node); fanfareNode=node
        node.run(SKAction.sequence([SKAction.fadeIn(withDuration:0.3), SKAction.wait(forDuration:2.4), SKAction.fadeOut(withDuration:0.45), SKAction.removeFromParent()]))
    }

    // MARK: - Transition
    private func doTransition(to area: AreaId) {
        transitionCooldown = 99
        SaveManager.shared.save()
        GameStore.shared.currentArea = area
        GameStore.shared.areasVisited.insert(area)
        run(SKAction.sequence([
            SKAction.run { [weak self] in self?.cameraNode.run(SKAction.fadeOut(withDuration:0.3)) },
            SKAction.wait(forDuration:0.35),
            SKAction.run { [weak self] in
                guard let self, let v=view else{return}
                let s=WorldScene(size:size); s.scaleMode = .aspectFill
                v.presentScene(s, transition:SKTransition.fade(withDuration:0.3))
            }
        ]))
    }

    // MARK: - Pause
    private func togglePause() {
        let store = GameStore.shared
        if store.gameState == .playing {
            store.gameState = .paused; isPaused=true; showPauseMenu()
        } else if store.gameState == .paused {
            store.gameState = .playing; isPaused=false; hidePauseMenu()
        }
    }

    private func showPauseMenu() {
        pauseQuestLogNode = nil
        let m = SKNode(); m.zPosition=200
        let overlay = SKShapeNode(rectOf:size)
        overlay.fillColor = UIColor.black.withAlphaComponent(0.68); overlay.strokeColor = .clear
        m.addChild(overlay)

        let t = SKLabelNode(text:"Paused"); t.fontName="Georgia-Bold"; t.fontSize=34; t.fontColor = .white
        t.position = CGPoint(x:0,y:78); t.verticalAlignmentMode = .center; m.addChild(t)

        for (i,(txt,nm)) in [("Resume","resume"),("Quest log","questLog"),("Save & Title","quitTitle")].enumerated() {
            let btn = makePauseBtn(text:txt, name:nm)
            btn.position = CGPoint(x:0, y:12 - CGFloat(i)*62); m.addChild(btn)
        }
        cameraNode.addChild(m); pauseMenuNode=m
    }

    private func hidePauseMenu() {
        pauseQuestLogNode?.removeFromParent(); pauseQuestLogNode=nil
        pauseMenuNode?.removeFromParent(); pauseMenuNode=nil
    }

    private func showQuestLogPanel() {
        guard let menu = pauseMenuNode else { return }
        pauseQuestLogNode?.removeFromParent()
        let q = SKNode(); q.zPosition = 5
        let panel = SKShapeNode(rectOf: CGSize(width: min(size.width - 36, 340), height: 268), cornerRadius: 14)
        panel.fillColor = UIColor(red:0.08,green:0.1,blue:0.2,alpha:0.96)
        panel.strokeColor = UIColor.white.withAlphaComponent(0.22); panel.lineWidth = 1.5
        q.addChild(panel)

        let title = SKLabelNode(text: "Quest log")
        title.fontName = "Georgia-Bold"; title.fontSize = 22; title.fontColor = .white
        title.position = CGPoint(x: 0, y: 108); title.verticalAlignmentMode = .center
        q.addChild(title)

        var y: CGFloat = 72
        for line in questLogBodyLines() {
            let ln = SKLabelNode(text: line)
            ln.fontName = "Georgia"; ln.fontSize = line.isEmpty ? 6 : 14
            ln.fontColor = UIColor(white: 0.92, alpha: 1)
            ln.position = CGPoint(x: 0, y: y)
            ln.verticalAlignmentMode = .center
            q.addChild(ln)
            y -= line.isEmpty ? 10 : 22
        }

        let back = makePauseBtn(text: "Back", name: "questBack")
        back.position = CGPoint(x: 0, y: -118)
        q.addChild(back)

        menu.addChild(q)
        pauseQuestLogNode = q
    }

    private func questLogBodyLines() -> [String] {
        let s = GameStore.shared
        let gTotal = WorldConfig.guardians.count
        let gDone = s.guardianDefeated.count
        return [
            "Crystal shards: \(s.shardsCollected)/\(WorldConfig.shards.count)",
            "Guardians defeated: \(gDone)/\(gTotal)",
            s.bossDefeated ? "Malgrath: fallen" : "Malgrath: the Shattered King awaits",
            "",
            "Find three shards to open the path to the throne.",
            "Seek nine guardian courts to ascend the blade."
        ]
    }

    private func makePauseBtn(text: String, name: String) -> SKShapeNode {
        let btn = SKShapeNode(rectOf:CGSize(width:200,height:46), cornerRadius:10)
        btn.fillColor = UIColor(red:0.2,green:0.2,blue:0.38,alpha:1)
        btn.strokeColor = UIColor.white.withAlphaComponent(0.25); btn.lineWidth=1; btn.name=name
        let l=SKLabelNode(text:text); l.fontName="Georgia"; l.fontSize=18; l.fontColor = .white
        l.verticalAlignmentMode = .center; l.name="lbl_\(name)"; btn.addChild(l); return btn
    }

    // MARK: - Game Over / Victory
    private func triggerGameOver() {
        SaveManager.shared.save()
        run(SKAction.sequence([
            SKAction.wait(forDuration:1.2),
            SKAction.run { [weak self] in
                guard let self, let v=view else{return}
                let s=GameOverScene(size:size); s.scaleMode = .aspectFill
                v.presentScene(s, transition:SKTransition.fade(with:.black, duration:1.0))
            }
        ]))
    }

    private func triggerVictory() {
        SaveManager.shared.save()
        run(SKAction.sequence([
            SKAction.wait(forDuration:1.8),
            SKAction.run { [weak self] in
                guard let self, let v=view else{return}
                let s=VictoryScene(size:size); s.scaleMode = .aspectFill
                v.presentScene(s, transition:SKTransition.fade(with:.white, duration:1.8))
            }
        ]))
    }

    // MARK: - Touch
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Pause menu
        if GameStore.shared.gameState == .paused {
            guard let t = touches.first else { return }
            let loc = t.location(in:cameraNode)
            for n in cameraNode.nodes(at:loc) {
                if n.name == "questBack" || n.name == "lbl_questBack" {
                    pauseQuestLogNode?.removeFromParent(); pauseQuestLogNode = nil
                    return
                }
            }
            if pauseQuestLogNode != nil { return }
            for n in cameraNode.nodes(at:loc) {
                if n.name == "resume"   || n.name == "lbl_resume"    { togglePause(); return }
                if n.name == "questLog" || n.name == "lbl_questLog" { showQuestLogPanel(); return }
                if n.name == "quitTitle" || n.name == "lbl_quitTitle" {
                    SaveManager.shared.save()
                    isPaused=false; GameStore.shared.gameState = .playing
                    guard let v=view else{return}
                    let s=TitleScene(size:size); s.scaleMode = .aspectFill
                    v.presentScene(s, transition:SKTransition.fade(with:.black, duration:0.5)); return
                }
            }
            return
        }

        if shopMenuNode != nil {
            guard let t = touches.first else { return }
            handleShopTap(at: t.location(in: cameraNode))
            return
        }
        if npcDialogueNode != nil {
            dismissNPCDialogue()
            return
        }
        if lorePopupNode != nil { dismissLorePopup(); return }

        controlsNode.forwardTouchesBegan(touches, with: event)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard GameStore.shared.gameState == .playing else { return }
        controlsNode.forwardTouchesMoved(touches, with: event)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        controlsNode.forwardTouchesEnded(touches, with: event)
    }
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        controlsNode.forwardTouchesCancelled(touches, with: event)
    }

    // MARK: - Physics
    func didBegin(_ contact: SKPhysicsContact) {
        let catA = contact.bodyA.categoryBitMask
        let catB = contact.bodyB.categoryBitMask

        func bodies(a: UInt32, b: UInt32) -> (SKPhysicsBody, SKPhysicsBody)? {
            if catA==a && catB==b { return (contact.bodyA, contact.bodyB) }
            if catA==b && catB==a { return (contact.bodyB, contact.bodyA) }
            return nil
        }

        // Player weapon → enemy
        if let (wBody, eBody) = bodies(a:PhysicsCategory.playerWeapon, b:PhysicsCategory.enemy),
           let en = eBody.node as? EnemyNode,
           let wp = weaponProjectile(from: wBody) {
            let hit = wp.position
            let (dmg, crit) = rollWeaponDamage(base: wp.damage, weapon: wp.sourceWeapon)
            en.takeDamage(dmg, from: hit, isCritical: crit, hitEffect: wp.hitEffect, sourceWeapon: wp.sourceWeapon)
            wp.onHit()
            juiceEnemyWeaponHit(at: hit, enemy: en)
            if crit { GameJuice.addCritFlash(to: worldLayer, at: hit) }
        }

        // Player weapon → guardian
        if let (wBody, gBody) = bodies(a:PhysicsCategory.playerWeapon, b:PhysicsCategory.guardian),
           let gn = gBody.node as? GuardianNode,
           let wp = weaponProjectile(from: wBody) {
            let hit = wp.position
            let (dmg, crit) = rollWeaponDamage(base: wp.damage, weapon: wp.sourceWeapon)
            gn.takeDamage(dmg, isCritical: crit, hitEffect: wp.hitEffect)
            wp.onHit()
            screenShake.impulse(gn.isDead ? 11 : 5.5)
            GameJuice.addHitSparks(to: worldLayer, at: hit, color: gn.cfg.accentColor, count: gn.isDead ? 18 : 10)
            if crit { GameJuice.addCritFlash(to: worldLayer, at: hit) }
        }

        // Player weapon → boss
        if let (wBody, bBody) = bodies(a:PhysicsCategory.playerWeapon, b:PhysicsCategory.boss),
           let bn = bBody.node as? BossNode,
           let wp = weaponProjectile(from: wBody) {
            let hit = wp.position
            let (dmg, crit) = rollWeaponDamage(base: wp.damage, weapon: wp.sourceWeapon)
            bn.takeDamage(dmg, isCritical: crit, hitEffect: wp.hitEffect)
            wp.onHit()
            screenShake.impulse(bn.isDead ? 15 : 6.5)
            GameJuice.addHitSparks(to: worldLayer, at: hit, color: UIColor(red: 0.9, green: 0.35, blue: 1, alpha: 1), count: bn.isDead ? 22 : 10)
            if crit { GameJuice.addCritFlash(to: worldLayer, at: hit) }
        }

        // Enemy weapon → player
        if let (proj, _) = bodies(a:PhysicsCategory.enemyWeapon, b:PhysicsCategory.player),
           let pn = proj.node as? EnemyProjectileNode {
            GameStore.shared.damagePlayer(pn.damage)
            pn.run(SKAction.sequence([SKAction.fadeOut(withDuration:0.06), SKAction.removeFromParent()]))
            player?.flashHit()
            screenShake.impulse(6.5)
            GameJuice.addPainSparks(to: worldLayer, at: player.position)
        }
    }

    // MARK: - Juice (screen shake, particles)
    private func juiceEnemyWeaponHit(at hitWorld: CGPoint, enemy: EnemyNode) {
        let accent = enemy.accentColor
        let elite = enemy.isElite
        let dead = enemy.isDead
        screenShake.impulse(dead ? (elite ? 9 : 6) : (elite ? 4.5 : 2.4))
        GameJuice.addHitSparks(to: worldLayer, at: hitWorld, color: UIColor.white.withAlphaComponent(0.9), count: 3)
        GameJuice.addHitSparks(to: worldLayer, at: hitWorld, color: accent, count: elite ? 12 : 7)
    }

    func juiceSwordSwing() {
        screenShake.impulse(1.4)
    }

    func juiceSpinAttack() {
        screenShake.impulse(4)
        GameJuice.addHitSparks(to: worldLayer, at: player.position, color: UIColor(red: 0.45, green: 0.85, blue: 1, alpha: 1), count: 8)
    }

    func juiceBomb(at worldPos: CGPoint) {
        screenShake.impulse(16)
        GameJuice.addExplosionFlash(to: worldLayer, at: worldPos)
    }

    func juiceDodgeRoll() {
        screenShake.impulse(2.2)
    }

    private func weaponProjectile(from body: SKPhysicsBody) -> WeaponProjectileNode? {
        var n: SKNode? = body.node
        while let cur = n {
            if let w = cur as? WeaponProjectileNode { return w }
            n = cur.parent
        }
        return nil
    }

    private func rollWeaponDamage(base: CGFloat, weapon: WeaponType) -> (CGFloat, Bool) {
        let m = GameStore.shared.weaponMasteryDamageMultiplier(for: weapon)
        let scaled = base * m
        if CGFloat.random(in: 0...1) < GameStore.shared.effectiveCritChance { return (scaled * 2.08, true) }
        return (scaled, false)
    }
}

// MARK: - Helper Sprites

class NPCSprite: SKNode {
    let npcId: String
    init(def: NPCDef) {
        self.npcId = def.id
        super.init()
        let body = SKShapeNode(circleOfRadius: 14)
        body.fillColor = def.color.withAlphaComponent(0.88)
        body.strokeColor = UIColor.white.withAlphaComponent(0.35)
        body.lineWidth = 1.5
        addChild(body)
        let hat = SKShapeNode(rectOf: CGSize(width: 20, height: 8), cornerRadius: 2)
        hat.fillColor = def.color.withAlphaComponent(0.65)
        hat.strokeColor = .clear
        hat.position = CGPoint(x: 0, y: 12)
        addChild(hat)
        let glow = SKShapeNode(circleOfRadius: 22)
        glow.fillColor = .clear
        glow.strokeColor = UIColor(red: 0.55, green: 0.85, blue: 1, alpha: 0.35)
        glow.lineWidth = 2
        glow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.15, duration: 1.1),
            SKAction.fadeAlpha(to: 0.65, duration: 1.1)
        ])))
        addChild(glow)
        let pb = SKPhysicsBody(circleOfRadius: 16)
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.loreStone
        pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        physicsBody = pb
    }
    required init?(coder: NSCoder) { fatalError() }
}

class MerchantSprite: SKNode {
    let merchantId: String
    init(id: String) {
        self.merchantId = id
        super.init()
        let stall = SKShapeNode(rectOf: CGSize(width: 44, height: 28), cornerRadius: 4)
        stall.fillColor = UIColor(red: 0.45, green: 0.28, blue: 0.12, alpha: 1)
        stall.strokeColor = UIColor(red: 0.95, green: 0.7, blue: 0.25, alpha: 0.9)
        stall.lineWidth = 2
        addChild(stall)
        let awning = SKShapeNode(rectOf: CGSize(width: 50, height: 10), cornerRadius: 2)
        awning.fillColor = UIColor(red: 0.75, green: 0.2, blue: 0.15, alpha: 1)
        awning.strokeColor = .clear
        awning.position = CGPoint(x: 0, y: 16)
        addChild(awning)
        let sign = SKLabelNode(text: "SHOP")
        sign.fontName = "AvenirNext-Heavy"
        sign.fontSize = 9
        sign.fontColor = UIColor(red: 1, green: 0.9, blue: 0.45, alpha: 1)
        sign.verticalAlignmentMode = .center
        sign.position = CGPoint(x: 0, y: 17)
        addChild(sign)
        let glow = SKShapeNode(circleOfRadius: 30)
        glow.fillColor = .clear
        glow.strokeColor = UIColor(red: 1, green: 0.55, blue: 0.15, alpha: 0.4)
        glow.lineWidth = 2
        glow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.12, duration: 0.9),
            SKAction.fadeAlpha(to: 0.55, duration: 0.9)
        ])))
        addChild(glow)
        let pb = SKPhysicsBody(rectangleOf: CGSize(width: 48, height: 32))
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.chest
        pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        physicsBody = pb
    }
    required init?(coder: NSCoder) { fatalError() }
}

class PortalSprite: SKNode {
    let def: PortalDef
    init(def: PortalDef) { self.def=def; super.init(); setup() }
    required init?(coder:NSCoder){fatalError()}
    private func setup() {
        let outer = SKShapeNode(circleOfRadius:30); outer.fillColor=def.color.withAlphaComponent(0.22)
        outer.strokeColor=def.color; outer.lineWidth=2; addChild(outer)
        outer.run(SKAction.repeatForever(SKAction.rotate(byAngle:.pi*2, duration:4)))

        let inner = SKShapeNode(circleOfRadius:16); inner.fillColor=def.color.withAlphaComponent(0.6)
        inner.strokeColor = .clear; addChild(inner)
        inner.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to:0.82,duration:0.7), SKAction.scale(to:1.18,duration:0.7)
        ])))

        let lbl = SKLabelNode(text:def.label); lbl.fontName="AvenirNext"; lbl.fontSize=10
        lbl.fontColor=def.color; lbl.position=CGPoint(x:0,y:38); lbl.verticalAlignmentMode = .center
        addChild(lbl)
    }
}

class ChestSprite: SKNode {
    let def: ChestDef
    init(def: ChestDef) { self.def=def; super.init(); setup() }
    required init?(coder:NSCoder){fatalError()}
    private func setup() {
        let body = SKShapeNode(rectOf:CGSize(width:28,height:22), cornerRadius:4)
        body.fillColor = UIColor(red:0.50,green:0.33,blue:0.12,alpha:1)
        body.strokeColor = UIColor(red:0.85,green:0.65,blue:0.22,alpha:1); body.lineWidth=1.5; addChild(body)
        let lid = SKShapeNode(rectOf:CGSize(width:28,height:10), cornerRadius:2)
        lid.fillColor = UIColor(red:0.62,green:0.44,blue:0.18,alpha:1)
        lid.strokeColor = UIColor(red:0.85,green:0.65,blue:0.22,alpha:1); lid.lineWidth=1
        lid.position = CGPoint(x:0,y:11); lid.name="lid"; addChild(lid)
        if def.weaponUnlock != nil {
            let glow = SKShapeNode(circleOfRadius:22); glow.fillColor = .clear
            glow.strokeColor = UIColor(red:1.0,green:0.8,blue:0.2,alpha:0.4); glow.lineWidth=3
            glow.run(SKAction.repeatForever(SKAction.sequence([SKAction.fadeAlpha(to:0.12,duration:1.0),SKAction.fadeAlpha(to:0.8,duration:1.0)])))
            addChild(glow)
        }
        let pb = SKPhysicsBody(rectangleOf: CGSize(width: 28, height: 22))
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.chest
        pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        physicsBody = pb
    }
    func open() {
        childNode(withName:"lid")?.run(SKAction.rotate(byAngle:-.pi*0.55, duration:0.2))
        run(SKAction.sequence([SKAction.wait(forDuration:1.2), SKAction.fadeOut(withDuration:0.3), SKAction.removeFromParent()]))
    }
}

class LoreStoneSprite: SKNode {
    let def: LoreStoneDef
    init(def: LoreStoneDef) { self.def=def; super.init(); setup() }
    required init?(coder:NSCoder){fatalError()}
    private func setup() {
        let stone = SKShapeNode(rectOf:CGSize(width:22,height:30), cornerRadius:3)
        stone.fillColor = UIColor(red:0.48,green:0.43,blue:0.34,alpha:1)
        stone.strokeColor = UIColor(red:0.68,green:0.63,blue:0.54,alpha:1); stone.lineWidth=1; addChild(stone)
        let glow = SKShapeNode(circleOfRadius:18); glow.fillColor = .clear
        glow.strokeColor = UIColor(red:0.45,green:0.35,blue:0.85,alpha:0.5); glow.lineWidth=2
        glow.run(SKAction.repeatForever(SKAction.sequence([SKAction.fadeAlpha(to:0.18,duration:1.5),SKAction.fadeAlpha(to:0.8,duration:1.5)])))
        addChild(glow)
        let pb = SKPhysicsBody(rectangleOf: CGSize(width: 22, height: 30))
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.loreStone
        pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        physicsBody = pb
    }
}

class ShardSprite: SKNode {
    let def: ShardDef
    var collected = false
    init(def: ShardDef) { self.def=def; super.init(); setup() }
    required init?(coder:NSCoder){fatalError()}
    private func setup() {
        let path = UIBezierPath()
        path.move(to:CGPoint(x:0,y:22)); path.addLine(to:CGPoint(x:14,y:6))
        path.addLine(to:CGPoint(x:0,y:-22)); path.addLine(to:CGPoint(x:-14,y:6)); path.close()
        let shard = SKShapeNode(path:path.cgPath)
        shard.fillColor = UIColor(red:0.5,green:0.8,blue:1.0,alpha:0.9)
        shard.strokeColor = .white; shard.lineWidth=1.5; shard.name="shardGem"; addChild(shard)
        let glow = SKShapeNode(circleOfRadius:28); glow.fillColor = UIColor(red:0.4,green:0.7,blue:1.0,alpha:0.14)
        glow.strokeColor = UIColor(red:0.5,green:0.8,blue:1.0,alpha:0.4); glow.lineWidth=2; addChild(glow)
        shard.run(SKAction.repeatForever(SKAction.sequence([SKAction.rotate(byAngle:.pi*0.08,duration:1.1),SKAction.rotate(byAngle:-.pi*0.08,duration:1.1)])))
        run(SKAction.repeatForever(SKAction.sequence([SKAction.moveBy(x:0,y:6,duration:1.1),SKAction.moveBy(x:0,y:-6,duration:1.1)])))
        let pb = SKPhysicsBody(circleOfRadius: 18)
        pb.isDynamic = false
        pb.categoryBitMask = PhysicsCategory.shard
        pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy | PhysicsCategory.guardian | PhysicsCategory.boss
        physicsBody = pb
    }
    func collect() {
        guard !collected else { return }; collected=true
        GameStore.shared.shardsCollected += 1
        GameStore.shared.itemFanfare = ItemFanfare(name:def.name, icon:"💎",
            desc:"Crystal Shard recovered! (\(GameStore.shared.shardsCollected)/3)")
        run(SKAction.sequence([
            SKAction.group([SKAction.scale(to:2.2,duration:0.4), SKAction.fadeOut(withDuration:0.4)]),
            SKAction.removeFromParent()
        ]))
    }
}
