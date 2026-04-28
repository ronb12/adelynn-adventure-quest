import SpriteKit
import UIKit

class HUDNode: SKNode {

    private let sceneSize: CGSize

    // Hearts
    private var heartNodes: [SKShapeNode] = []
    private var heartContainer: SKNode!

    // Resources
    private var rupeeLabel: SKLabelNode!
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

    init(size: CGSize) {
        self.sceneSize = size
        super.init()
        buildHUD()
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Build
    private func buildHUD() {
        buildHearts()
        buildResourceBar()
        buildWeaponBar()
        buildScoreBar()
        buildGuardianBar()
        buildBossBar()
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

    private func buildResourceBar() {
        let bg = SKShapeNode(rectOf:CGSize(width:120, height:22), cornerRadius:6)
        bg.fillColor = UIColor.black.withAlphaComponent(0.55)
        bg.strokeColor = UIColor.white.withAlphaComponent(0.12)
        bg.position = CGPoint(x: -sceneSize.width/2 + 74, y: sceneSize.height/2 - 52)
        addChild(bg)

        rupeeLabel = SKLabelNode(text:"💎 0")
        rupeeLabel.fontName = "AvenirNext-Bold"; rupeeLabel.fontSize = 13
        rupeeLabel.fontColor = UIColor(red:0.4, green:0.9, blue:0.5, alpha:1)
        rupeeLabel.position = CGPoint(x:-sceneSize.width/2+28, y:sceneSize.height/2-58)
        rupeeLabel.horizontalAlignmentMode = .left
        addChild(rupeeLabel)
    }

    private func buildWeaponBar() {
        let bg = SKShapeNode(rectOf:CGSize(width:150, height:36), cornerRadius:8)
        bg.fillColor = UIColor.black.withAlphaComponent(0.6)
        bg.strokeColor = UIColor.white.withAlphaComponent(0.15)
        bg.position = CGPoint(x: sceneSize.width/2-84, y: -sceneSize.height/2+28)
        addChild(bg)

        weaponIconLabel = SKLabelNode(text:"⚔️")
        weaponIconLabel.fontSize = 18
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

        let lbl = SKLabelNode(text:"Malgrath — The Shattered King")
        lbl.fontName = "Georgia-Bold"; lbl.fontSize = 11
        lbl.fontColor = UIColor(red:0.8,green:0.4,blue:1.0,alpha:1)
        lbl.position = CGPoint(x:0, y:16); lbl.verticalAlignmentMode = .center
        container.addChild(lbl)
    }

    // MARK: - Public Update
    func update(store: GameStore) {
        // Hearts
        let maxH = Int(store.maxHearts)
        if heartNodes.count != maxH { refreshHearts() }
        for (i, node) in heartNodes.enumerated() {
            let filled = CGFloat(i) < store.hearts
            node.fillColor = filled ? UIColor(red:0.9,green:0.15,blue:0.15,alpha:1) : UIColor(red:0.25,green:0.15,blue:0.15,alpha:1)
        }

        // Rupees
        rupeeLabel.text = "💎 \(store.rupees)"

        // Weapon
        let w = store.activeWeapon
        weaponIconLabel.text = w.icon
        weaponLabel.text = w.displayName
        let ammo = store.ammoCount(for: w)
        ammoLabel.text = ammo < 0 ? "" : "×\(ammo)"

        // Score
        scoreLabel.text = "\(store.score)"
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
    }

    func updateWeaponBar() { update(store: GameStore.shared) }

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
