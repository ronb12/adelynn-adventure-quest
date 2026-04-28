import SpriteKit
import UIKit

class GameOverScene: SKScene {

    override func didMove(to view: SKView) {
        backgroundColor = UIColor(red:0.04, green:0.0, blue:0.02, alpha:1)
        setupUI()
    }

    private func setupUI() {
        let store = GameStore.shared
        var y = size.height * 0.72

        func label(_ text: String, font: String, size fs: CGFloat, color: UIColor) -> SKLabelNode {
            let l = SKLabelNode(text:text)
            l.fontName = font; l.fontSize = fs; l.fontColor = color
            l.horizontalAlignmentMode = .center; l.verticalAlignmentMode = .center
            return l
        }

        // Background
        let bg = SKShapeNode(rectOf:size); bg.fillColor = UIColor.black.withAlphaComponent(0.70); bg.strokeColor = .clear
        addChild(bg)

        // Red vignette
        let vig = SKShapeNode(circleOfRadius:size.width*0.7)
        vig.fillColor = UIColor(red:0.5,green:0.0,blue:0.0,alpha:0.18); vig.strokeColor = .clear
        vig.position = CGPoint(x:size.width/2, y:size.height/2)
        addChild(vig)

        // GAME OVER header
        let header = label("GAME OVER", font:"Georgia-Bold", size:min(size.width*0.09,44), color:UIColor(red:1.0,green:0.2,blue:0.2,alpha:1))
        header.position = CGPoint(x:size.width/2, y:y)
        header.alpha = 0; addChild(header)
        header.run(SKAction.sequence([SKAction.wait(forDuration:0.2), SKAction.fadeIn(withDuration:0.5)]))

        y -= 40
        let sub = label("Adelynn has fallen…", font:"Georgia-Italic", size:min(size.width*0.04,18), color:UIColor.white.withAlphaComponent(0.7))
        sub.position = CGPoint(x:size.width/2, y:y)
        sub.alpha = 0; addChild(sub)
        sub.run(SKAction.sequence([SKAction.wait(forDuration:0.5), SKAction.fadeIn(withDuration:0.4)]))

        // Stats panel
        y -= 60
        let panelH: CGFloat = 130
        let panel = SKShapeNode(rectOf:CGSize(width:min(size.width*0.7,320), height:panelH), cornerRadius:12)
        panel.fillColor = UIColor.black.withAlphaComponent(0.55)
        panel.strokeColor = UIColor(red:0.6,green:0.1,blue:0.1,alpha:0.5); panel.lineWidth=1.5
        panel.position = CGPoint(x:size.width/2, y:y)
        panel.alpha = 0; addChild(panel)
        panel.run(SKAction.sequence([SKAction.wait(forDuration:0.7), SKAction.fadeIn(withDuration:0.4)]))

        let stats: [(String,String)] = [
            ("Score",  "\(store.score)"),
            ("Time",   store.elapsedFormatted),
            ("Rupees", "\(store.rupees)"),
            ("Shards", "\(store.shardsCollected)/3"),
        ]
        for (i,(key,val)) in stats.enumerated() {
            let row = SKNode()
            let kl = label(key+":", font:"AvenirNext", size:12, color:UIColor.white.withAlphaComponent(0.65))
            kl.horizontalAlignmentMode = .right; kl.position = CGPoint(x:-30,y:0)
            let vl = label(val, font:"AvenirNext-Bold", size:13, color:.white)
            vl.horizontalAlignmentMode = .left; vl.position = CGPoint(x:10,y:0)
            row.addChild(kl); row.addChild(vl)
            let cols = 2; let rows = (stats.count + cols-1) / cols
            let col = i % cols; let r = i / cols
            row.position = CGPoint(x:CGFloat(col-0)*90 - 45, y:CGFloat(rows/2 - r)*28 - 14)
            panel.addChild(row)
        }

        // Buttons
        y -= panelH/2 + 50
        addButton(text:"▶  Try Again",   name:"retry",  fill:UIColor(red:0.7,green:0.2,blue:0.0,alpha:1), at:CGPoint(x:size.width/2, y:y))
        addButton(text:"⬅  Title Screen", name:"title",  fill:UIColor(red:0.15,green:0.15,blue:0.30,alpha:1), at:CGPoint(x:size.width/2, y:y-68))
    }

    private func addButton(text: String, name: String, fill: UIColor, at pos: CGPoint) {
        let btn = SKShapeNode(rectOf:CGSize(width:220, height:50), cornerRadius:12)
        btn.fillColor = fill; btn.strokeColor = UIColor.white.withAlphaComponent(0.2); btn.lineWidth=1
        btn.position = pos; btn.name = name; btn.alpha = 0
        addChild(btn)
        btn.run(SKAction.sequence([SKAction.wait(forDuration:1.0), SKAction.fadeIn(withDuration:0.4)]))
        let l = SKLabelNode(text:text)
        l.fontName = "Georgia-Bold"; l.fontSize = 16; l.fontColor = .white
        l.verticalAlignmentMode = .center; l.name = "lbl_\(name)"
        btn.addChild(l)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let tapped = nodes(at:touch.location(in:self))
        for n in tapped {
            if n.name == "retry" || n.name == "lbl_retry" { retry(); return }
            if n.name == "title" || n.name == "lbl_title" { goTitle(); return }
        }
    }

    private func retry() {
        GameStore.shared.resetGame()
        transition(to: WorldScene.self)
    }
    private func goTitle() {
        transition(to: TitleScene.self)
    }

    private func transition<T: SKScene>(to type: T.Type) {
        run(SKAction.sequence([
            SKAction.fadeOut(withDuration:0.4),
            SKAction.run { [weak self] in
                guard let self, let view = view else { return }
                let s = T(size:size); s.scaleMode = .aspectFill
                view.presentScene(s, transition:SKTransition.fade(with:.black, duration:0.4))
            }
        ]))
    }
}
