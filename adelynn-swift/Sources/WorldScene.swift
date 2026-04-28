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

    // MARK: - State
    private var transitionCooldown: TimeInterval = 0
    private var autosaveTimer:      TimeInterval = 0
    private var fanfareTimer:       TimeInterval = 0
    private var fanfareNode:        SKNode?
    private var lorePopupNode:      SKNode?
    private var pauseMenuNode:      SKNode?
    private var nearLoreDef:        LoreStoneDef?
    private var nearChestNode:      ChestSprite?
    private var nearPortalDef:      PortalDef?
    private var didTriggerGameOver  = false
    private var didTriggerVictory   = false

    var currentArea: AreaId { GameStore.shared.currentArea }

    // MARK: - Lifecycle
    override func didMove(to view: SKView) {
        physicsWorld.gravity = .zero
        physicsWorld.contactDelegate = self

        setupCamera()
        setupWorld()
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
            pb.collisionBitMask = PhysicsCategory.player | PhysicsCategory.enemy
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
                                  speed:CGFloat.random(in:cfg.speed), bodyColor:cfg.bodyColor,
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
        let b = BossNode(); b.position = CGPoint(x:0,y:-150); b.zPosition = 5
        worldLayer.addChild(b); bossNode = b
    }

    private func setupHUD() {
        hudNode = HUDNode(size:size); hudNode.zPosition = 100
        cameraNode.addChild(hudNode)
    }

    private func setupControls() {
        controlsNode = ControlsNode(size:size); controlsNode.zPosition = 110
        cameraNode.addChild(controlsNode)

        controlsNode.onAttack      = { [weak self] in guard let self else{return}; player.performAttack(in: worldLayer) }
        controlsNode.onSpinAttack  = { [weak self] in guard let self else{return}; player.performSpinAttack(in: worldLayer) }
        controlsNode.onInteract    = { [weak self] in self?.handleInteract() }
        controlsNode.onCycleWeapon = { GameStore.shared.cycleWeapon(direction:1) }
        controlsNode.onRun         = { [weak self] r in self?.player.isRunning = r }
        controlsNode.onTogglePause = { [weak self] in self?.togglePause() }
    }

    // MARK: - Update Loop
    override func update(_ currentTime: TimeInterval) {
        guard GameStore.shared.gameState == .playing else { return }
        let delta: TimeInterval = 1.0/60.0
        let store = GameStore.shared

        // Player movement
        player.updateMovement(direction: controlsNode.joystickDirection, delta: delta)
        cameraNode.position = player.position

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

        // HUD
        hudNode.update(store:store)

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
            if e.isDead { e.playDeathEffect(); return true }; return false
        }
        if let g = guardianNode, g.isDead { g.playDeathEffect(); guardianNode=nil }
        if let b = bossNode, b.isDead    { b.playDeathEffect(); bossNode=nil }

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
        for node in worldLayer.children.compactMap({$0 as? ChestSprite}) {
            if player.position.distance(to:node.position) < threshold {
                hudNode.showInteractHint("Open Chest"); nearChestNode=node; return
            }
        }
        nearChestNode=nil
        if nearLoreDef==nil { hudNode.hideInteractHint() }
    }

    private func checkLoreStones() {
        let threshold: CGFloat = 52
        for node in worldLayer.children.compactMap({$0 as? LoreStoneSprite}) {
            if player.position.distance(to:node.position) < threshold {
                hudNode.showInteractHint("Read: \(node.def.title)"); nearLoreDef=node.def; return
            }
        }
        nearLoreDef=nil
        if nearChestNode==nil { hudNode.hideInteractHint() }
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
        if lorePopupNode != nil { dismissLorePopup(); return }
        if let chest = nearChestNode { openChest(chest); return }
        if let stone = nearLoreDef   { showLorePopup(stone); return }
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

    private func buildLorePopup(_ def: LoreStoneDef) -> SKNode {
        let c = SKNode(); let mw = min(size.width*0.88, 370)
        let bg = SKShapeNode(rectOf:CGSize(width:mw, height:130), cornerRadius:14)
        bg.fillColor = UIColor(red:0.04,green:0.02,blue:0.14,alpha:0.95)
        bg.strokeColor = UIColor(red:0.45,green:0.35,blue:0.85,alpha:0.7); bg.lineWidth=1.5; c.addChild(bg)

        let icon = SKLabelNode(text:"📜"); icon.fontSize=20
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

        let icon = SKLabelNode(text:f.icon); icon.fontSize=26
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
        let m = SKNode(); m.zPosition=200
        let overlay = SKShapeNode(rectOf:size)
        overlay.fillColor = UIColor.black.withAlphaComponent(0.68); overlay.strokeColor = .clear
        m.addChild(overlay)

        let t = SKLabelNode(text:"Paused"); t.fontName="Georgia-Bold"; t.fontSize=34; t.fontColor = .white
        t.position = CGPoint(x:0,y:65); t.verticalAlignmentMode = .center; m.addChild(t)

        for (i,(txt,nm)) in [("Resume","resume"),("Save & Title","quitTitle")].enumerated() {
            let btn = makePauseBtn(text:txt, name:nm)
            btn.position = CGPoint(x:0, y:CGFloat(-i)*62); m.addChild(btn)
        }
        cameraNode.addChild(m); pauseMenuNode=m
    }

    private func hidePauseMenu() { pauseMenuNode?.removeFromParent(); pauseMenuNode=nil }

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
                if n.name == "resume"   || n.name == "lbl_resume"    { togglePause(); return }
                if n.name == "quitTitle"|| n.name == "lbl_quitTitle" {
                    SaveManager.shared.save()
                    isPaused=false; GameStore.shared.gameState = .playing
                    guard let v=view else{return}
                    let s=TitleScene(size:size); s.scaleMode = .aspectFill
                    v.presentScene(s, transition:SKTransition.fade(with:.black, duration:0.5)); return
                }
            }
            return
        }

        // Dismiss lore popup on tap
        if lorePopupNode != nil { dismissLorePopup(); return }

        controlsNode.touchesBegan(touches, with:event)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard GameStore.shared.gameState == .playing else { return }
        controlsNode.touchesMoved(touches, with:event)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        controlsNode.touchesEnded(touches, with:event)
    }
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        controlsNode.touchesCancelled(touches, with:event)
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
           let wp = wBody.node as? WeaponProjectileNode {
            en.takeDamage(wp.damage, from: wp.position); wp.onHit()
        }

        // Player weapon → guardian
        if let (wBody, gBody) = bodies(a:PhysicsCategory.playerWeapon, b:PhysicsCategory.guardian),
           let gn = gBody.node as? GuardianNode,
           let wp = wBody.node as? WeaponProjectileNode {
            gn.takeDamage(wp.damage); wp.onHit()
        }

        // Player weapon → boss
        if let (wBody, bBody) = bodies(a:PhysicsCategory.playerWeapon, b:PhysicsCategory.boss),
           let bn = bBody.node as? BossNode,
           let wp = wBody.node as? WeaponProjectileNode {
            bn.takeDamage(wp.damage); wp.onHit()
        }

        // Enemy weapon → player
        if let (proj, _) = bodies(a:PhysicsCategory.enemyWeapon, b:PhysicsCategory.player),
           let pn = proj.node as? EnemyProjectileNode {
            GameStore.shared.damagePlayer(pn.damage)
            pn.run(SKAction.sequence([SKAction.fadeOut(withDuration:0.06), SKAction.removeFromParent()]))
            player?.flashHit()
        }
    }
}

// MARK: - Helper Sprites

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
