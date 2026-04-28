import SpriteKit
import UIKit

class TitleScene: SKScene {

    private var isAnimating = false

    override func didMove(to view: SKView) {
        setupBackground()
        setupUI()
    }

    // MARK: - Background
    private func setupBackground() {
        backgroundColor = UIColor(red:0.02, green:0.01, blue:0.06, alpha:1)

        // Stars
        for _ in 0..<90 {
            let s = SKShapeNode(circleOfRadius: CGFloat.random(in:0.5...2.2))
            s.fillColor = UIColor.white.withAlphaComponent(CGFloat.random(in:0.25...1.0))
            s.strokeColor = .clear
            s.position = CGPoint(x:CGFloat.random(in:0...size.width), y:CGFloat.random(in:0...size.height))
            addChild(s)
            s.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to:0.15, duration:CGFloat.random(in:0.6...2.5)),
                SKAction.fadeAlpha(to:1.0,  duration:CGFloat.random(in:0.6...2.5))
            ])))
        }

        // Castle silhouette
        addCastle()

        // Ambient purple glow
        let glow = SKShapeNode(circleOfRadius: size.width * 0.35)
        glow.fillColor = UIColor(red:0.3,green:0.0,blue:0.6,alpha:0.10)
        glow.strokeColor = .clear
        glow.position = CGPoint(x:size.width/2, y:size.height*0.65)
        addChild(glow)
    }

    private func addCastle() {
        let container = SKNode()
        container.position = CGPoint(x:size.width/2, y:size.height*0.70)
        container.alpha = 0.55
        addChild(container)

        let castleColor = UIColor(red:0.10,green:0.04,blue:0.20,alpha:1)
        let glowColor   = UIColor(red:0.50,green:0.10,blue:0.90,alpha:0.4)

        func rect(_ r: CGRect) -> SKShapeNode {
            let n = SKShapeNode(rect:r)
            n.fillColor = castleColor; n.strokeColor = glowColor; n.lineWidth = 1
            return n
        }

        container.addChild(rect(CGRect(x:-32,y:0,width:64,height:110)))
        for sx in [-1,1] as [CGFloat] {
            container.addChild(rect(CGRect(x:sx*55-22,y:0,width:44,height:75)))
        }
        for i in -3...3 {
            container.addChild(rect(CGRect(x:CGFloat(i)*11-4,y:110,width:9,height:20)))
        }
        // Glow orb
        let orb = SKShapeNode(circleOfRadius:8)
        orb.fillColor = UIColor(red:0.7,green:0.3,blue:1.0,alpha:0.9); orb.strokeColor = .clear
        orb.position = CGPoint(x:0,y:138)
        container.addChild(orb)
        orb.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to:1.4,duration:0.9), SKAction.scale(to:0.7,duration:0.9)
        ])))
    }

    // MARK: - UI
    private func setupUI() {
        var delay = 0.1

        func add(_ node: SKNode, d: Double) {
            node.alpha = 0
            addChild(node)
            node.run(SKAction.sequence([SKAction.wait(forDuration:d), SKAction.fadeIn(withDuration:0.4)]))
        }

        // Title
        let title = SKLabelNode(text:"Adelynn's Adventure Quest")
        title.fontName = "Georgia-Bold"
        title.fontSize = min(size.width*0.058, 32)
        title.fontColor = UIColor(red:1.0,green:0.80,blue:0.20,alpha:1)
        title.position = CGPoint(x:size.width/2, y:size.height*0.56)
        add(title, d:delay); delay += 0.15

        let sub = SKLabelNode(text:"The Shattered Crown")
        sub.fontName = "Georgia-Italic"
        sub.fontSize = min(size.width*0.038, 20)
        sub.fontColor = UIColor(red:0.75,green:0.45,blue:1.0,alpha:1)
        sub.position = CGPoint(x:size.width/2, y:size.height*0.51)
        add(sub, d:delay); delay += 0.15

        // Story lines
        for (i, line) in [
            "Malgrath shattered the Crown of Radiance into three Crystal Shards.",
            "Adelynn must recover them all and restore the kingdom of Aldenmere."
        ].enumerated() {
            let l = SKLabelNode(text:line)
            l.fontName = "Georgia"; l.fontSize = min(size.width*0.028, 14)
            l.fontColor = UIColor.white.withAlphaComponent(0.80)
            l.position = CGPoint(x:size.width/2, y:size.height*0.44 - CGFloat(i)*22)
            add(l, d:delay); delay += 0.12
        }

        // Shard display
        for (i, info) in [("Shard of Dawn","Sunfield Plains"),("Shard of Dusk","Whisper Woods"),("Shard of Ember","Ashrock Summit")].enumerated() {
            let panel = buildShardPanel(name:info.0, loc:info.1)
            let xOff = CGFloat(i-1) * (min(size.width*0.28, 140))
            panel.position = CGPoint(x:size.width/2+xOff, y:size.height*0.37)
            add(panel, d:delay); delay += 0.10
        }

        // New Game button
        let newBtn = makeButton(text:"▶  Begin the Quest", fillColor:UIColor(red:0.8,green:0.35,blue:0.0,alpha:1), name:"newGame")
        newBtn.position = CGPoint(x:size.width/2, y:size.height*0.26)
        add(newBtn, d:delay); delay += 0.15
        newBtn.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to:1.04,duration:0.75), SKAction.scale(to:1.0,duration:0.75)
        ])))

        // Continue button
        if SaveManager.shared.hasSave() {
            let contBtn = makeButton(text:"▶  Continue", fillColor:UIColor(red:0.1,green:0.3,blue:0.5,alpha:1), name:"continueGame")
            contBtn.position = CGPoint(x:size.width/2, y:size.height*0.18)
            add(contBtn, d:delay)
        }

        // Controls hint
        let hint = SKLabelNode(text:"Virtual joystick (left)  ·  A=Attack  ·  B=Run  ·  X=Interact  ·  Y=Cycle Weapon")
        hint.fontName = "AvenirNext"; hint.fontSize = min(size.width*0.022, 11)
        hint.fontColor = UIColor.white.withAlphaComponent(0.4)
        hint.position = CGPoint(x:size.width/2, y:20)
        addChild(hint)
    }

    private func buildShardPanel(name: String, loc: String) -> SKNode {
        let c = SKNode()
        let w = min(size.width*0.26, 130)
        let bg = SKShapeNode(rectOf:CGSize(width:w, height:72), cornerRadius:8)
        bg.fillColor = UIColor.black.withAlphaComponent(0.50)
        bg.strokeColor = UIColor(red:0.4,green:0.5,blue:1.0,alpha:0.45); bg.lineWidth=1
        c.addChild(bg)

        // Diamond shape
        let dp = UIBezierPath()
        dp.move(to:CGPoint(x:0,y:16)); dp.addLine(to:CGPoint(x:11,y:4))
        dp.addLine(to:CGPoint(x:0,y:-16)); dp.addLine(to:CGPoint(x:-11,y:4)); dp.close()
        let gem = SKShapeNode(path:dp.cgPath)
        gem.fillColor = UIColor(red:0.4,green:0.75,blue:1.0,alpha:0.9)
        gem.strokeColor = .white; gem.lineWidth=0.8
        gem.position = CGPoint(x:0,y:20)
        c.addChild(gem)
        gem.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.rotate(byAngle:.pi*0.06,duration:1.2),
            SKAction.rotate(byAngle:-.pi*0.06,duration:1.2)
        ])))

        let nl = SKLabelNode(text:name)
        nl.fontName = "Georgia-Bold"; nl.fontSize = min(w*0.090, 11)
        nl.fontColor = UIColor(red:0.5,green:0.85,blue:1.0,alpha:1)
        nl.position = CGPoint(x:0,y:-2); nl.verticalAlignmentMode = .center
        c.addChild(nl)

        let ll = SKLabelNode(text:loc)
        ll.fontName = "Georgia"; ll.fontSize = min(w*0.076, 9)
        ll.fontColor = UIColor.white.withAlphaComponent(0.55)
        ll.position = CGPoint(x:0,y:-16); ll.verticalAlignmentMode = .center
        c.addChild(ll)
        return c
    }

    private func makeButton(text: String, fillColor: UIColor, name: String) -> SKShapeNode {
        let btn = SKShapeNode(rectOf:CGSize(width:240, height:52), cornerRadius:12)
        btn.fillColor = fillColor; btn.strokeColor = UIColor.white.withAlphaComponent(0.25); btn.lineWidth=1.5
        btn.name = name
        let l = SKLabelNode(text:text)
        l.fontName = "Georgia-Bold"; l.fontSize = 17; l.fontColor = .white
        l.verticalAlignmentMode = .center; l.name = "lbl_\(name)"
        btn.addChild(l)
        return btn
    }

    // MARK: - Touch
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard !isAnimating, let touch = touches.first else { return }
        let loc = touch.location(in: self)
        let tapped = nodes(at:loc)
        for n in tapped {
            if n.name == "newGame" || n.name == "lbl_newGame" { startNew(); return }
            if n.name == "continueGame" || n.name == "lbl_continueGame" { continueSave(); return }
        }
    }

    private func startNew() {
        isAnimating = true
        GameStore.shared.resetGame()
        transition()
    }

    private func continueSave() {
        isAnimating = true
        if !SaveManager.shared.load() { GameStore.shared.resetGame() }
        transition()
    }

    private func transition() {
        run(SKAction.sequence([
            SKAction.fadeOut(withDuration:0.4),
            SKAction.run { [weak self] in
                guard let self, let view = view else { return }
                let s = WorldScene(size:size); s.scaleMode = .aspectFill
                view.presentScene(s, transition:SKTransition.fade(withDuration:0.3))
            }
        ]))
    }
}
