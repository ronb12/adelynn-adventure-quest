import SpriteKit
import UIKit

class HUDNode: SKNode {

    private let sceneSize: CGSize

    // Hearts
    private var heartNodes: [SKShapeNode] = []
    private var heartContainer: SKNode!

    // Resources
    private var rupeeGemLabel: SKLabelNode!
    private var rupeeValueLabel: SKLabelNode!
    private var ammoLabel: SKLabelNode!
    private var weaponLabel: SKLabelNode!
    private var weaponIconLabel: SKLabelNode!

    // Score / Combo
    private var scoreLabel: SKLabelNode!
    private var comboLabel: SKLabelNode!
    private var timerLabel: SKLabelNode!

    // Area banner + portal hint
    private var portalHintNode: SKNode?
    private var interactHintNode: SKNode?

    // Guardian / Boss HP bar
    private var guardianBarContainer: SKNode?
    private var guardianBarFill: SKShapeNode?
    private let guardianBarW: CGFloat = 260

    private var bossBarContainer: SKNode?
    private var bossBarFill: SKShapeNode?
    private let bossBarW: CGFloat = 300

    private var minimapMarkers: SKNode?
    private var loreCountLabel: SKLabelNode?
    private var lastPlayerWorldPos: CGPoint = .zero
    private var shardGemNodes: [SKShapeNode] = []
    private var shardQuestRoot: SKNode?
    private var levelLabel: SKLabelNode!
    private var xpBarBg: SKShapeNode!
    private var xpBarFill: SKSpriteNode!
    private let xpBarMaxW: CGFloat = 108

    init(size: CGSize) {
        self.sceneSize = size
        super.init()
        buildHUD()
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Build
    private func buildHUD() {
        buildHearts()
        buildLevelXPBar()
        buildResourceBar()
        buildWeaponBar()
        buildScoreBar()
        buildGuardianBar()
        buildBossBar()
        buildMinimap()
        buildShardQuest()
    }

    private func buildShardQuest() {
        let root = SKNode()
        root.position = CGPoint(x: 0, y: sceneSize.height / 2 - 72)
        root.zPosition = 8
        addChild(root)
        shardQuestRoot = root

        let title = SKLabelNode(text: "CROWN SHARDS")
        title.fontName = "Georgia-Bold"
        title.fontSize = 9
        title.fontColor = UIColor(red: 0.85, green: 0.75, blue: 1, alpha: 0.85)
        title.position = CGPoint(x: 0, y: 22)
        root.addChild(title)

        let names = ["Dawn", "Dusk", "Ember"]
        let spacing: CGFloat = 36
        for i in 0..<3 {
            let g = SKShapeNode(rectOf: CGSize(width: 26, height: 26), cornerRadius: 5)
            g.fillColor = UIColor.black.withAlphaComponent(0.5)
            g.strokeColor = UIColor(red: 0.5, green: 0.75, blue: 1, alpha: 0.45)
            g.lineWidth = 1
            g.position = CGPoint(x: CGFloat(i - 1) * spacing, y: 0)
            root.addChild(g)

            let path = UIBezierPath()
            path.move(to: CGPoint(x: 0, y: 8))
            path.addLine(to: CGPoint(x: 7, y: 2))
            path.addLine(to: CGPoint(x: 0, y: -8))
            path.addLine(to: CGPoint(x: -7, y: 2))
            path.close()
            let gem = SKShapeNode(path: path.cgPath)
            gem.fillColor = UIColor(white: 0.22, alpha: 0.9)
            gem.strokeColor = UIColor(white: 0.4, alpha: 0.5)
            gem.lineWidth = 0.8
            gem.name = "shardGem_\(i)"
            g.addChild(gem)
            shardGemNodes.append(gem)

            let cap = SKLabelNode(text: names[i])
            cap.fontName = "AvenirNext"
            cap.fontSize = 7
            cap.fontColor = UIColor.white.withAlphaComponent(0.45)
            cap.position = CGPoint(x: CGFloat(i - 1) * spacing, y: -22)
            root.addChild(cap)
        }
    }

    private func buildHearts() {
        heartContainer = SKNode()
        heartContainer.position = CGPoint(x: -sceneSize.width/2 + 14, y: sceneSize.height/2 - 28)
        addChild(heartContainer)
        refreshHearts()
    }

    private func refreshHearts() {
        heartContainer.removeAllChildren()
        heartNodes.removeAll()
        let store = GameStore.shared
        let max = Int(store.maxHearts)
        for i in 0..<max {
            let heart = SKShapeNode(circleOfRadius: 9)
            heart.position = CGPoint(x: CGFloat(i) * 22, y: 0)
            let filled = CGFloat(i) < store.hearts
            heart.fillColor = filled ? UIColor(red:0.9, green:0.15, blue:0.15, alpha:1) : UIColor(red:0.25, green:0.15, blue:0.15, alpha:1)
            heart.strokeColor = UIColor(red:0.7, green:0.1, blue:0.1, alpha:0.6)
            heart.lineWidth = 1
            heartContainer.addChild(heart)
            heartNodes.append(heart)
        }
    }

    private func buildLevelXPBar() {
        let leftX = -sceneSize.width / 2 + 14
        let yTop = sceneSize.height / 2 - 76
        levelLabel = SKLabelNode(text: "Lv 1")
        levelLabel.fontName = "AvenirNext-Bold"
        levelLabel.fontSize = 11
        levelLabel.fontColor = UIColor(red: 0.75, green: 0.88, blue: 1, alpha: 1)
        levelLabel.horizontalAlignmentMode = .left
        levelLabel.position = CGPoint(x: leftX, y: yTop)
        addChild(levelLabel)

        xpBarBg = SKShapeNode(rectOf: CGSize(width: xpBarMaxW, height: 7), cornerRadius: 3)
        xpBarBg.fillColor = UIColor.black.withAlphaComponent(0.55)
        xpBarBg.strokeColor = UIColor.white.withAlphaComponent(0.15)
        xpBarBg.lineWidth = 1
        xpBarBg.position = CGPoint(x: leftX + xpBarMaxW / 2, y: yTop - 14)
        addChild(xpBarBg)

        xpBarFill = SKSpriteNode(color: UIColor(red: 0.4, green: 0.72, blue: 1, alpha: 1),
                                  size: CGSize(width: xpBarMaxW - 4, height: 5))
        xpBarFill.anchorPoint = CGPoint(x: 0, y: 0.5)
        xpBarFill.position = CGPoint(x: -xpBarMaxW / 2 + 2, y: 0)
        xpBarBg.addChild(xpBarFill)
    }

    private func buildResourceBar() {
        let bg = SKShapeNode(rectOf:CGSize(width:120, height:22), cornerRadius:6)
        bg.fillColor = UIColor.black.withAlphaComponent(0.55)
        bg.strokeColor = UIColor.white.withAlphaComponent(0.12)
        bg.position = CGPoint(x: -sceneSize.width/2 + 74, y: sceneSize.height/2 - 52)
        addChild(bg)

        let rupeeY = sceneSize.height / 2 - 58
        let leftX = -sceneSize.width / 2 + 18
        rupeeGemLabel = SKLabelNode(text: "💎")
        SpriteKitEmojiSupport.applyEmojiFont(to: rupeeGemLabel, size: 13)
        rupeeGemLabel.fontColor = UIColor(red: 0.4, green: 0.9, blue: 0.5, alpha: 1)
        rupeeGemLabel.position = CGPoint(x: leftX, y: rupeeY)
        rupeeGemLabel.horizontalAlignmentMode = .left
        addChild(rupeeGemLabel)

        rupeeValueLabel = SKLabelNode(text: "0")
        rupeeValueLabel.fontName = "AvenirNext-Bold"
        rupeeValueLabel.fontSize = 13
        rupeeValueLabel.fontColor = UIColor(red: 0.4, green: 0.9, blue: 0.5, alpha: 1)
        rupeeValueLabel.position = CGPoint(x: leftX + 17, y: rupeeY)
        rupeeValueLabel.horizontalAlignmentMode = .left
        addChild(rupeeValueLabel)
    }

    private func buildWeaponBar() {
        let bg = SKShapeNode(rectOf:CGSize(width:150, height:36), cornerRadius:8)
        bg.fillColor = UIColor.black.withAlphaComponent(0.6)
        bg.strokeColor = UIColor.white.withAlphaComponent(0.15)
        bg.position = CGPoint(x: sceneSize.width/2-84, y: -sceneSize.height/2+28)
        addChild(bg)

        weaponIconLabel = SKLabelNode(text: "⚔️")
        SpriteKitEmojiSupport.applyEmojiFont(to: weaponIconLabel, size: 18)
        weaponIconLabel.position = CGPoint(x:sceneSize.width/2-145, y:-sceneSize.height/2+20)
        weaponIconLabel.verticalAlignmentMode = .center
        addChild(weaponIconLabel)

        weaponLabel = SKLabelNode(text:"Crystal Sword")
        weaponLabel.fontName = "AvenirNext-Bold"; weaponLabel.fontSize = 11
        weaponLabel.fontColor = .white
        weaponLabel.position = CGPoint(x:sceneSize.width/2-120, y:-sceneSize.height/2+28)
        weaponLabel.horizontalAlignmentMode = .left; weaponLabel.verticalAlignmentMode = .center
        addChild(weaponLabel)

        ammoLabel = SKLabelNode(text:"")
        ammoLabel.fontName = "AvenirNext"; ammoLabel.fontSize = 10
        ammoLabel.fontColor = UIColor.white.withAlphaComponent(0.7)
        ammoLabel.position = CGPoint(x:sceneSize.width/2-120, y:-sceneSize.height/2+18)
        ammoLabel.horizontalAlignmentMode = .left; ammoLabel.verticalAlignmentMode = .center
        addChild(ammoLabel)
    }

    private func buildScoreBar() {
        scoreLabel = SKLabelNode(text:"0")
        scoreLabel.fontName = "AvenirNext-Bold"; scoreLabel.fontSize = 14
        scoreLabel.fontColor = UIColor(red:1.0, green:0.85, blue:0.3, alpha:1)
        scoreLabel.position = CGPoint(x:sceneSize.width/2-10, y:sceneSize.height/2-18)
        scoreLabel.horizontalAlignmentMode = .right; scoreLabel.verticalAlignmentMode = .center
        addChild(scoreLabel)

        comboLabel = SKLabelNode(text:"")
        comboLabel.fontName = "AvenirNext-Bold"; comboLabel.fontSize = 13
        comboLabel.fontColor = UIColor(red:1.0, green:0.6, blue:0.1, alpha:1)
        comboLabel.position = CGPoint(x:0, y:sceneSize.height/2-42)
        comboLabel.horizontalAlignmentMode = .center; comboLabel.verticalAlignmentMode = .center
        addChild(comboLabel)

        timerLabel = SKLabelNode(text:"0:00")
        timerLabel.fontName = "AvenirNext"; timerLabel.fontSize = 11
        timerLabel.fontColor = UIColor.white.withAlphaComponent(0.5)
        timerLabel.position = CGPoint(x:sceneSize.width/2-10, y:sceneSize.height/2-34)
        timerLabel.horizontalAlignmentMode = .right; timerLabel.verticalAlignmentMode = .center
        addChild(timerLabel)
    }

    private func buildGuardianBar() {
        let container = SKNode()
        container.position = CGPoint(x:0, y:sceneSize.height/2-24)
        container.alpha = 0
        addChild(container)
        guardianBarContainer = container

        let bg = SKShapeNode(rectOf:CGSize(width:guardianBarW, height:12), cornerRadius:5)
        bg.fillColor = UIColor.black.withAlphaComponent(0.7)
        bg.strokeColor = UIColor.white.withAlphaComponent(0.2); bg.lineWidth=1
        container.addChild(bg)

        let fill = SKShapeNode(rectOf:CGSize(width:guardianBarW-4, height:8), cornerRadius:4)
        fill.fillColor = .from(hex:"#66dd22"); fill.strokeColor = .clear
        fill.position = CGPoint(x:0, y:0)
        container.addChild(fill)
        guardianBarFill = fill

        let nameLbl = SKLabelNode(text:"Guardian")
        nameLbl.fontName = "Georgia-Bold"; nameLbl.fontSize = 11
        nameLbl.fontColor = .white; nameLbl.name = "guardianName"
        nameLbl.position = CGPoint(x:0, y:10)
        nameLbl.verticalAlignmentMode = .center
        container.addChild(nameLbl)
    }

    private func buildBossBar() {
        let container = SKNode()
        container.position = CGPoint(x:0, y:-sceneSize.height/2+54)
        container.alpha = 0
        addChild(container)
        bossBarContainer = container

        let bg = SKShapeNode(rectOf:CGSize(width:bossBarW, height:16), cornerRadius:7)
        bg.fillColor = UIColor.black.withAlphaComponent(0.8)
        bg.strokeColor = UIColor(red:0.6,green:0.1,blue:0.9,alpha:0.6); bg.lineWidth=1.5
        container.addChild(bg)

        let fill = SKShapeNode(rectOf:CGSize(width:bossBarW-4, height:12), cornerRadius:5)
        fill.fillColor = UIColor(red:0.7,green:0.1,blue:0.9,alpha:1); fill.strokeColor = .clear
        container.addChild(fill)
        bossBarFill = fill

        let lbl = SKLabelNode(text:"Malgrath — The Shattered Crown")
        lbl.fontName = "Georgia-Bold"; lbl.fontSize = 11
        lbl.fontColor = UIColor(red:0.8,green:0.4,blue:1.0,alpha:1)
        lbl.position = CGPoint(x:0, y:16); lbl.verticalAlignmentMode = .center
        container.addChild(lbl)
    }

    private func buildMinimap() {
        let root = SKNode()
        root.position = CGPoint(x: -sceneSize.width / 2 + 58, y: sceneSize.height / 2 - 96)
        root.zPosition = 6
        addChild(root)

        let border = SKShapeNode(rectOf: CGSize(width: 86, height: 86), cornerRadius: 8)
        border.fillColor = UIColor.black.withAlphaComponent(0.48)
        border.strokeColor = UIColor.white.withAlphaComponent(0.22)
        border.lineWidth = 1.5
        root.addChild(border)

        let title = SKLabelNode(text: "MAP")
        title.fontName = "AvenirNext-Bold"
        title.fontSize = 9
        title.fontColor = UIColor.white.withAlphaComponent(0.55)
        title.position = CGPoint(x: 0, y: 48)
        root.addChild(title)

        let loreLbl = SKLabelNode(text: "lore 0/3")
        loreLbl.fontName = "AvenirNext"
        loreLbl.fontSize = 8
        loreLbl.fontColor = UIColor(red: 0.75, green: 0.55, blue: 1.0, alpha: 0.9)
        loreLbl.position = CGPoint(x: 0, y: -52)
        root.addChild(loreLbl)
        loreCountLabel = loreLbl

        let markers = SKNode()
        markers.zPosition = 2
        root.addChild(markers)
        minimapMarkers = markers
    }

    private func refreshMinimap(store: GameStore, playerWorldPos: CGPoint) {
        guard let markers = minimapMarkers else { return }
        markers.removeAllChildren()
        let ws = WorldConfig.worldSize
        let span: CGFloat = 34
        func toMini(_ p: CGPoint) -> CGPoint {
            let nx = (p.x + ws.width / 2) / ws.width
            let ny = (p.y + ws.height / 2) / ws.height
            return CGPoint(x: (nx - 0.5) * (span * 2), y: (ny - 0.5) * (span * 2))
        }
        let area = store.currentArea
        if let ports = WorldConfig.portals[area] {
            for p in ports {
                let d = SKShapeNode(circleOfRadius: 3)
                d.fillColor = UIColor(red: 0.35, green: 0.88, blue: 1.0, alpha: 0.95)
                d.strokeColor = .clear
                d.position = toMini(p.position)
                markers.addChild(d)
            }
        }
        if let chestList = WorldConfig.chests[area] {
            for c in chestList where !store.chestsOpened.contains(c.id) {
                let d = SKShapeNode(circleOfRadius: 2.5)
                d.fillColor = UIColor(red: 1.0, green: 0.88, blue: 0.25, alpha: 1)
                d.strokeColor = .clear
                d.position = toMini(c.position)
                markers.addChild(d)
            }
        }
        if let loreList = WorldConfig.loreStones[area] {
            var readN = 0
            for L in loreList {
                if store.loreRead.contains(L.id) {
                    readN += 1
                } else {
                    let d = SKShapeNode(circleOfRadius: 2.2)
                    d.fillColor = UIColor(red: 0.72, green: 0.38, blue: 1.0, alpha: 0.95)
                    d.strokeColor = .clear
                    d.position = toMini(L.position)
                    markers.addChild(d)
                }
            }
            loreCountLabel?.text = "lore \(readN)/\(loreList.count)"
        } else {
            loreCountLabel?.text = "lore —"
        }

        let pl = SKShapeNode(circleOfRadius: 3.5)
        pl.fillColor = .white
        pl.strokeColor = UIColor.black.withAlphaComponent(0.35)
        pl.lineWidth = 0.5
        pl.position = toMini(playerWorldPos)
        pl.zPosition = 4
        markers.addChild(pl)
    }

    // MARK: - Public Update
    func update(store: GameStore, playerWorldPos: CGPoint) {
        lastPlayerWorldPos = playerWorldPos
        // Hearts
        let maxH = Int(store.maxHearts)
        if heartNodes.count != maxH { refreshHearts() }
        for (i, node) in heartNodes.enumerated() {
            let filled = CGFloat(i) < store.hearts
            node.fillColor = filled ? UIColor(red:0.9,green:0.15,blue:0.15,alpha:1) : UIColor(red:0.25,green:0.15,blue:0.15,alpha:1)
        }

        // Rupees
        rupeeValueLabel.text = "\(store.rupees)"

        // Weapon
        let w = store.activeWeapon
        weaponIconLabel.text = w.icon
        SpriteKitEmojiSupport.applyEmojiFont(to: weaponIconLabel, size: 18)
        weaponLabel.text = w == .sword ? store.swordDisplayTitle : w.displayName
        let ammo = store.ammoCount(for: w)
        ammoLabel.text = ammo < 0 ? "" : "×\(ammo)"

        // Score
        scoreLabel.text = "\(store.score)  ·  elites \(store.eliteKills)"
        timerLabel.text = store.elapsedFormatted
        if store.comboCount > 1 {
            comboLabel.text = "×\(store.comboCount) COMBO!"
            comboLabel.alpha = 1
        } else {
            comboLabel.alpha = 0
        }

        // Guardian bar
        if store.currentGuardianMaxHP > 0 && !store.guardianDefeated.contains(store.currentArea) {
            guardianBarContainer?.alpha = 1
            let ratio = max(0, store.currentGuardianHP / store.currentGuardianMaxHP)
            guardianBarFill?.xScale = ratio
            guardianBarFill?.fillColor = ratio > 0.5 ? .from(hex:"#66dd22") : ratio > 0.25 ? .from(hex:"#ffaa00") : .from(hex:"#ff2222")
            if let cfg = WorldConfig.guardians[store.currentArea] {
                (guardianBarContainer?.childNode(withName:"guardianName") as? SKLabelNode)?.text = "\(cfg.name)"
            }
        } else {
            guardianBarContainer?.alpha = 0
        }

        // Boss bar
        if store.currentArea == .boss && !store.bossDefeated {
            bossBarContainer?.alpha = 1
            let ratio = max(0, store.bossHP / store.bossMaxHP)
            bossBarFill?.xScale = ratio
            bossBarFill?.fillColor = ratio > 0.5 ? UIColor(red:0.7,green:0.1,blue:0.9,alpha:1) :
                                     ratio > 0.25 ? UIColor(red:1.0,green:0.3,blue:0.3,alpha:1) :
                                                    UIColor(red:1.0,green:0.0,blue:0.0,alpha:1)
        } else {
            bossBarContainer?.alpha = 0
        }

        refreshMinimap(store: store, playerWorldPos: playerWorldPos)
        refreshShardQuest(collected: store.shardsCollected)

        levelLabel.text = "Lv \(store.playerLevel)  ·  \(store.totalEnemiesSlain) felled"
        let need = max(1, store.xpToNextLevel)
        let ratio = CGFloat(store.playerXP) / CGFloat(need)
        xpBarFill.size = CGSize(width: max(2, (xpBarMaxW - 4) * min(1, ratio)), height: 5)
    }

    private func refreshShardQuest(collected: Int) {
        for (i, gem) in shardGemNodes.enumerated() {
            let got = i < collected
            gem.fillColor = got
                ? UIColor(red: 0.45, green: 0.82, blue: 1, alpha: 0.95)
                : UIColor(white: 0.22, alpha: 0.9)
            gem.strokeColor = got
                ? UIColor.white.withAlphaComponent(0.85)
                : UIColor(white: 0.4, alpha: 0.5)
            gem.alpha = got ? 1 : 0.45
            gem.removeAllActions()
            if got {
                gem.run(SKAction.repeatForever(SKAction.sequence([
                    SKAction.fadeAlpha(to: 0.75, duration: 0.9),
                    SKAction.fadeAlpha(to: 1, duration: 0.9)
                ])))
            }
        }
    }

    func updateWeaponBar() { update(store: GameStore.shared, playerWorldPos: lastPlayerWorldPos) }

    // MARK: - Portal / Interact Hints
    func showPortalHint(label: String) {
        guard portalHintNode == nil else { return }
        let node = buildHint(text:"→ \(label)", color:.from(hex:"#88eeff"))
        node.position = CGPoint(x:0, y:-sceneSize.height/2+36)
        addChild(node); portalHintNode = node
    }

    func hidePortalHint() {
        portalHintNode?.removeFromParent(); portalHintNode = nil
    }

    func showInteractHint(_ text: String) {
        interactHintNode?.removeFromParent()
        let node = buildHint(text:"[X] \(text)", color:.from(hex:"#ffee88"))
        node.position = CGPoint(x:0, y:-sceneSize.height/2+62)
        addChild(node); interactHintNode = node
    }

    func hideInteractHint() {
        interactHintNode?.removeFromParent(); interactHintNode = nil
    }

    private func buildHint(text: String, color: UIColor) -> SKNode {
        let container = SKNode()
        let bg = SKShapeNode(rectOf:CGSize(width:220, height:26), cornerRadius:8)
        bg.fillColor = UIColor.black.withAlphaComponent(0.65)
        bg.strokeColor = color.withAlphaComponent(0.5); bg.lineWidth=1
        container.addChild(bg)
        let lbl = SKLabelNode(text:text)
        lbl.fontName = "AvenirNext-Bold"; lbl.fontSize = 12; lbl.fontColor = color
        lbl.verticalAlignmentMode = .center; lbl.horizontalAlignmentMode = .center
        container.addChild(lbl)
        return container
    }
}
